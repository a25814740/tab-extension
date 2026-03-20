import type { SupabaseClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

export type SharePayload = {
  workspaceId: string;
  resourceType: "collection" | "folder" | "space" | "workspace";
  resourceId: string;
  permission: "view" | "comment" | "edit";
  isPublic: boolean;
};

export async function createShareLink(client: SupabaseClient, payload: SharePayload) {
  const token = nanoid();
  const authRes = await client.auth.getUser();
  const createdBy = authRes.data.user?.id;
  return client
    .from("share_links")
    .insert({
      id: crypto.randomUUID(),
      workspace_id: payload.workspaceId,
      resource_type: payload.resourceType,
      resource_id: payload.resourceId,
      permission: payload.permission,
      is_public: payload.isPublic,
      token,
      created_by: createdBy,
    })
    .select()
    .single();
}

export async function revokeShareLink(client: SupabaseClient, linkId: string) {
  return client.from("share_links").update({ revoked_at: new Date().toISOString() }).eq("id", linkId);
}

export async function acceptShareLink(client: SupabaseClient, token: string) {
  return client.functions.invoke("accept_share", {
    body: { token },
  });
}
