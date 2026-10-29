import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { authorizeOp, type AuthorizationStore, type PendingOp, type SyncEntity } from "./authorize.ts";

const SUPABASE_URL = Deno.env.get("FUNCTION_SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("FUNCTION_SUPABASE_SERVICE_ROLE_KEY") ?? "";

type Client = ReturnType<typeof createClient>;

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
  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const user = await client.auth.getUser(token);
  if (!user.data.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  const userId = user.data.user.id;

  let body: { ops?: unknown };
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid payload", { status: 400 });
  }
  const { ops } = body;
  if (!Array.isArray(ops)) {
    return new Response("Invalid payload", { status: 400 });
  }

  const store = createAuthorizationStore(client);
  const syncedIds: string[] = [];
  const failedIds: string[] = [];

  for (const op of ops as PendingOp[]) {
    try {
      // Service role bypasses RLS, so every op must be authorized against the caller's workspace first.
      const workspaceId = await authorizeOp(store, op, userId);
      await applyOp(client, op, userId, workspaceId);
      syncedIds.push(op.id);
    } catch {
      failedIds.push(op?.id);
    }
  }

  return new Response(JSON.stringify({ syncedIds, failedIds }), {
    headers: { "Content-Type": "application/json" },
  });
});

function createAuthorizationStore(client: Client): AuthorizationStore {
  return {
    async getWorkspaceOwnerId(workspaceId) {
      const { data, error } = await client.from("workspaces").select("owner_id").eq("id", workspaceId).maybeSingle();
      if (error) throw error;
      return (data?.owner_id as string | undefined) ?? null;
    },
    async getMemberRole(workspaceId, userId) {
      const { data, error } = await client
        .from("workspace_members")
        .select("role")
        .eq("workspace_id", workspaceId)
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      return (data?.role as string | undefined) ?? null;
    },
    async getRowWorkspaceId(entity, id) {
      if (entity === "tab") {
        const { data, error } = await client
          .from("tab_items")
          .select("collection_id")
          .eq("id", id)
          .maybeSingle();
        if (error) throw error;
        if (!data?.collection_id) return null;
        return this.getRowWorkspaceId("collection", data.collection_id as string);
      }
      const { data, error } = await client.from(entityToTable(entity)).select("workspace_id").eq("id", id).maybeSingle();
      if (error) throw error;
      return (data?.workspace_id as string | undefined) ?? null;
    },
  };
}

async function applyOp(client: Client, op: PendingOp, userId: string, workspaceId: string) {
  const table = entityToTable(op.entity);

  if (op.type === "create") {
    await check(client.from(table).insert(op.payload));
    if (op.entity === "collection" || op.entity === "tab") {
      await audit(client, userId, workspaceId, op.type, op.entity, op.payload);
    }
    return;
  }

  if (op.type === "update") {
    if (Array.isArray(op.payload.order)) {
      for (const item of op.payload.order as Array<{ id: string; position: number }>) {
        await check(client.from(table).update({ position: item.position }).eq("id", item.id));
      }
      return;
    }

    const id = op.payload.id as string;
    const payload = { ...op.payload };
    delete (payload as Record<string, unknown>).id;
    await check(client.from(table).update(payload).eq("id", id));
    if (op.entity === "collection" || op.entity === "tab") {
      await audit(client, userId, workspaceId, op.type, op.entity, { id, ...payload });
    }
    return;
  }

  if (op.type === "delete") {
    const id = op.payload.id as string;
    await check(client.from(table).delete().eq("id", id));
    if (op.entity === "collection" || op.entity === "tab") {
      await audit(client, userId, workspaceId, op.type, op.entity, { id });
    }
  }
}

async function check(query: PromiseLike<{ error: unknown }>) {
  const { error } = await query;
  if (error) {
    throw error;
  }
}

async function audit(
  client: Client,
  userId: string,
  workspaceId: string,
  action: string,
  entityType: string,
  payload: Record<string, unknown>
) {
  await client.from("activity_logs").insert({
    id: crypto.randomUUID(),
    workspace_id: workspaceId,
    actor_user_id: userId,
    action,
    entity_type: entityType,
    entity_id: (payload.id ?? payload.collection_id ?? payload.collectionId ?? "") as string,
    payload,
  });
}

function entityToTable(entity: SyncEntity) {
  switch (entity) {
    case "space":
      return "spaces";
    case "folder":
      return "folders";
    case "collection":
      return "collections";
    case "tab":
      return "tab_items";
  }
}
