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

export async function updateMemberRole(
  client: SupabaseClient,
  memberId: string,
  role: InvitePayload["role"]
) {
  return client.from("workspace_members").update({ role }).eq("id", memberId);
}

export async function removeMember(client: SupabaseClient, memberId: string) {
  return client.from("workspace_members").delete().eq("id", memberId);
}
