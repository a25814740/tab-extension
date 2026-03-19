import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const { ops } = await req.json();
  if (!Array.isArray(ops)) {
    return new Response("Invalid payload", { status: 400 });
  }

  // TODO: Validate ops, apply to DB, return per-op ack.
  const syncedIds = ops.map((op: { id: string }) => op.id);
  return new Response(JSON.stringify({ syncedIds, failedIds: [] }), {
    headers: { "Content-Type": "application/json" },
  });
});
