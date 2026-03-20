import { serve } from "https://deno.land/std@0.203.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? Deno.env.get("FUNCTION_SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("FUNCTION_SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("FUNCTION_SUPABASE_ANON_KEY") ?? "";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    },
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return json({ ok: true }, 200);
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
    return json(
      {
        ok: false,
        error: "missing_supabase_env",
        hasUrl: Boolean(SUPABASE_URL),
        hasServiceRoleKey: Boolean(SUPABASE_SERVICE_ROLE_KEY),
        hasAnonKey: Boolean(SUPABASE_ANON_KEY),
      },
      500
    );
  }

  if (req.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  const authHeader = req.headers.get("authorization") ?? "";
  if (!authHeader) {
    return json({ ok: false, error: "missing_authorization" }, 401);
  }

  let payload: { workspaceId?: string } = {};
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }
  const workspaceId = payload.workspaceId?.trim();
  if (!workspaceId) {
    return json({ ok: false, error: "missing_workspace_id" }, 400);
  }

  const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: authHeader,
      },
    },
  });
  const userResult = await authClient.auth.getUser();
  const userId = userResult.data.user?.id ?? null;
  if (!userId) {
    return json({ ok: false, error: "unauthorized" }, 401);
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: workspace, error: workspaceError } = await adminClient
    .from("workspaces")
    .select("id, owner_id, name, created_at, updated_at, logo_url, invite_count, points")
    .eq("id", workspaceId)
    .maybeSingle();

  if (workspaceError) {
    return json({ ok: false, error: "db_error", message: workspaceError.message, code: workspaceError.code }, 500);
  }
  if (!workspace) {
    return json({ ok: false, error: "not_found" }, 404);
  }

  if (workspace.owner_id !== userId) {
    const { data: member } = await adminClient
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!member) {
      return json({ ok: false, error: "forbidden" }, 403);
    }
  }

  const { data: spaces, error: spacesError } = await adminClient
    .from("spaces")
    .select("id, workspace_id, name, position, created_at, updated_at")
    .eq("workspace_id", workspaceId)
    .order("position", { ascending: true });
  if (spacesError) {
    return json({ ok: false, error: "db_error", message: spacesError.message, code: spacesError.code }, 500);
  }

  const { data: folders, error: foldersError } = await adminClient
    .from("folders")
    .select("id, workspace_id, space_id, parent_folder_id, name, position, created_at, updated_at")
    .eq("workspace_id", workspaceId)
    .order("position", { ascending: true });
  if (foldersError) {
    return json({ ok: false, error: "db_error", message: foldersError.message, code: foldersError.code }, 500);
  }

  const { data: collections, error: collectionsError } = await adminClient
    .from("collections")
    .select(
      "id, workspace_id, space_id, folder_id, name, note, color, position, created_by, created_at, updated_at, archived_at"
    )
    .eq("workspace_id", workspaceId)
    .order("position", { ascending: true });
  if (collectionsError) {
    return json({ ok: false, error: "db_error", message: collectionsError.message, code: collectionsError.code }, 500);
  }

  const collectionIds = (collections ?? []).map((item) => item.id);
  const { data: tabs, error: tabsError } =
    collectionIds.length > 0
      ? await adminClient
          .from("tab_items")
          .select("id, collection_id, title, url, favicon_url, note, position, created_at, updated_at")
          .in("collection_id", collectionIds)
          .order("position", { ascending: true })
      : { data: [], error: null };

  if (tabsError) {
    return json({ ok: false, error: "db_error", message: tabsError.message, code: tabsError.code }, 500);
  }

  return json({
    ok: true,
    workspace: {
      id: workspace.id,
      ownerId: workspace.owner_id,
      name: workspace.name,
      logoUrl: workspace.logo_url ?? null,
      inviteCount: workspace.invite_count ?? 0,
      points: workspace.points ?? 0,
      createdAt: workspace.created_at,
      updatedAt: workspace.updated_at,
    },
    spaces: (spaces ?? []).map((space) => ({
      id: space.id,
      workspaceId: space.workspace_id,
      name: space.name,
      position: space.position,
      createdAt: space.created_at,
      updatedAt: space.updated_at,
    })),
    folders: (folders ?? []).map((folder) => ({
      id: folder.id,
      workspaceId: folder.workspace_id,
      spaceId: folder.space_id,
      parentFolderId: folder.parent_folder_id,
      name: folder.name,
      position: folder.position,
      createdAt: folder.created_at,
      updatedAt: folder.updated_at,
    })),
    collections: (collections ?? []).map((collection) => ({
      id: collection.id,
      workspaceId: collection.workspace_id,
      spaceId: collection.space_id,
      folderId: collection.folder_id,
      name: collection.name,
      note: collection.note,
      color: collection.color,
      position: collection.position,
      createdBy: collection.created_by,
      createdAt: collection.created_at,
      updatedAt: collection.updated_at,
      archivedAt: collection.archived_at,
    })),
    tabs: (tabs ?? []).map((tab) => ({
      id: tab.id,
      collectionId: tab.collection_id,
      title: tab.title,
      url: tab.url,
      faviconUrl: tab.favicon_url,
      note: tab.note,
      position: tab.position,
      createdAt: tab.created_at,
      updatedAt: tab.updated_at,
    })),
  });
});
