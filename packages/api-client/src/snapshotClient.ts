import type { SupabaseClient } from "@supabase/supabase-js";

export type WorkspaceSnapshotResult = {
  ok: boolean;
  workspace: {
    id: string;
    ownerId: string;
    name: string;
    logoUrl?: string | null;
    inviteCount?: number | null;
    points?: number | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  spaces: Array<{
    id: string;
    workspaceId: string;
    name: string;
    position: number;
    createdAt: string;
    updatedAt: string;
  }>;
  folders: Array<{
    id: string;
    workspaceId: string;
    spaceId: string;
    parentFolderId: string | null;
    name: string;
    position: number;
    createdAt: string;
    updatedAt: string;
  }>;
  collections: Array<{
    id: string;
    workspaceId: string;
    spaceId: string;
    folderId: string | null;
    name: string;
    note: string | null;
    color: string | null;
    position: number;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    archivedAt: string | null;
  }>;
  tabs: Array<{
    id: string;
    collectionId: string;
    title: string;
    url: string;
    faviconUrl: string | null;
    note: string | null;
    position: number;
    createdAt: string;
    updatedAt: string;
  }>;
};

export async function fetchWorkspaceSnapshot(
  client: SupabaseClient,
  workspaceId: string,
  options?: { accessToken?: string | null; anonKey?: string | null }
) {
  const headers: Record<string, string> = {};
  if (options?.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }
  if (options?.anonKey) {
    headers.apikey = options.anonKey;
  }
  return client.functions.invoke<WorkspaceSnapshotResult>("workspace_snapshot", {
    body: { workspaceId },
    headers,
  });
}
