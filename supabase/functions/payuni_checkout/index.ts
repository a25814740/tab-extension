import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("FUNCTION_SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("FUNCTION_SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("FUNCTION_SUPABASE_ANON_KEY") ?? "";

const PAYUNI_MERCHANT_ID = Deno.env.get("PAYUNI_MERCHANT_ID") ?? "";
const PAYUNI_HASH_KEY = Deno.env.get("PAYUNI_HASH_KEY") ?? "";
const PAYUNI_HASH_IV = Deno.env.get("PAYUNI_HASH_IV") ?? "";
const PAYUNI_RETURN_URL = Deno.env.get("PAYUNI_RETURN_URL") ?? "";
const PAYUNI_NOTIFY_URL = Deno.env.get("PAYUNI_NOTIFY_URL") ?? "";
const PAYUNI_CHECKOUT_URL = Deno.env.get("PAYUNI_CHECKOUT_URL") ?? "";
const PAYUNI_VERSION = Deno.env.get("PAYUNI_VERSION") ?? "1.5";

type PlanId = "personal_yearly" | "pro_monthly";

const PLAN_CATALOG: Record<PlanId, { amount: number; label: string }> = {
  personal_yearly: { amount: 99, label: "Personal yearly" },
  pro_monthly: { amount: 0, label: "Pro monthly" },
};

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

function html(body: string, status = 200) {
  return new Response(body, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      // Allow auto-submit + form POST even if the platform applies sandbox defaults.
      "Content-Security-Policy":
        "sandbox allow-forms allow-scripts allow-popups allow-top-navigation-by-user-activation",
    },
  });
}

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

async function sha256(text: string) {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(digest).toUpperCase();
}

function encodeQuery(data: Record<string, string>) {
  return Object.entries(data)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

async function buildTradeInfo(data: Record<string, string>) {
  const tradeInfo = encodeQuery(data);
  const keyBytes = new TextEncoder().encode(PAYUNI_HASH_KEY);
  const ivBytes = new TextEncoder().encode(PAYUNI_HASH_IV);
  const tradeBytes = new TextEncoder().encode(tradeInfo);
  const cryptoKey = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-CBC" }, false, ["encrypt"]);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-CBC", iv: ivBytes }, cryptoKey, tradeBytes);
  return toHex(encrypted);
}

async function buildTradeSha(tradeInfo: string) {
  const raw = `HashKey=${PAYUNI_HASH_KEY}&TradeInfo=${tradeInfo}&HashIV=${PAYUNI_HASH_IV}`;
  return sha256(raw);
}

function buildOrderId() {
  const random = crypto.randomUUID().slice(0, 8).replace(/-/g, "");
  return `TBY${Date.now()}${random}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return json({ ok: true }, 200);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
    return json({ ok: false, error: "missing_supabase_env" }, 500);
  }
  if (!PAYUNI_MERCHANT_ID || !PAYUNI_HASH_KEY || !PAYUNI_HASH_IV || !PAYUNI_RETURN_URL || !PAYUNI_NOTIFY_URL) {
    return json({ ok: false, error: "missing_payuni_env" }, 500);
  }
  if (!PAYUNI_CHECKOUT_URL) {
    return json({ ok: false, error: "missing_payuni_checkout_url" }, 500);
  }

  const url = new URL(req.url);
  const planFromQuery = url.searchParams.get("plan") ?? "";
  const tokenFromQuery = url.searchParams.get("token") ?? "";

  let payload: Record<string, unknown> = {};
  if (req.method === "POST") {
    try {
      payload = await req.json();
    } catch {
      payload = {};
    }
  }
  const planId = ((payload.planId as string) ?? planFromQuery).trim() as PlanId;
  if (!planId || !(planId in PLAN_CATALOG)) {
    return json({ ok: false, error: "invalid_plan" }, 400);
  }
  const plan = PLAN_CATALOG[planId];
  if (!plan.amount || plan.amount <= 0) {
    return json({ ok: false, error: "plan_not_available" }, 400);
  }

  const authHeader = req.headers.get("authorization") ?? (tokenFromQuery ? `Bearer ${tokenFromQuery}` : "");
  if (!authHeader) {
    return json({ ok: false, error: "missing_authorization" }, 401);
  }

  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const userResult = await authClient.auth.getUser();
  const user = userResult.data.user;
  if (!user?.id || !user.email) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const orderId = buildOrderId();
  const now = Math.floor(Date.now() / 1000).toString();
  const tradeInfo = await buildTradeInfo({
    MerchantID: PAYUNI_MERCHANT_ID,
    RespondType: "JSON",
    TimeStamp: now,
    Version: PAYUNI_VERSION,
    MerchantOrderNo: orderId,
    Amt: String(plan.amount),
    ItemDesc: `Toby ${plan.label}`,
    Email: user.email,
    ReturnURL: PAYUNI_RETURN_URL,
    NotifyURL: PAYUNI_NOTIFY_URL,
  });
  const tradeSha = await buildTradeSha(tradeInfo);

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  await adminClient.from("payments").insert({
    user_id: user.id,
    amount: plan.amount,
    currency: "TWD",
    status: "pending",
    provider: "payuni",
    provider_order_id: orderId,
    raw_payload: { planId },
  });
  await adminClient.from("payment_events").insert({
    user_id: user.id,
    event_type: "payuni_checkout",
    payload: { planId, orderId },
  });

  const htmlBody = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Redirecting...</title>
  </head>
  <body>
    <form id="payuni-form" method="post" action="${PAYUNI_CHECKOUT_URL}">
      <input type="hidden" name="MerchantID" value="${PAYUNI_MERCHANT_ID}" />
      <input type="hidden" name="TradeInfo" value="${tradeInfo}" />
      <input type="hidden" name="TradeSha" value="${tradeSha}" />
      <input type="hidden" name="Version" value="${PAYUNI_VERSION}" />
      <noscript>
        <p>JavaScript 已被停用，請手動按下按鈕繼續付款。</p>
        <button type="submit">繼續前往付款</button>
      </noscript>
    </form>
    <script>
      document.getElementById("payuni-form").submit();
    </script>
  </body>
</html>`;

  return req.method === "POST" ? json({ ok: true, checkoutUrl: url.toString() }) : html(htmlBody, 200);
});
