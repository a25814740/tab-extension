import { serve } from "https://deno.land/std@0.203.0/http/server.ts";

const RETURN_URL = Deno.env.get("PAYUNI_RETURN_URL") ?? "";

serve((req) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }
  if (RETURN_URL) {
    return Response.redirect(RETURN_URL, 302);
  }
  return new Response("Payment received. You can return to the extension.", {
    headers: { "Content-Type": "text/plain" },
  });
});
