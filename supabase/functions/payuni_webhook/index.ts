import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("FUNCTION_SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("FUNCTION_SUPABASE_SERVICE_ROLE_KEY") ?? "";
const PAYUNI_MERCHANT_ID = Deno.env.get("PAYUNI_MERCHANT_ID") ?? "";
const PAYUNI_HASH_KEY = Deno.env.get("PAYUNI_HASH_KEY") ?? "";
const PAYUNI_HASH_IV = Deno.env.get("PAYUNI_HASH_IV") ?? "";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    },
  });
}

async function parsePayload(req: Request) {
  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await req.json()) as Record<string, unknown>;
  }
  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    return Object.fromEntries([...form.entries()].map(([key, value]) => [key, typeof value === "string" ? value : value.name]));
  }
  const raw = await req.text();
  if (!raw.trim()) {
    return {};
  }
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return Object.fromEntries(new URLSearchParams(raw).entries());
  }
}

function isSuccess(payload: Record<string, unknown>) {
  const status = String(payload.Status ?? payload.status ?? "").toLowerCase();
  return status === "success" || status === "paid";
}

function resolvePlanId(rawPayload: Record<string, unknown> | null) {
  const planId = String(rawPayload?.planId ?? "");
  if (planId === "personal_yearly" || planId === "pro_monthly" || planId === "enterprise") {
    return planId;
  }
  return "personal_yearly";
}

function resolvePaidEndsAt(planId: string, now: Date) {
  if (planId === "pro_monthly") {
    return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
  if (planId === "enterprise") {
    return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  }
  return new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return json({ ok: true }, 200);
  }
  if (req.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json({ ok: false, error: "missing_supabase_env" }, 500);
  }
  if (!PAYUNI_MERCHANT_ID || !PAYUNI_HASH_KEY || !PAYUNI_HASH_IV) {
    return json({ ok: false, error: "missing_payuni_env" }, 500);
  }

  let payload: Record<string, unknown> = {};
  try {
    payload = await parsePayload(req);
  } catch {
    payload = {};
  }

  const orderId = (
    payload.merchant_order_no ??
    payload.MerchantOrderNo ??
    payload.order_id ??
    payload.MerTradeNo ??
    null
  ) as string | null;
  const amount = Number(payload.amount ?? payload.Amt ?? payload.TradeAmt ?? 0);
  const status = String(payload.Status ?? payload.status ?? "unknown");
  const providerTx = (payload.trade_no ?? payload.TradeNo ?? payload.PayUniTradeNo ?? null) as string | null;

  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const existingPayment = orderId
    ? await client
        .from("payments")
        .select("id, user_id, raw_payload")
        .eq("provider_order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null, error: null };

  const userId = (payload.user_id ?? payload.UserId ?? existingPayment.data?.user_id ?? null) as string | null;

  const paymentMutation = existingPayment.data?.id
    ? await client
        .from("payments")
        .update({
          amount: amount || 0,
          status,
          provider_transaction_id: providerTx,
          raw_payload: payload,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingPayment.data.id)
    : userId
      ? await client.from("payments").insert({
          user_id: userId,
          amount,
          currency: "TWD",
          status,
          provider: "payuni",
          provider_transaction_id: providerTx,
          provider_order_id: orderId,
          raw_payload: payload,
        })
      : { error: null };

  await client.from("payment_events").insert({
    user_id: userId,
    event_type: "payuni_webhook",
    payload,
  });

  if (!paymentMutation.error && userId && isSuccess(payload)) {
    const planId = resolvePlanId((existingPayment.data?.raw_payload as Record<string, unknown>) ?? null);
    const now = new Date();
    const paidStartsAt = now.toISOString();
    const paidEndsAt = resolvePaidEndsAt(planId, now).toISOString();
    await client.from("memberships").upsert(
      {
        user_id: userId,
        plan_type: planId,
        status: "paid_active",
        paid_starts_at: paidStartsAt,
        paid_ends_at: paidEndsAt,
        payment_provider: "payuni",
        provider_order_id: orderId,
      },
      { onConflict: "user_id" }
    );
    await client.from("entitlements").upsert(
      {
        user_id: userId,
        feature_key: "can_use_byo_ai",
        is_enabled: true,
        source: "paid",
      },
      { onConflict: "user_id,feature_key" }
    );
  }

  return json({ ok: true });
});
