import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Prefer Supabase-managed env vars; fall back to our prefixed secrets.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("FUNCTION_SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("FUNCTION_SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SHARE_PUBLIC_URL = Deno.env.get("SHARE_PUBLIC_URL") ?? Deno.env.get("FUNCTION_SHARE_PUBLIC_URL") ?? "";

function json(body: unknown, status = 200, extraHeaders: HeadersInit = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      // Allow opening from normal pages and extension contexts.
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, apikey, content-type",
      ...extraHeaders,
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return json({ ok: true }, 200);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return json(
      {
        ok: false,
        error: "missing_supabase_env",
        hasUrl: Boolean(SUPABASE_URL),
        hasServiceRoleKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
      },
      500
    );
  }

  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return json({ ok: false, error: "missing_token" }, 400);
  }

  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data, error } = await client
    .from("share_links")
    .select("resource_type, resource_id, permission, is_public, revoked_at")
    .eq("token", token)
    .maybeSingle();

  if (error) {
    console.error("share function db error", { message: error.message, code: error.code });
    return json({ ok: false, error: "db_error", message: error.message, code: error.code }, 500);
  }

  if (!data || data.revoked_at) {
    return json({ ok: false, error: "not_found" }, 404);
  }

  const accepts = req.headers.get("accept") ?? "";
  const wantsHtml = accepts.includes("text/html");
  if (wantsHtml && SHARE_PUBLIC_URL) {
    const redirect = new URL(SHARE_PUBLIC_URL);
    redirect.searchParams.set("token", token);
    return Response.redirect(redirect.toString(), 302);
  }

  return json({ ok: true, share: data }, 200);
});
