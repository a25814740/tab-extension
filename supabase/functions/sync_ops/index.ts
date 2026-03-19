import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type PendingOp = {
  id: string;
  type: "create" | "update" | "delete";
  entity: "space" | "folder" | "collection" | "tab";
  payload: Record<string, unknown>;
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return new Response("Missing Supabase env", { status: 500 });
  }

  const { ops } = await req.json();
  if (!Array.isArray(ops)) {
    return new Response("Invalid payload", { status: 400 });
  }

  const client = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const syncedIds: string[] = [];
  const failedIds: string[] = [];

  for (const op of ops as PendingOp[]) {
    try {
      await applyOp(client, op);
      syncedIds.push(op.id);
    } catch {
      failedIds.push(op.id);
    }
  }

  return new Response(JSON.stringify({ syncedIds, failedIds }), {
    headers: { "Content-Type": "application/json" },
  });
});

async function applyOp(client: ReturnType<typeof createClient>, op: PendingOp) {
  const table = entityToTable(op.entity);
  if (!table) {
    throw new Error("Unknown entity");
  }

  if (op.type === "create") {
    await client.from(table).insert(op.payload);
    return;
  }

  if (op.type === "update") {
    if (Array.isArray(op.payload.order)) {
      for (const item of op.payload.order as Array<{ id: string; position: number }>) {
        await client.from(table).update({ position: item.position }).eq("id", item.id);
      }
      return;
    }

    const id = op.payload.id as string | undefined;
    if (!id) {
      throw new Error("Missing id for update");
    }
    const payload = { ...op.payload };
    delete (payload as Record<string, unknown>).id;
    await client.from(table).update(payload).eq("id", id);
    return;
  }

  if (op.type === "delete") {
    const id = op.payload.id as string | undefined;
    if (!id) {
      throw new Error("Missing id for delete");
    }
    await client.from(table).delete().eq("id", id);
  }
}

function entityToTable(entity: PendingOp["entity"]) {
  switch (entity) {
    case "space":
      return "spaces";
    case "folder":
      return "folders";
    case "collection":
      return "collections";
    case "tab":
      return "tab_items";
    default:
      return null;
  }
}
