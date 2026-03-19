import { z } from "zod";

export const tabItemSchema = z.object({
  id: z.string(),
  collectionId: z.string(),
  title: z.string(),
  url: z.string().url(),
  faviconUrl: z.string().nullable(),
  note: z.string().nullable(),
  position: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const collectionSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  spaceId: z.string(),
  folderId: z.string().nullable(),
  name: z.string(),
  note: z.string().nullable(),
  color: z.string().nullable(),
  position: z.number().int(),
  createdBy: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  archivedAt: z.string().nullable(),
});

export const folderSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  spaceId: z.string(),
  parentFolderId: z.string().nullable(),
  name: z.string(),
  position: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const spaceSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  name: z.string(),
  position: z.number().int(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const workspaceSchema = z.object({
  id: z.string(),
  ownerId: z.string(),
  name: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const localCacheSchema = z.object({
  version: z.number(),
  currentUserId: z.string().nullable(),
  selectedWorkspaceId: z.string().nullable(),
  selectedSpaceId: z.string().nullable(),
  selectedCollectionId: z.string().nullable().optional(),
  expandedFolderIds: z.string().array(),
  ui: z.object({
    theme: z.enum(["light", "dark", "system"]),
    sidebarCollapsed: z.boolean(),
    viewMode: z.enum(["grid", "list"]),
    sortMode: z.enum(["custom", "recent", "name", "createdAt"]),
  }),
  pendingOps: z
    .object({
      id: z.string(),
      type: z.enum(["create", "update", "delete"]),
      entity: z.enum(["space", "folder", "collection", "tab"]),
      payload: z.record(z.unknown()),
      createdAt: z.string(),
    })
    .array(),
  lastSyncAt: z.string().nullable(),
  lastSyncError: z.string().nullable().optional(),
  nextSyncRetryAt: z.string().nullable().optional(),
});

export type LocalCacheInput = z.infer<typeof localCacheSchema>;

export const localSnapshotSchema = z.object({
  workspace: workspaceSchema.nullable(),
  spaces: spaceSchema.array(),
  folders: folderSchema.array(),
  collections: collectionSchema.array(),
  tabs: tabItemSchema.array(),
  cache: localCacheSchema,
});

export type LocalStoreSnapshot = z.infer<typeof localSnapshotSchema>;
