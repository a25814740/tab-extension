export type Role = "owner" | "admin" | "editor" | "commenter" | "viewer";

export type User = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type Workspace = {
  id: string;
  ownerId: string;
  name: string;
  logoUrl?: string | null;
  inviteCount?: number | null;
  points?: number | null;
  createdAt: string;
  updatedAt: string;
};

export type WorkspaceMember = {
  id: string;
  workspaceId: string;
  userId: string;
  role: Role;
  createdAt: string;
};

export type Space = {
  id: string;
  workspaceId: string;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type Folder = {
  id: string;
  workspaceId: string;
  spaceId: string;
  parentFolderId: string | null;
  name: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type Collection = {
  id: string;
  workspaceId: string;
  spaceId: string;
  folderId: string | null;
  name: string;
  note: string | null;
  color: string | null;
  starred?: boolean | null;
  position: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
};

export type TabItem = {
  id: string;
  collectionId: string;
  title: string;
  url: string;
  faviconUrl: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  screenshotUrl?: string | null;
  note: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
};

export type Tag = {
  id: string;
  workspaceId: string;
  name: string;
  color: string | null;
};

export type CollectionTag = {
  collectionId: string;
  tagId: string;
};

export type ShareLink = {
  id: string;
  workspaceId: string;
  resourceType: "collection" | "folder" | "space";
  resourceId: string;
  permission: "view" | "comment" | "edit";
  isPublic: boolean;
  token: string;
  createdBy: string;
  createdAt: string;
  revokedAt: string | null;
};

export type ActivityLog = {
  id: string;
  workspaceId: string;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type AiSuggestion = {
  id: string;
  workspaceId: string;
  sourceType: "open_tabs" | "collection";
  sourceId: string | null;
  kind: "naming" | "grouping" | "classification" | "cleanup";
  inputHash: string;
  result: Record<string, unknown>;
  createdAt: string;
};

export type PendingOp = {
  id: string;
  type: "create" | "update" | "delete";
  entity: "space" | "folder" | "collection" | "tab";
  payload: Record<string, unknown>;
  createdAt: string;
};

export type LocalAppCache = {
  version: number;
  currentUserId: string | null;
  selectedWorkspaceId: string | null;
  selectedSpaceId: string | null;
  selectedCollectionId?: string | null;
  expandedFolderIds: string[];
  ui: {
    theme: "light" | "dark" | "system";
    sidebarCollapsed: boolean;
    viewMode: "grid" | "list" | "compact" | "image";
    sortMode: "custom" | "recent" | "name" | "createdAt";
  };
  pendingOps: PendingOp[];
  lastSyncAt: string | null;
  lastSyncError?: string | null;
  nextSyncRetryAt?: string | null;
};
