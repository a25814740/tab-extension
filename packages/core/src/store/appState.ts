import type { Collection, Folder, LocalAppCache, Space, TabItem, Workspace } from "../domain/models";
import type { LocalStoreSnapshot } from "../schemas/appSchemas";

export type AppState = {
  workspace: Workspace | null;
  spaces: Space[];
  folders: Folder[];
  collections: Collection[];
  tabs: TabItem[];
  cache: LocalAppCache;
  rollbackStack: LocalStoreSnapshot[];
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
  lastSyncError: null,
  nextSyncRetryAt: null,
};

export const defaultAppState: AppState = {
  workspace: null,
  spaces: [],
  folders: [],
  collections: [],
  tabs: [],
  cache: defaultCache,
  rollbackStack: [],
};
