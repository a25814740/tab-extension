import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("FUNCTION_SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("FUNCTION_SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("FUNCTION_SUPABASE_ANON_KEY") ?? "";

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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return json({ ok: true }, 200);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
    return json({ ok: false, error: "missing_supabase_env" }, 500);
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader) {
    return json({ ok: false, error: "missing_authorization" }, 401);
  }

  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });

  const userResult = await authClient.auth.getUser();
  const userId = userResult.data.user?.id ?? null;
  if (!userId) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: assets, error: assetsError } = await adminClient
    .from("theme_assets")
    .select("id,name,price_twd,revenue_share_percent,is_public,updated_at")
    .eq("author_user_id", userId)
    .order("updated_at", { ascending: false });

  if (assetsError) {
    return json({ ok: false, error: "asset_query_failed", message: assetsError.message }, 500);
  }

  const assetRows = assets ?? [];
  const assetIds = assetRows.map((asset) => asset.id);
  const publishedCount = assetRows.filter((asset) => asset.is_public).length;
  const draftCount = assetRows.length - publishedCount;

  if (assetIds.length === 0) {
    return json({
      ok: true,
      analytics: {
        publishedCount,
        draftCount,
        paidOrderCount: 0,
        installCount: 0,
        grossRevenueTwd: 0,
        creatorRevenueTwd: 0,
        recentOrders: [],
        updatedAt: null,
      },
    });
  }

  const { data: purchases, error: purchasesError } = await adminClient
    .from("theme_asset_purchases")
    .select("id,asset_id,amount_twd,status,created_at")
    .in("asset_id", assetIds)
    .order("created_at", { ascending: false });

  if (purchasesError) {
    return json({ ok: false, error: "purchase_query_failed", message: purchasesError.message }, 500);
  }

  const { data: installs, error: installsError } = await adminClient
    .from("theme_asset_installs")
    .select("id,asset_id,is_active,installed_at")
    .in("asset_id", assetIds);

  if (installsError) {
    return json({ ok: false, error: "install_query_failed", message: installsError.message }, 500);
  }

  const assetById = new Map(assetRows.map((asset) => [asset.id, asset]));
  const successfulPurchases = (purchases ?? []).filter((purchase) => purchase.status === "paid" || purchase.status === "completed");
  const grossRevenueTwd = successfulPurchases.reduce((sum, purchase) => sum + (purchase.amount_twd ?? 0), 0);
  const creatorRevenueTwd = successfulPurchases.reduce((sum, purchase) => {
    const asset = assetById.get(purchase.asset_id);
    const share = asset?.revenue_share_percent ?? 0;
    return sum + Math.round((purchase.amount_twd ?? 0) * (share / 100));
  }, 0);

  const recentOrders = successfulPurchases.slice(0, 8).map((purchase) => ({
    id: purchase.id,
    assetId: purchase.asset_id,
    assetName: assetById.get(purchase.asset_id)?.name ?? "未命名主題",
    amountTwd: purchase.amount_twd ?? 0,
    status: purchase.status,
    createdAt: purchase.created_at,
  }));

  const installCount = (installs ?? []).filter((install) => install.is_active).length;
  const updatedAt = assetRows[0]?.updated_at ?? null;

  return json({
    ok: true,
    analytics: {
      publishedCount,
      draftCount,
      paidOrderCount: successfulPurchases.length,
      installCount,
      grossRevenueTwd,
      creatorRevenueTwd,
      recentOrders,
      updatedAt,
    },
  });
});
