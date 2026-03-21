import { createStore } from "zustand/vanilla";
import { nanoid } from "nanoid";
import type { AppState } from "./appState";
import { defaultAppState } from "./appState";
import type { LocalStoreSnapshot } from "../schemas/appSchemas";
import type { TabItem } from "../domain/models";
import { sampleWorkspaces } from "../utils/sampleData";
import { enqueueOp, markSynced } from "../sync/pendingOps";
import { toSnapshot } from "./snapshot";
import type { SyncClient } from "../sync/syncEngine";
import { syncPendingOps } from "../sync/syncEngine";

export type TabInput = {
  title: string;
  url: string;
  favIconUrl?: string;
  pinned?: boolean;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  screenshotUrl?: string | null;
};

export type AppActions = {
  hydrate: (snapshot: LocalStoreSnapshot) => void;
  setViewMode: (mode: AppState["cache"]["ui"]["viewMode"]) => void;
  setSelectedWorkspaceId: (workspaceId: string | null) => void;
  setSelectedSpaceId: (spaceId: string | null) => void;
  setSelectedCollectionId: (collectionId: string | null) => void;
  setSortMode: (mode: AppState["cache"]["ui"]["sortMode"]) => void;
  addWorkspace: (name: string) => void;
  upsertWorkspace: (payload: { id: string; name: string; ownerId?: string | null }) => void;
  updateWorkspace: (
    workspaceId: string,
    payload: { name?: string; logoUrl?: string | null; inviteCount?: number | null; points?: number | null }
  ) => void;
  deleteWorkspace: (workspaceId: string) => void;
  addSpace: (name: string) => void;
  addCollection: (name: string) => void;
  saveCollectionFromTabs: (name: string, tabs: TabInput[]) => void;
  reorderSpaces: (activeId: string, overId: string) => void;
  reorderCollections: (activeId: string, overId: string) => void;
  reorderFolders: (activeId: string, overId: string) => void;
  reorderTabs: (activeId: string, overId: string) => void;
  toggleFolderExpanded: (folderId: string) => void;
  expandFolder: (folderId: string) => void;
  reorderCollectionsWithIndex: (activeId: string, overId: string, placeAfter: boolean) => void;
  reorderTabsWithIndex: (activeId: string, overId: string, placeAfter: boolean) => void;
  rollbackLastOp: () => void;
  flushPendingOps: (client: SyncClient) => Promise<void>;
  addTabToCollection: (collectionId: string, tab: TabInput) => void;
  updateTabMetadata: (tabId: string, payload: Partial<Pick<TabItem, "ogTitle" | "ogDescription" | "ogImage">>) => void;
  updateTab: (tabId: string, payload: Pick<TabItem, "title" | "url" | "note">) => void;
  deleteTab: (tabId: string) => void;
  moveTabToCollection: (tabId: string, collectionId: string) => void;
  updateCollectionTitle: (collectionId: string, name: string) => void;
  toggleCollectionStar: (collectionId: string) => void;
  moveCollectionWithinSpace: (collectionId: string, direction: "up" | "down") => void;
  moveCollectionToSpace: (collectionId: string, workspaceId: string, spaceId: string) => void;
  sortTabsInCollection: (collectionId: string) => void;
  deleteCollection: (collectionId: string) => void;
  dedupeTabs: () => void;
  setSyncRetryAt: (isoTime: string | null) => void;
};

export type AppStore = AppState & AppActions;

function buildInitialState(): AppState {
  const samples = sampleWorkspaces();
  const workspaces = samples.map((sample) => sample.workspace);
  const collections = samples.flatMap((sample) =>
    sample.collections.map((collection) => ({
      ...collection,
    }))
  );
  const tabs = samples.flatMap((sample) => sample.collections.flatMap((collection) => collection.tabs));
  const spaces = samples.flatMap((sample) =>
    sample.spaces.map((space) => ({
      ...space,
    }))
  );
  const folders = samples.flatMap((sample) => sample.spaces.flatMap((space) => space.folders));
  const primaryWorkspace = workspaces[0] ?? null;
  const primarySpace = spaces.find((space) => space.workspaceId === primaryWorkspace?.id) ?? null;

  return {
    ...defaultAppState,
    workspaces,
    workspace: primaryWorkspace,
    spaces,
    folders,
    collections,
    tabs,
    cache: {
      ...defaultAppState.cache,
      selectedWorkspaceId: primaryWorkspace?.id ?? null,
      selectedSpaceId: primarySpace?.id ?? null,
    },
  };
}

function pushRollback(state: AppState) {
  const snapshot = toSnapshot(state);
  const nextStack = [snapshot, ...state.rollbackStack];
  if (nextStack.length > 10) {
    nextStack.pop();
  }
  return nextStack;
}

// Central store used by New Tab and Side Panel apps.
export function createAppStore() {
  return createStore<AppStore>((set, get) => ({
    ...buildInitialState(),
    hydrate: (snapshot) => {
      const nextWorkspaces = snapshot.workspaces ?? (snapshot.workspace ? [snapshot.workspace] : []);
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const needsMigration = nextWorkspaces.some((workspace) => !uuidRegex.test(workspace.id));
      if (needsMigration) {
        const workspaceMap = new Map<string, string>();
        const spaceMap = new Map<string, string>();
        const folderMap = new Map<string, string>();
        const collectionMap = new Map<string, string>();

        nextWorkspaces.forEach((workspace) => {
          workspaceMap.set(workspace.id, crypto.randomUUID());
        });
        snapshot.spaces.forEach((space) => {
          spaceMap.set(space.id, crypto.randomUUID());
        });
        snapshot.folders.forEach((folder) => {
          folderMap.set(folder.id, crypto.randomUUID());
        });
        snapshot.collections.forEach((collection) => {
          collectionMap.set(collection.id, crypto.randomUUID());
        });

        snapshot = {
          ...snapshot,
          workspaces: nextWorkspaces.map((workspace) => ({
            ...workspace,
            id: workspaceMap.get(workspace.id) ?? workspace.id,
            ownerId: workspace.ownerId && uuidRegex.test(workspace.ownerId) ? workspace.ownerId : crypto.randomUUID(),
          })),
          workspace: snapshot.workspace
            ? {
                ...snapshot.workspace,
                id: workspaceMap.get(snapshot.workspace.id) ?? snapshot.workspace.id,
                ownerId:
                  snapshot.workspace.ownerId && uuidRegex.test(snapshot.workspace.ownerId)
                    ? snapshot.workspace.ownerId
                    : crypto.randomUUID(),
              }
            : null,
          spaces: snapshot.spaces.map((space) => ({
            ...space,
            id: spaceMap.get(space.id) ?? space.id,
            workspaceId: workspaceMap.get(space.workspaceId) ?? space.workspaceId,
          })),
          folders: snapshot.folders.map((folder) => ({
            ...folder,
            id: folderMap.get(folder.id) ?? folder.id,
            workspaceId: workspaceMap.get(folder.workspaceId) ?? folder.workspaceId,
            spaceId: spaceMap.get(folder.spaceId) ?? folder.spaceId,
            parentFolderId: folder.parentFolderId ? folderMap.get(folder.parentFolderId) ?? folder.parentFolderId : null,
          })),
          collections: snapshot.collections.map((collection) => ({
            ...collection,
            id: collectionMap.get(collection.id) ?? collection.id,
            workspaceId: workspaceMap.get(collection.workspaceId) ?? collection.workspaceId,
            spaceId: spaceMap.get(collection.spaceId) ?? collection.spaceId,
            folderId: collection.folderId ? folderMap.get(collection.folderId) ?? collection.folderId : null,
          })),
          tabs: snapshot.tabs.map((tab) => ({
            ...tab,
            id: crypto.randomUUID(),
            collectionId: collectionMap.get(tab.collectionId) ?? tab.collectionId,
          })),
          cache: {
            ...snapshot.cache,
            selectedWorkspaceId: snapshot.cache.selectedWorkspaceId
              ? workspaceMap.get(snapshot.cache.selectedWorkspaceId) ?? snapshot.cache.selectedWorkspaceId
              : null,
            selectedSpaceId: snapshot.cache.selectedSpaceId
              ? spaceMap.get(snapshot.cache.selectedSpaceId) ?? snapshot.cache.selectedSpaceId
              : null,
            selectedCollectionId: snapshot.cache.selectedCollectionId
              ? collectionMap.get(snapshot.cache.selectedCollectionId) ?? snapshot.cache.selectedCollectionId
              : null,
          },
        };
      }
      const baseWorkspaces = snapshot.workspaces ?? (snapshot.workspace ? [snapshot.workspace] : []);
      const workspaceIdsFromData = new Set<string>();
      snapshot.spaces.forEach((space) => workspaceIdsFromData.add(space.workspaceId));
      snapshot.collections.forEach((collection) => workspaceIdsFromData.add(collection.workspaceId));
      // Rebuild missing workspaces using the best available owner id hints.
      const resolveOwnerId = (workspaceId: string) => {
        const directOwnerId = baseWorkspaces.find((workspace) => workspace.id === workspaceId)?.ownerId ?? null;
        const snapshotOwnerId = snapshot.workspace?.id === workspaceId ? snapshot.workspace.ownerId : null;
        const collectionOwnerId =
          snapshot.collections.find((collection) => collection.workspaceId === workspaceId)?.createdBy ?? null;
        const cacheOwnerId = snapshot.cache.currentUserId ?? null;
        const candidates = [directOwnerId, snapshotOwnerId, collectionOwnerId, cacheOwnerId].filter(
          (value): value is string => Boolean(value)
        );
        const match = candidates.find((value) => uuidRegex.test(value));
        return match ?? crypto.randomUUID();
      };
      const finalWorkspaces = [...baseWorkspaces];
      workspaceIdsFromData.forEach((workspaceId) => {
        if (!finalWorkspaces.some((workspace) => workspace.id === workspaceId)) {
          const now = new Date().toISOString();
          finalWorkspaces.push({
            id: workspaceId,
            ownerId: resolveOwnerId(workspaceId),
            name: `Workspace ${workspaceId.slice(0, 6)}`,
            createdAt: now,
            updatedAt: now,
          });
        }
      });
      const workspaceHasData = (workspaceId: string) => {
        return (
          snapshot.spaces.some((space) => space.workspaceId === workspaceId) ||
          snapshot.collections.some((collection) => collection.workspaceId === workspaceId)
        );
      };
      const isPlaceholderWorkspace = (workspace: { name: string; logoUrl?: string | null | undefined }) =>
        workspace.name.startsWith("Workspace ") && !workspace.logoUrl;
      const workspaceSortKey = (workspaceId: string) => {
        const spaceDates = snapshot.spaces
          .filter((space) => space.workspaceId === workspaceId)
          .map((space) => space.createdAt);
        const collectionDates = snapshot.collections
          .filter((collection) => collection.workspaceId === workspaceId)
          .map((collection) => collection.createdAt);
        const allDates = [...spaceDates, ...collectionDates].filter(Boolean);
        return allDates.sort()[0] ?? "9999-12-31T23:59:59.999Z";
      };
      const dataWorkspaceIds = new Set(workspaceIdsFromData);
      const dataWorkspaces = finalWorkspaces.filter((workspace) => dataWorkspaceIds.has(workspace.id));
      const staleWorkspaces = finalWorkspaces.filter((workspace) => !dataWorkspaceIds.has(workspace.id));
      const placeholderDataWorkspaces = dataWorkspaces.filter(isPlaceholderWorkspace);
      const namedStaleWorkspaces = staleWorkspaces.filter((workspace) => !isPlaceholderWorkspace(workspace));
      const selectedWorkspaceIsData =
        snapshot.cache.selectedWorkspaceId && dataWorkspaceIds.has(snapshot.cache.selectedWorkspaceId);
      if (
        placeholderDataWorkspaces.length > 0 &&
        namedStaleWorkspaces.length > 0 &&
        namedStaleWorkspaces.every((workspace) => !workspaceHasData(workspace.id)) &&
        placeholderDataWorkspaces.length >= namedStaleWorkspaces.length &&
        selectedWorkspaceIsData
      ) {
        const sortedPlaceholders = [...placeholderDataWorkspaces].sort(
          (a, b) => workspaceSortKey(a.id).localeCompare(workspaceSortKey(b.id))
        );
        const sortedNamedStale = [...namedStaleWorkspaces].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        sortedNamedStale.forEach((stale, index) => {
          const target = sortedPlaceholders[index];
          if (!target) {
            return;
          }
          target.name = stale.name;
          target.logoUrl = stale.logoUrl ?? null;
          if (stale.ownerId && uuidRegex.test(stale.ownerId)) {
            target.ownerId = stale.ownerId;
          }
        });
      }
      const filteredWorkspaces =
        placeholderDataWorkspaces.length > 0 &&
        namedStaleWorkspaces.length > 0 &&
        namedStaleWorkspaces.every((workspace) => !workspaceHasData(workspace.id)) &&
        placeholderDataWorkspaces.length >= namedStaleWorkspaces.length &&
        selectedWorkspaceIsData
          ? finalWorkspaces.filter(
              (workspace) => dataWorkspaceIds.has(workspace.id) || workspaceHasData(workspace.id)
            )
          : finalWorkspaces;
      const preferredWorkspaceId =
        snapshot.cache.selectedWorkspaceId && filteredWorkspaces.some((w) => w.id === snapshot.cache.selectedWorkspaceId)
          ? snapshot.cache.selectedWorkspaceId
          : snapshot.workspace?.id ?? null;
      let activeWorkspaceId = preferredWorkspaceId;
      if (activeWorkspaceId && !workspaceHasData(activeWorkspaceId)) {
        activeWorkspaceId = null;
      }
      if (!activeWorkspaceId && filteredWorkspaces.length > 0) {
        const sorted = [...filteredWorkspaces].sort((a, b) => {
          const scoreA = snapshot.collections.filter((c) => c.workspaceId === a.id).length * 1000 +
            snapshot.spaces.filter((s) => s.workspaceId === a.id).length;
          const scoreB = snapshot.collections.filter((c) => c.workspaceId === b.id).length * 1000 +
            snapshot.spaces.filter((s) => s.workspaceId === b.id).length;
          return scoreB - scoreA;
        });
        activeWorkspaceId = sorted[0]?.id ?? null;
      }
      const activeWorkspace = filteredWorkspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null;
      const activeSpaceId =
        activeWorkspaceId && snapshot.cache.selectedSpaceId
          ? snapshot.spaces.some(
              (space) =>
                space.id === snapshot.cache.selectedSpaceId && space.workspaceId === activeWorkspaceId
            )
            ? snapshot.cache.selectedSpaceId
            : snapshot.spaces.find((space) => space.workspaceId === activeWorkspaceId)?.id ?? null
          : activeWorkspaceId
          ? snapshot.spaces.find((space) => space.workspaceId === activeWorkspaceId)?.id ?? null
          : null;
      const activeCollectionId =
        activeWorkspaceId && activeSpaceId && snapshot.cache.selectedCollectionId
          ? snapshot.collections.some(
              (collection) =>
                collection.id === snapshot.cache.selectedCollectionId &&
                collection.workspaceId === activeWorkspaceId &&
                collection.spaceId === activeSpaceId
            )
            ? snapshot.cache.selectedCollectionId
            : snapshot.collections.find(
                (collection) =>
                  collection.workspaceId === activeWorkspaceId && collection.spaceId === activeSpaceId
              )?.id ?? null
          : activeWorkspaceId && activeSpaceId
          ? snapshot.collections.find(
              (collection) => collection.workspaceId === activeWorkspaceId && collection.spaceId === activeSpaceId
            )?.id ?? null
          : null;
      set({
        workspaces: filteredWorkspaces,
        workspace: activeWorkspace,
        spaces: snapshot.spaces,
        folders: snapshot.folders,
        collections: snapshot.collections,
        tabs: snapshot.tabs,
        cache: {
          ...snapshot.cache,
          selectedWorkspaceId: activeWorkspaceId,
          selectedSpaceId: activeSpaceId,
          selectedCollectionId: activeCollectionId,
        },
        rollbackStack: [],
      });
    },
    setViewMode: (mode) => {
      set((state) => ({
        cache: {
          ...state.cache,
          ui: {
            ...state.cache.ui,
            viewMode: mode,
          },
        },
      }));
    },
    setSelectedWorkspaceId: (workspaceId) => {
      const state = get();
      const active = state.workspaces.find((workspace) => workspace.id === workspaceId) ?? null;
      set({
        workspace: active,
        cache: {
          ...state.cache,
          selectedWorkspaceId: workspaceId,
          selectedSpaceId: null,
          selectedCollectionId: null,
        },
      });
    },
    setSelectedSpaceId: (spaceId) => {
      set((state) => ({
        cache: {
          ...state.cache,
          selectedSpaceId: spaceId,
        },
      }));
    },
    setSelectedCollectionId: (collectionId) => {
      set((state) => ({
        cache: {
          ...state.cache,
          selectedCollectionId: collectionId,
        },
      }));
    },
    setSortMode: (mode) => {
      set((state) => ({
        cache: {
          ...state.cache,
          ui: {
            ...state.cache.ui,
            sortMode: mode,
          },
        },
      }));
    },
    addWorkspace: (name) => {
      const state = get();
      const now = new Date().toISOString();
      const newWorkspace = {
        id: crypto.randomUUID(),
        ownerId: state.workspace?.ownerId ?? crypto.randomUUID(),
        name,
        logoUrl: null,
        inviteCount: 0,
        points: 0,
        createdAt: now,
        updatedAt: now,
      };
      set({
        rollbackStack: pushRollback(state),
        workspaces: [...state.workspaces, newWorkspace],
        workspace: newWorkspace,
        spaces: state.spaces,
        folders: state.folders,
        collections: state.collections,
        tabs: state.tabs,
        cache: {
          ...state.cache,
          selectedWorkspaceId: newWorkspace.id,
          selectedSpaceId: null,
          selectedCollectionId: null,
        },
      });
    },
    upsertWorkspace: (payload) => {
      const state = get();
      const now = new Date().toISOString();
      const existing = state.workspaces.find((workspace) => workspace.id === payload.id);
      if (existing) {
        const updatedWorkspaces = state.workspaces.map((workspace) =>
          workspace.id === payload.id
            ? {
                ...workspace,
                name: payload.name || workspace.name,
                ownerId: payload.ownerId && payload.ownerId.trim() ? payload.ownerId : workspace.ownerId,
                updatedAt: now,
              }
            : workspace
        );
        const active = state.workspace?.id === payload.id ? updatedWorkspaces.find((w) => w.id === payload.id) : state.workspace;
        set({
          workspaces: updatedWorkspaces,
          workspace: active ?? null,
        });
        return;
      }
      const newWorkspace = {
        id: payload.id,
        ownerId: payload.ownerId && payload.ownerId.trim() ? payload.ownerId : state.workspace?.ownerId ?? crypto.randomUUID(),
        name: payload.name,
        logoUrl: null,
        inviteCount: 0,
        points: 0,
        createdAt: now,
        updatedAt: now,
      };
      set({
        workspaces: [...state.workspaces, newWorkspace],
      });
    },
    updateWorkspace: (workspaceId, payload) => {
      const state = get();
      const now = new Date().toISOString();
      const updatedWorkspaces = state.workspaces.map((workspace) =>
        workspace.id === workspaceId
          ? {
              ...workspace,
              name: payload.name ?? workspace.name,
              logoUrl: payload.logoUrl ?? workspace.logoUrl ?? null,
              inviteCount: payload.inviteCount ?? workspace.inviteCount ?? 0,
              points: payload.points ?? workspace.points ?? 0,
              updatedAt: now,
            }
          : workspace
      );
      const active = updatedWorkspaces.find((workspace) => workspace.id === workspaceId) ?? state.workspace;
      set({
        rollbackStack: pushRollback(state),
        workspaces: updatedWorkspaces,
        workspace: active ?? null,
      });
    },
    deleteWorkspace: (workspaceId) => {
      const state = get();
      const remainingWorkspaces = state.workspaces.filter((workspace) => workspace.id !== workspaceId);
      const remainingSpaces = state.spaces.filter((space) => space.workspaceId !== workspaceId);
      const remainingFolders = state.folders.filter((folder) => folder.workspaceId !== workspaceId);
      const remainingCollections = state.collections.filter((collection) => collection.workspaceId !== workspaceId);
      const remainingTabs = state.tabs.filter(
        (tab) => remainingCollections.some((collection) => collection.id === tab.collectionId)
      );
      const nextWorkspace = remainingWorkspaces[0] ?? null;
      set({
        rollbackStack: pushRollback(state),
        workspaces: remainingWorkspaces,
        workspace: nextWorkspace,
        spaces: remainingSpaces,
        folders: remainingFolders,
        collections: remainingCollections,
        tabs: remainingTabs,
        cache: {
          ...state.cache,
          selectedWorkspaceId: nextWorkspace?.id ?? null,
          selectedSpaceId: null,
          selectedCollectionId: null,
        },
      });
    },
    addSpace: (name) => {
      const state = get();
      const workspaceId = state.cache.selectedWorkspaceId ?? state.workspace?.id ?? null;
      if (!workspaceId) {
        return;
      }
      const now = new Date().toISOString();
      const nextPosition =
        Math.max(
          0,
          ...state.spaces.filter((space) => space.workspaceId === workspaceId).map((space) => space.position)
        ) + 1000;
      const newSpace = {
        id: crypto.randomUUID(),
        workspaceId,
        name,
        position: nextPosition,
        createdAt: now,
        updatedAt: now,
      };
      const pendingOps = enqueueOp(state.cache.pendingOps, {
        id: nanoid(),
        type: "create",
        entity: "space",
        payload: newSpace,
        createdAt: now,
      });
      set({
        rollbackStack: pushRollback(state),
        spaces: [...state.spaces, newSpace],
        cache: {
          ...state.cache,
          selectedSpaceId: newSpace.id,
          pendingOps,
        },
      });
    },
    addCollection: (name) => {
      const state = get();
      const workspaceId = state.cache.selectedWorkspaceId ?? state.workspace?.id ?? null;
      const workspaceSpaces = workspaceId
        ? state.spaces.filter((space) => space.workspaceId === workspaceId)
        : [];
      const targetSpaceId =
        state.cache.selectedSpaceId ??
        workspaceSpaces.sort((a, b) => a.position - b.position)[0]?.id ??
        "";
      if (!workspaceId || !targetSpaceId || !state.workspace) {
        return;
      }
      const now = new Date().toISOString();
      const collectionId = crypto.randomUUID();
      const newCollection = {
        id: collectionId,
        workspaceId,
        spaceId: targetSpaceId,
        folderId: null,
        name,
        note: null,
        color: null,
        starred: false,
        position: state.collections.length + 1,
        createdBy: state.workspace.ownerId,
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
      };
      const pendingOps = enqueueOp(state.cache.pendingOps, {
        id: nanoid(),
        type: "create",
        entity: "collection",
        payload: { collection: newCollection, tabs: [] },
        createdAt: now,
      });
      set({
        rollbackStack: pushRollback(state),
        collections: [...state.collections, newCollection],
        cache: {
          ...state.cache,
          pendingOps,
        },
      });
    },
    reorderSpaces: (activeId, overId) => {
      const state = get();
      const activeIndex = state.spaces.findIndex((space) => space.id === activeId);
      const overIndex = state.spaces.findIndex((space) => space.id === overId);
      if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
        return;
      }

      const activeSpace = state.spaces.find((space) => space.id === activeId);
      const overSpace = state.spaces.find((space) => space.id === overId);
      if (!activeSpace || !overSpace || activeSpace.workspaceId !== overSpace.workspaceId) {
        return;
      }
      const workspaceId = activeSpace.workspaceId;
      const workspaceSpaces = state.spaces
        .filter((space) => space.workspaceId === workspaceId)
        .sort((a, b) => a.position - b.position);
      const fromIndex = workspaceSpaces.findIndex((space) => space.id === activeId);
      const toIndex = workspaceSpaces.findIndex((space) => space.id === overId);
      if (fromIndex < 0 || toIndex < 0) {
        return;
      }
      const reordered = [...workspaceSpaces];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      const updated = state.spaces.map((space) => {
        const index = reordered.findIndex((item) => item.id === space.id);
        if (index === -1) {
          return space;
        }
        return { ...space, position: (index + 1) * 1000 };
      });

      const pendingOps = enqueueOp(state.cache.pendingOps, {
        id: nanoid(),
        type: "update",
        entity: "space",
        payload: { order: updated.map((space) => ({ id: space.id, position: space.position })) },
        createdAt: new Date().toISOString(),
      });

      set({
        rollbackStack: pushRollback(state),
        spaces: updated,
        cache: {
          ...state.cache,
          pendingOps,
        },
      });
    },
    reorderCollections: (activeId, overId) => {
      const state = get();
      const activeIndex = state.collections.findIndex((collection) => collection.id === activeId);
      const overIndex = state.collections.findIndex((collection) => collection.id === overId);
      if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
        return;
      }

      const reordered = [...state.collections];
      const [moved] = reordered.splice(activeIndex, 1);
      reordered.splice(overIndex, 0, moved);

      const updated = reordered.map((collection, index) => ({
        ...collection,
        position: (index + 1) * 1000,
      }));

      const pendingOps = enqueueOp(state.cache.pendingOps, {
        id: nanoid(),
        type: "update",
        entity: "collection",
        payload: { order: updated.map((collection) => ({ id: collection.id, position: collection.position })) },
        createdAt: new Date().toISOString(),
      });

      set({
        rollbackStack: pushRollback(state),
        collections: updated,
        cache: {
          ...state.cache,
          pendingOps,
        },
      });
    },
    reorderCollectionsWithIndex: (activeId, overId, placeAfter) => {
      const state = get();
      const activeIndex = state.collections.findIndex((collection) => collection.id === activeId);
      const overIndex = state.collections.findIndex((collection) => collection.id === overId);
      if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
        return;
      }

      const reordered = [...state.collections];
      const [moved] = reordered.splice(activeIndex, 1);
      const targetIndex = placeAfter ? overIndex + (activeIndex < overIndex ? 0 : 1) : overIndex;
      reordered.splice(targetIndex, 0, moved);

      const updated = reordered.map((collection, index) => ({
        ...collection,
        position: (index + 1) * 1000,
      }));

      const pendingOps = enqueueOp(state.cache.pendingOps, {
        id: nanoid(),
        type: "update",
        entity: "collection",
        payload: { order: updated.map((collection) => ({ id: collection.id, position: collection.position })) },
        createdAt: new Date().toISOString(),
      });

      set({
        rollbackStack: pushRollback(state),
        collections: updated,
        cache: {
          ...state.cache,
          pendingOps,
        },
      });
    },
    reorderFolders: (activeId, overId) => {
      const state = get();
      const active = state.folders.find((folder) => folder.id === activeId);
      if (!active) {
        return;
      }

      const overSpace = state.spaces.find((space) => space.id === overId);
      const overFolder = state.folders.find((folder) => folder.id === overId);

      if (overSpace) {
        const siblings = state.folders
          .filter((folder) => folder.spaceId === overSpace.id && folder.parentFolderId === null)
          .sort((a, b) => a.position - b.position);
        const nextPosition = (siblings.length + 1) * 1000;

        const updatedFolders = state.folders.map((folder) =>
          folder.id === activeId
            ? { ...folder, spaceId: overSpace.id, parentFolderId: null, position: nextPosition }
            : folder
        );
        const pendingOps = enqueueOp(state.cache.pendingOps, {
          id: nanoid(),
          type: "update",
          entity: "folder",
          payload: { id: activeId, spaceId: overSpace.id, parentFolderId: null, position: nextPosition },
          createdAt: new Date().toISOString(),
        });
        set({
          rollbackStack: pushRollback(state),
          folders: updatedFolders,
          cache: {
            ...state.cache,
            pendingOps,
          },
        });
        return;
      }

      if (!overFolder) {
        return;
      }

      if (
        active.spaceId === overFolder.spaceId &&
        active.parentFolderId === overFolder.parentFolderId
      ) {
        const siblings = state.folders
          .filter(
            (folder) =>
              folder.spaceId === active.spaceId && folder.parentFolderId === active.parentFolderId
          )
          .sort((a, b) => a.position - b.position);
        const fromIndex = siblings.findIndex((folder) => folder.id === activeId);
        const toIndex = siblings.findIndex((folder) => folder.id === overId);
        if (fromIndex < 0 || toIndex < 0) {
          return;
        }

        const reordered = [...siblings];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);

        const updatedFolders = state.folders.map((folder) => {
          const index = reordered.findIndex((item) => item.id === folder.id);
          if (index === -1) {
            return folder;
          }
          return { ...folder, position: (index + 1) * 1000 };
        });
        const pendingOps = enqueueOp(state.cache.pendingOps, {
          id: nanoid(),
          type: "update",
          entity: "folder",
          payload: { order: updatedFolders.map((folder) => ({ id: folder.id, position: folder.position })) },
          createdAt: new Date().toISOString(),
        });
        set({
          rollbackStack: pushRollback(state),
          folders: updatedFolders,
          cache: {
            ...state.cache,
            pendingOps,
          },
        });
        return;
      }

      const children = state.folders
        .filter(
          (folder) =>
            folder.spaceId === overFolder.spaceId && folder.parentFolderId === overFolder.id
        )
        .sort((a, b) => a.position - b.position);
      const nextPosition = (children.length + 1) * 1000;

      const updatedFolders = state.folders.map((folder) =>
        folder.id === activeId
          ? {
              ...folder,
              spaceId: overFolder.spaceId,
              parentFolderId: overFolder.id,
              position: nextPosition,
            }
          : folder
      );
      const pendingOps = enqueueOp(state.cache.pendingOps, {
        id: nanoid(),
        type: "update",
        entity: "folder",
        payload: {
          id: activeId,
          spaceId: overFolder.spaceId,
          parentFolderId: overFolder.id,
          position: nextPosition,
        },
        createdAt: new Date().toISOString(),
      });
      set({
        rollbackStack: pushRollback(state),
        folders: updatedFolders,
        cache: {
          ...state.cache,
          pendingOps,
        },
      });
    },
    reorderTabs: (activeId, overId) => {
      const state = get();
      const activeTab = state.tabs.find((tab) => tab.id === activeId);
      if (!activeTab) {
        return;
      }

      const overTab = state.tabs.find((tab) => tab.id === overId);
      const overCollection = state.collections.find((collection) => collection.id === overId);

      if (overCollection) {
        const targetTabs = state.tabs
          .filter((tab) => tab.collectionId === overCollection.id)
          .sort((a, b) => a.position - b.position);
        const nextPosition = (targetTabs.length + 1) * 1000;

        const updatedTabs = state.tabs.map((tab) =>
          tab.id === activeId
            ? { ...tab, collectionId: overCollection.id, position: nextPosition }
            : tab
        );
        const pendingOps = enqueueOp(state.cache.pendingOps, {
          id: nanoid(),
          type: "update",
          entity: "tab",
          payload: { id: activeId, collectionId: overCollection.id, position: nextPosition },
          createdAt: new Date().toISOString(),
        });
        set({
          rollbackStack: pushRollback(state),
          tabs: updatedTabs,
          cache: {
            ...state.cache,
            pendingOps,
          },
        });
        return;
      }

      if (!overTab) {
        return;
      }

      if (activeTab.collectionId === overTab.collectionId) {
        const siblings = state.tabs
          .filter((tab) => tab.collectionId === activeTab.collectionId)
          .sort((a, b) => a.position - b.position);
        const fromIndex = siblings.findIndex((tab) => tab.id === activeId);
        const toIndex = siblings.findIndex((tab) => tab.id === overId);
        if (fromIndex < 0 || toIndex < 0) {
          return;
        }

        const reordered = [...siblings];
        const [moved] = reordered.splice(fromIndex, 1);
        reordered.splice(toIndex, 0, moved);

        const updatedTabs = state.tabs.map((tab) => {
          const index = reordered.findIndex((item) => item.id === tab.id);
          if (index === -1) {
            return tab;
          }
          return { ...tab, position: (index + 1) * 1000 };
        });

        const pendingOps = enqueueOp(state.cache.pendingOps, {
          id: nanoid(),
          type: "update",
          entity: "tab",
          payload: { order: updatedTabs.map((tab) => ({ id: tab.id, position: tab.position })) },
          createdAt: new Date().toISOString(),
        });
        set({
          rollbackStack: pushRollback(state),
          tabs: updatedTabs,
          cache: {
            ...state.cache,
            pendingOps,
          },
        });
        return;
      }

      const targetTabs = state.tabs
        .filter((tab) => tab.collectionId === overTab.collectionId)
        .sort((a, b) => a.position - b.position);
      const nextPosition = (targetTabs.length + 1) * 1000;

      const updatedTabs = state.tabs.map((tab) =>
        tab.id === activeId
          ? { ...tab, collectionId: overTab.collectionId, position: nextPosition }
          : tab
      );
      const pendingOps = enqueueOp(state.cache.pendingOps, {
        id: nanoid(),
        type: "update",
        entity: "tab",
        payload: { id: activeId, collectionId: overTab.collectionId, position: nextPosition },
        createdAt: new Date().toISOString(),
      });
      set({
        rollbackStack: pushRollback(state),
        tabs: updatedTabs,
        cache: {
          ...state.cache,
          pendingOps,
        },
      });
    },
    reorderTabsWithIndex: (activeId, overId, placeAfter) => {
      const state = get();
      const activeTab = state.tabs.find((tab) => tab.id === activeId);
      const overTab = state.tabs.find((tab) => tab.id === overId);
      if (!activeTab || !overTab) {
        return;
      }

      const siblings = state.tabs
        .filter((tab) => tab.collectionId === overTab.collectionId)
        .sort((a, b) => a.position - b.position);
      const fromIndex = siblings.findIndex((tab) => tab.id === activeId);
      const overIndex = siblings.findIndex((tab) => tab.id === overId);
      if (fromIndex < 0 || overIndex < 0) {
        return;
      }

      const reordered = [...siblings];
      const [moved] = reordered.splice(fromIndex, 1);
      const targetIndex = placeAfter ? overIndex + (fromIndex < overIndex ? 0 : 1) : overIndex;
      reordered.splice(targetIndex, 0, moved);

      const updatedTabs = state.tabs.map((tab) => {
        const index = reordered.findIndex((item) => item.id === tab.id);
        if (index === -1) {
          return tab;
        }
        return { ...tab, position: (index + 1) * 1000 };
      });

      const pendingOps = enqueueOp(state.cache.pendingOps, {
        id: nanoid(),
        type: "update",
        entity: "tab",
        payload: { order: updatedTabs.map((tab) => ({ id: tab.id, position: tab.position })) },
        createdAt: new Date().toISOString(),
      });
      set({
        rollbackStack: pushRollback(state),
        tabs: updatedTabs,
        cache: {
          ...state.cache,
          pendingOps,
        },
      });
    },
    saveCollectionFromTabs: (name, tabs) => {
      const state = get();
      const workspaceId = state.cache.selectedWorkspaceId ?? state.workspace?.id ?? null;
      const workspaceSpaces = workspaceId
        ? state.spaces.filter((space) => space.workspaceId === workspaceId)
        : [];
      const targetSpaceId =
        state.cache.selectedSpaceId ??
        workspaceSpaces.sort((a, b) => a.position - b.position)[0]?.id ??
        "";
      const collectionId = crypto.randomUUID();
      const now = new Date().toISOString();

      if (!state.workspace || !workspaceId || !targetSpaceId) {
        return;
      }

      const newCollection = {
        id: collectionId,
        workspaceId,
        spaceId: targetSpaceId,
        folderId: null,
        name,
        note: null,
        color: null,
        starred: false,
        position: state.collections.length + 1,
        createdBy: state.workspace.ownerId,
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
      };

      const newTabs: TabItem[] = tabs.map((tab, index) => ({
        id: crypto.randomUUID(),
        collectionId,
        title: tab.title,
        url: tab.url,
        faviconUrl: tab.favIconUrl ?? null,
        ogTitle: tab.ogTitle ?? null,
        ogDescription: tab.ogDescription ?? null,
        ogImage: tab.ogImage ?? null,
        screenshotUrl: tab.screenshotUrl ?? null,
        note: null,
        position: index + 1,
        createdAt: now,
        updatedAt: now,
      }));

      // TODO: replace with full sync pipeline once server is ready.
      const pendingOps = enqueueOp(state.cache.pendingOps, {
        id: nanoid(),
        type: "create",
        entity: "collection",
        payload: { collection: newCollection, tabs: newTabs },
        createdAt: now,
      });

      set({
        rollbackStack: pushRollback(state),
        collections: [...state.collections, newCollection],
        tabs: [...state.tabs, ...newTabs],
        cache: {
          ...state.cache,
          pendingOps,
          lastSyncAt: now,
        },
      });
    },
    toggleFolderExpanded: (folderId) => {
      set((state) => {
        const expanded = new Set(state.cache.expandedFolderIds);
        if (expanded.has(folderId)) {
          expanded.delete(folderId);
        } else {
          expanded.add(folderId);
        }
        return {
          cache: {
            ...state.cache,
            expandedFolderIds: Array.from(expanded),
          },
        };
      });
    },
    expandFolder: (folderId) => {
      set((state) => {
        if (state.cache.expandedFolderIds.includes(folderId)) {
          return state;
        }
        return {
          cache: {
            ...state.cache,
            expandedFolderIds: [...state.cache.expandedFolderIds, folderId],
          },
        };
      });
    },
    rollbackLastOp: () => {
      const state = get();
      const [latest, ...rest] = state.rollbackStack;
      if (!latest) {
        return;
      }
      set({
        workspace: latest.workspace,
        spaces: latest.spaces,
        folders: latest.folders,
        collections: latest.collections,
        tabs: latest.tabs,
        cache: latest.cache,
        rollbackStack: rest,
      });
    },
    setSyncRetryAt: (isoTime) => {
      set((state) => ({
        cache: {
          ...state.cache,
          nextSyncRetryAt: isoTime,
        },
      }));
    },
    flushPendingOps: async (client) => {
      const state = get();
      const ops = state.cache.pendingOps;
      if (ops.length === 0) {
        return;
      }

      let result;
      try {
        result = await syncPendingOps(ops, client);
      } catch {
        const retryAt = new Date(Date.now() + 30_000).toISOString();
        set({
          cache: {
            ...state.cache,
            lastSyncError: "network_error",
            nextSyncRetryAt: retryAt,
          },
        });
        return;
      }
      let remaining = ops;
      if (result.syncedIds.length > 0) {
        result.syncedIds.forEach((id) => {
          remaining = markSynced(remaining, id);
        });
      }
      if (result.failedIds.length > 0) {
        get().rollbackLastOp();
      }

      const now = new Date().toISOString();
      set({
        cache: {
          ...state.cache,
          pendingOps: remaining,
          lastSyncAt: result.syncedIds.length > 0 ? now : state.cache.lastSyncAt,
          lastSyncError: result.failedIds.length > 0 ? "sync_failed" : null,
          nextSyncRetryAt: result.failedIds.length > 0 ? new Date(Date.now() + 30_000).toISOString() : null,
        },
      });
    },
    addTabToCollection: (collectionId, tab) => {
      const state = get();
      const targetCollection = state.collections.find((collection) => collection.id === collectionId);
      if (!targetCollection) {
        return;
      }
      const now = new Date().toISOString();
      const nextPosition =
        Math.max(0, ...state.tabs.filter((item) => item.collectionId === collectionId).map((t) => t.position)) +
        1000;

      const newTab: TabItem = {
        id: crypto.randomUUID(),
        collectionId,
        title: tab.title,
        url: tab.url,
        faviconUrl: tab.favIconUrl ?? null,
        ogTitle: tab.ogTitle ?? null,
        ogDescription: tab.ogDescription ?? null,
        ogImage: tab.ogImage ?? null,
        note: null,
        position: nextPosition,
        createdAt: now,
        updatedAt: now,
      };

      const pendingOps = enqueueOp(state.cache.pendingOps, {
        id: nanoid(),
        type: "create",
        entity: "tab",
        payload: newTab,
        createdAt: now,
      });

      set({
        rollbackStack: pushRollback(state),
        tabs: [...state.tabs, newTab],
        cache: {
          ...state.cache,
          pendingOps,
        },
      });
    },
    updateTabMetadata: (tabId, payload) => {
      const state = get();
      const updated = state.tabs.map((tab) =>
        tab.id === tabId
          ? {
              ...tab,
              ogTitle: payload.ogTitle ?? tab.ogTitle ?? null,
              ogDescription: payload.ogDescription ?? tab.ogDescription ?? null,
              ogImage: payload.ogImage ?? tab.ogImage ?? null,
              updatedAt: new Date().toISOString(),
            }
          : tab
      );
      set({ tabs: updated });
    },
    updateTab: (tabId, payload) => {
      const state = get();
      const now = new Date().toISOString();
      const updated = state.tabs.map((tab) =>
        tab.id === tabId
          ? {
              ...tab,
              title: payload.title,
              url: payload.url,
              note: payload.note ?? null,
              updatedAt: now,
            }
          : tab
      );

      const pendingOps = enqueueOp(state.cache.pendingOps, {
        id: nanoid(),
        type: "update",
        entity: "tab",
        payload: { id: tabId, title: payload.title, url: payload.url, note: payload.note ?? null },
        createdAt: now,
      });

      set({
        rollbackStack: pushRollback(state),
        tabs: updated,
        cache: {
          ...state.cache,
          pendingOps,
        },
      });
    },
    deleteTab: (tabId) => {
      const state = get();
      const tab = state.tabs.find((item) => item.id === tabId);
      if (!tab) {
        return;
      }
      const now = new Date().toISOString();
      const pendingOps = enqueueOp(state.cache.pendingOps, {
        id: nanoid(),
        type: "delete",
        entity: "tab",
        payload: { id: tabId, collectionId: tab.collectionId },
        createdAt: now,
      });

      set({
        rollbackStack: pushRollback(state),
        tabs: state.tabs.filter((item) => item.id !== tabId),
        cache: {
          ...state.cache,
          pendingOps,
        },
      });
    },
    moveTabToCollection: (tabId, collectionId) => {
      const state = get();
      const tab = state.tabs.find((item) => item.id === tabId);
      if (!tab || tab.collectionId === collectionId) {
        return;
      }
      const now = new Date().toISOString();
      const maxPosition = state.tabs
        .filter((item) => item.collectionId === collectionId)
        .reduce((max, item) => Math.max(max, item.position), 0);
      const updated = state.tabs.map((item) =>
        item.id === tabId
          ? {
              ...item,
              collectionId,
              position: maxPosition + 1,
              updatedAt: now,
            }
          : item
      );
      const pendingOps = enqueueOp(state.cache.pendingOps, {
        id: nanoid(),
        type: "update",
        entity: "tab",
        payload: { id: tabId, collectionId, position: maxPosition + 1 },
        createdAt: now,
      });
      set({
        rollbackStack: pushRollback(state),
        tabs: updated,
        cache: {
          ...state.cache,
          pendingOps,
        },
      });
    },
    updateCollectionTitle: (collectionId, name) => {
      const state = get();
      const now = new Date().toISOString();
      const updated = state.collections.map((collection) =>
        collection.id === collectionId ? { ...collection, name, updatedAt: now } : collection
      );
      const pendingOps = enqueueOp(state.cache.pendingOps, {
        id: nanoid(),
        type: "update",
        entity: "collection",
        payload: { id: collectionId, name },
        createdAt: now,
      });
      set({
        rollbackStack: pushRollback(state),
        collections: updated,
        cache: {
          ...state.cache,
          pendingOps,
        },
      });
    },
    toggleCollectionStar: (collectionId) => {
      const state = get();
      const now = new Date().toISOString();
      const updated = state.collections.map((collection) =>
        collection.id === collectionId
          ? { ...collection, starred: !collection.starred, updatedAt: now }
          : collection
      );
      const pendingOps = enqueueOp(state.cache.pendingOps, {
        id: nanoid(),
        type: "update",
        entity: "collection",
        payload: { id: collectionId, starred: updated.find((c) => c.id === collectionId)?.starred ?? false },
        createdAt: now,
      });
      set({
        rollbackStack: pushRollback(state),
        collections: updated,
        cache: {
          ...state.cache,
          pendingOps,
        },
      });
    },
    moveCollectionWithinSpace: (collectionId, direction) => {
      const state = get();
      const collection = state.collections.find((item) => item.id === collectionId);
      if (!collection) {
        return;
      }
      const siblings = state.collections
        .filter(
          (item) => item.workspaceId === collection.workspaceId && item.spaceId === collection.spaceId
        )
        .sort((a, b) => a.position - b.position);
      const index = siblings.findIndex((item) => item.id === collectionId);
      if (index < 0) {
        return;
      }
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= siblings.length) {
        return;
      }
      const reordered = [...siblings];
      const [moved] = reordered.splice(index, 1);
      reordered.splice(targetIndex, 0, moved);

      const updated = state.collections.map((item) => {
        const localIndex = reordered.findIndex((sibling) => sibling.id === item.id);
        if (localIndex === -1) {
          return item;
        }
        return { ...item, position: (localIndex + 1) * 1000 };
      });

      const pendingOps = enqueueOp(state.cache.pendingOps, {
        id: nanoid(),
        type: "update",
        entity: "collection",
        payload: { order: reordered.map((item, idx) => ({ id: item.id, position: (idx + 1) * 1000 })) },
        createdAt: new Date().toISOString(),
      });

      set({
        rollbackStack: pushRollback(state),
        collections: updated,
        cache: {
          ...state.cache,
          pendingOps,
        },
      });
    },
    moveCollectionToSpace: (collectionId, workspaceId, spaceId) => {
      const state = get();
      const collection = state.collections.find((item) => item.id === collectionId);
      if (!collection) {
        return;
      }
      const now = new Date().toISOString();
      const targetMax = Math.max(
        0,
        ...state.collections
          .filter((item) => item.workspaceId === workspaceId && item.spaceId === spaceId)
          .map((item) => item.position)
      );
      const nextPosition = targetMax + 1000;
      const updated = state.collections.map((item) =>
        item.id === collectionId
          ? { ...item, workspaceId, spaceId, position: nextPosition, updatedAt: now }
          : item
      );
      const pendingOps = enqueueOp(state.cache.pendingOps, {
        id: nanoid(),
        type: "update",
        entity: "collection",
        payload: { id: collectionId, workspaceId, spaceId, position: nextPosition },
        createdAt: now,
      });
      set({
        rollbackStack: pushRollback(state),
        collections: updated,
        cache: {
          ...state.cache,
          pendingOps,
        },
      });
    },
    sortTabsInCollection: (collectionId) => {
      const state = get();
      const siblings = state.tabs
        .filter((tab) => tab.collectionId === collectionId)
        .sort((a, b) => a.title.localeCompare(b.title));
      if (siblings.length <= 1) {
        return;
      }
      const updatedTabs = state.tabs.map((tab) => {
        const index = siblings.findIndex((item) => item.id === tab.id);
        if (index === -1) {
          return tab;
        }
        return { ...tab, position: (index + 1) * 1000 };
      });
      const pendingOps = enqueueOp(state.cache.pendingOps, {
        id: nanoid(),
        type: "update",
        entity: "tab",
        payload: { order: siblings.map((tab, index) => ({ id: tab.id, position: (index + 1) * 1000 })) },
        createdAt: new Date().toISOString(),
      });
      set({
        rollbackStack: pushRollback(state),
        tabs: updatedTabs,
        cache: {
          ...state.cache,
          pendingOps,
        },
      });
    },
    deleteCollection: (collectionId) => {
      const state = get();
      const collection = state.collections.find((item) => item.id === collectionId);
      if (!collection) {
        return;
      }
      const now = new Date().toISOString();
      const pendingOps = enqueueOp(state.cache.pendingOps, {
        id: nanoid(),
        type: "delete",
        entity: "collection",
        payload: { id: collectionId },
        createdAt: now,
      });
      set({
        rollbackStack: pushRollback(state),
        collections: state.collections.filter((item) => item.id !== collectionId),
        tabs: state.tabs.filter((tab) => tab.collectionId !== collectionId),
        cache: {
          ...state.cache,
          pendingOps,
        },
      });
    },
    dedupeTabs: () => {
      const state = get();
      const seen = new Set<string>();
      const deduped = state.tabs.filter((tab) => {
        const key = `${tab.collectionId}:${tab.url}`;
        if (seen.has(key)) {
          return false;
        }
        seen.add(key);
        return true;
      });

      if (deduped.length === state.tabs.length) {
        return;
      }

      const pendingOps = enqueueOp(state.cache.pendingOps, {
        id: nanoid(),
        type: "delete",
        entity: "tab",
        payload: { reason: "dedupe" },
        createdAt: new Date().toISOString(),
      });

      set({
        rollbackStack: pushRollback(state),
        tabs: deduped,
        cache: {
          ...state.cache,
          pendingOps,
        },
      });
    },
  }));
}
