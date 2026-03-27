import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Payload = {
  email: string;
  workspaceId: string;
  role: "owner" | "admin" | "editor" | "commenter" | "viewer";
};

const SUPABASE_URL = Deno.env.get("FUNCTION_SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("FUNCTION_SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response("Missing Supabase env", { status: 500 });
  }

  const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response("Unauthorized", { status: 401 });
  }
  const token = authHeader.replace("Bearer ", "");

  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  });

  const authed = await client.auth.getUser();
  if (!authed.data.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const body = (await req.json()) as Payload;
  if (!body?.email || !body?.workspaceId || !body?.role) {
    return new Response("Invalid payload", { status: 400 });
  }

  // Invite user by email (creates user in auth.users if not exists).
  const invite = await client.auth.admin.inviteUserByEmail(body.email);
  if (invite.error || !invite.data.user?.id) {
    return new Response(invite.error?.message ?? "Invite failed", { status: 400 });
  }

  const insert = await client.from("workspace_members").insert({
    workspace_id: body.workspaceId,
    user_id: invite.data.user.id,
    role: body.role,
  });
  if (insert.error) {
    return new Response(insert.error.message, { status: 400 });
  }

  return new Response(JSON.stringify({ ok: true, userId: invite.data.user.id }), {
    headers: { "Content-Type": "application/json" },
  });
});
