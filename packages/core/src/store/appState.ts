import type { Collection, Folder, LocalAppCache, Space, TabItem, Workspace } from "../domain/models";

export type AppState = {
  workspace: Workspace | null;
  spaces: Space[];
  folders: Folder[];
  collections: Collection[];
  tabs: TabItem[];
  cache: LocalAppCache;
};

export const defaultCache: LocalAppCache = {
  version: 1,
  currentUserId: null,
  selectedWorkspaceId: null,
  selectedSpaceId: null,
  expandedFolderIds: [],
  ui: {
    theme: "system",
    sidebarCollapsed: false,
    viewMode: "grid",
    sortMode: "custom",
  },
  pendingOps: [],
  lastSyncAt: null,
};

export const defaultAppState: AppState = {
  workspace: null,
  spaces: [],
  folders: [],
  collections: [],
  tabs: [],
  cache: defaultCache,
};