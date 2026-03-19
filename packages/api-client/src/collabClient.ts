import type { SupabaseClient } from "@supabase/supabase-js";

export type InvitePayload = {
  workspaceId: string;
  userId: string;
  role: "owner" | "admin" | "editor" | "commenter" | "viewer";
};

export async function inviteMember(client: SupabaseClient, payload: InvitePayload) {
  return client.from("workspace_members").insert({
    workspace_id: payload.workspaceId,
    user_id: payload.userId,
    role: payload.role,
  });
}
