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
type CheckoutKind = "membership" | "theme_asset";

type ThemeAssetRow = {
  id: string;
  name: string;
  slug: string;
  price_twd: number;
  asset_type: "theme" | "template";
  is_public: boolean;
};

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

async function buildEncryptInfo(data: Record<string, string>) {
  const tradeInfo = encodeQuery(data);
  const keyBytes = new TextEncoder().encode(PAYUNI_HASH_KEY);
  const ivBytes = new TextEncoder().encode(PAYUNI_HASH_IV);
  const tradeBytes = new TextEncoder().encode(tradeInfo);
  const cryptoKey = await crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, ["encrypt"]);
  const encrypted = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: ivBytes, tagLength: 128 }, cryptoKey, tradeBytes)
  );
  const tagLength = 16;
  const cipherBytes = encrypted.slice(0, Math.max(0, encrypted.length - tagLength));
  const tagBytes = encrypted.slice(Math.max(0, encrypted.length - tagLength));
  const merged = `${btoa(String.fromCharCode(...cipherBytes))}:::${btoa(String.fromCharCode(...tagBytes))}`;
  return toHex(new TextEncoder().encode(merged));
}

async function buildHashInfo(encryptInfo: string) {
  const raw = `${PAYUNI_HASH_KEY}${encryptInfo}${PAYUNI_HASH_IV}`;
  return sha256(raw);
}

function buildOrderId(prefix: CheckoutKind) {
  const random = crypto.randomUUID().slice(0, 8).replace(/-/g, "");
  const head = prefix === "theme_asset" ? "TBT" : "TBY";
  return `${head}${Date.now()}${random}`;
}

function resolveCheckoutKind(input: string | undefined | null): CheckoutKind {
  return input === "theme_asset" ? "theme_asset" : "membership";
}

function readBodyValue(payload: Record<string, unknown>, key: string) {
  const value = payload[key];
  return typeof value === "string" ? value.trim() : "";
}

async function resolveThemeAsset(
  authClient: ReturnType<typeof createClient>,
  assetId: string
): Promise<ThemeAssetRow | null> {
  const { data, error } = await authClient
    .from("theme_assets")
    .select("id,name,slug,price_twd,asset_type,is_public")
    .eq("id", assetId)
    .eq("asset_type", "theme")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return (data as ThemeAssetRow | null) ?? null;
}

async function hasPaidThemePurchase(
  adminClient: ReturnType<typeof createClient>,
  params: { assetId: string; userId: string }
) {
  const { data, error } = await adminClient
    .from("theme_asset_purchases")
    .select("id,status")
    .eq("asset_id", params.assetId)
    .eq("buyer_user_id", params.userId)
    .in("status", ["paid", "completed", "success", "succeeded"])
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data?.id);
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
  const tokenFromQuery = url.searchParams.get("token") ?? "";
  const kindFromQuery = resolveCheckoutKind(url.searchParams.get("kind"));

  let payload: Record<string, unknown> = {};
  if (req.method === "POST") {
    try {
      payload = await req.json();
    } catch {
      payload = {};
    }
  }

  const checkoutKind = resolveCheckoutKind(readBodyValue(payload, "kind") || kindFromQuery);
  const authHeader = req.headers.get("authorization") || (tokenFromQuery ? `Bearer ${tokenFromQuery}` : "");
  if (!authHeader) {
    return json({ ok: false, error: "missing_authorization" }, 401);
  }

  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });

  let user: { id?: string; email?: string } | null = null;
  if (SUPABASE_URL.includes("127.0.0.1") || SUPABASE_URL.includes("localhost")) {
    // Local dev mode: manually decode the JWT payload since local GoTrue doesn't have the Cloud's JWT secret
    try {
      const tokenString = authHeader.replace("Bearer ", "").trim();
      const payloadPart = tokenString.split(".")[1];
      if (payloadPart) {
        let base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
        while (base64.length % 4) {
          base64 += "=";
        }
        const decoded = JSON.parse(atob(base64));
        user = { id: decoded.sub, email: decoded.email };
      }
    } catch (e) {
      console.log("[JWT Decode Error]", e);
      // Ignore inner parse errors, fall through to check below
    }
  } else {
    const userResult = await authClient.auth.getUser();
    user = userResult.data?.user ?? null;
  }

  if (!user?.id || !user.email) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  let amount = 0;
  let label = "";
  let rawPayload: Record<string, unknown> = { kind: checkoutKind };
  let themeAssetId: string | null = null;

  if (checkoutKind === "membership") {
    const planId = (readBodyValue(payload, "planId") || url.searchParams.get("plan") || "").trim() as PlanId;
    if (!planId || !(planId in PLAN_CATALOG)) {
      return json({ ok: false, error: "invalid_plan" }, 400);
    }
    const plan = PLAN_CATALOG[planId];
    if (!plan.amount || plan.amount <= 0) {
      return json({ ok: false, error: "plan_not_available" }, 400);
    }
    amount = plan.amount;
    label = `Toby ${plan.label}`;
    rawPayload = { kind: "membership", planId };
  } else {
    const assetId = readBodyValue(payload, "assetId") || (url.searchParams.get("assetId") ?? "").trim();
    if (!assetId) {
      return json({ ok: false, error: "missing_asset_id" }, 400);
    }

    const asset = await resolveThemeAsset(authClient, assetId);
    if (!asset) {
      return json({ ok: false, error: "asset_not_found" }, 404);
    }
    if (!asset.is_public) {
      return json({ ok: false, error: "asset_not_public" }, 403);
    }
    if (!asset.price_twd || asset.price_twd <= 0) {
      return json({ ok: false, error: "asset_not_paid" }, 400);
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    if (await hasPaidThemePurchase(adminClient, { assetId, userId: user.id })) {
      return json({ ok: false, error: "asset_already_owned" }, 409);
    }

    amount = asset.price_twd;
    label = `Taboard Theme ${asset.name}`;
    themeAssetId = asset.id;
    rawPayload = {
      kind: "theme_asset",
      assetId: asset.id,
      assetSlug: asset.slug,
      assetName: asset.name,
      assetType: asset.asset_type,
    };
  }

  const orderId = buildOrderId(checkoutKind);
  const now = Math.floor(Date.now() / 1000).toString();
  const encryptInfo = await buildEncryptInfo({
    MerID: PAYUNI_MERCHANT_ID,
    Timestamp: now,
    MerTradeNo: orderId,
    TradeAmt: String(amount),
    ProdDesc: label,
    UsrMail: user.email,
    ReturnURL: PAYUNI_RETURN_URL,
    NotifyURL: PAYUNI_NOTIFY_URL,
  });
  const hashInfo = await buildHashInfo(encryptInfo);
  const checkoutPayload = {
    merId: PAYUNI_MERCHANT_ID,
    encryptInfo,
    hashInfo,
    version: PAYUNI_VERSION,
    checkoutUrl: PAYUNI_CHECKOUT_URL,
  };

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  await adminClient.from("payments").insert({
    user_id: user.id,
    amount,
    currency: "TWD",
    status: "pending",
    provider: "payuni",
    provider_order_id: orderId,
    raw_payload: rawPayload,
  });

  if (checkoutKind === "theme_asset") {
    await adminClient.from("theme_asset_purchases").insert({
      asset_id: themeAssetId,
      buyer_user_id: user.id,
      amount_twd: amount,
      status: "pending",
      payment_provider: "payuni",
      provider_order_id: orderId,
    });
  }

  await adminClient.from("payment_events").insert({
    user_id: user.id,
    event_type: checkoutKind === "theme_asset" ? "payuni_checkout_theme_asset" : "payuni_checkout_membership",
    payload: { ...rawPayload, orderId, amount },
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
      <input type="hidden" name="MerID" value="${PAYUNI_MERCHANT_ID}" />
      <input type="hidden" name="EncryptInfo" value="${encryptInfo}" />
      <input type="hidden" name="HashInfo" value="${hashInfo}" />
      <input type="hidden" name="Version" value="${PAYUNI_VERSION}" />
      <noscript>
        <p>JavaScript 已停用，請手動送出付款表單。</p>
        <button type="submit">前往付款</button>
      </noscript>
    </form>
    <script>
      document.getElementById("payuni-form").submit();
    </script>
  </body>
</html>`;

  if (req.method === "POST" || req.headers.get("accept")?.includes("application/json")) {
    return json({ ok: true, checkout: checkoutPayload }, 200);
  }

  return html(htmlBody, 200);
});
