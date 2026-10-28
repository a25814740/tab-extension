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
    return json(
      {
        ok: false,
        error: "missing_supabase_env",
        hasUrl: Boolean(SUPABASE_URL),
        hasServiceRoleKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
        hasAnonKey: Boolean(SUPABASE_ANON_KEY),
      },
      500
    );
  }

  if (req.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader) {
    return json({ ok: false, error: "missing_authorization" }, 401);
  }

  let payload: { token?: string } = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }
  const token = payload.token?.trim();
  if (!token) {
    return json({ ok: false, error: "missing_token" }, 400);
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
  const { data: share, error: shareError } = await adminClient
    .from("share_links")
    .select("resource_type, resource_id, permission, is_public, revoked_at")
    .eq("token", token)
    .maybeSingle();

  if (shareError) {
    return json({ ok: false, error: "db_error", message: shareError.message, code: shareError.code }, 500);
  }
  if (!share || share.revoked_at || !share.is_public) {
    return json({ ok: false, error: "not_found" }, 404);
  }
  if (share.resource_type !== "workspace") {
    return json({ ok: false, error: "unsupported_resource" }, 400);
  }

  const roleMap: Record<string, string> = {
    view: "viewer",
    comment: "commenter",
    edit: "editor",
  };
  const role = roleMap[share.permission] ?? "viewer";

  const { data: existing } = await adminClient
    .from("workspace_members")
    .select("id, role")
    .eq("workspace_id", share.resource_id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) {
    const { error: insertError } = await adminClient.from("workspace_members").insert({
      id: crypto.randomUUID(),
      workspace_id: share.resource_id,
      user_id: userId,
      role,
    });
    if (insertError) {
      return json({ ok: false, error: "db_error", message: insertError.message, code: insertError.code }, 500);
    }
  }

  const { data: workspace, error: workspaceError } = await adminClient
    .from("workspaces")
    .select("id, owner_id, name")
    .eq("id", share.resource_id)
    .maybeSingle();

  if (workspaceError) {
    return json({ ok: false, error: "db_error", message: workspaceError.message, code: workspaceError.code }, 500);
  }

  return json({
    ok: true,
    workspace: workspace
      ? {
          id: workspace.id,
          ownerId: workspace.owner_id,
          name: workspace.name,
        }
      : null,
  });
});
