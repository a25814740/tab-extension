import type { SupabaseClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

export type SharePayload = {
  resourceType: "collection" | "folder" | "space";
  resourceId: string;
  permission: "view" | "comment" | "edit";
  isPublic: boolean;
};

export async function createShareLink(client: SupabaseClient, payload: SharePayload) {
  const token = nanoid();
  return client.from("share_links").insert({ ...payload, token }).select().single();
}

export async function revokeShareLink(client: SupabaseClient, linkId: string) {
  return client.from("share_links").update({ revoked_at: new Date().toISOString() }).eq("id", linkId);
}
