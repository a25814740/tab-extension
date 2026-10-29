import type { AppState } from "./appState";
import type { LocalStoreSnapshot } from "../schemas/appSchemas";

type HydratedState = Pick<
  AppState,
  "workspaces" | "workspace" | "spaces" | "folders" | "collections" | "tabs" | "cache" | "rollbackStack"
>;

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function migrateLegacyIds(snapshot: LocalStoreSnapshot) {
  const nextWorkspaces = snapshot.workspaces ?? (snapshot.workspace ? [snapshot.workspace] : []);
  const needsMigration = nextWorkspaces.some((workspace) => !UUID_REGEX.test(workspace.id));
  if (!needsMigration) {
    return snapshot;
  }

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

  return {
    ...snapshot,
    workspaces: nextWorkspaces.map((workspace) => ({
      ...workspace,
      id: workspaceMap.get(workspace.id) ?? workspace.id,
      ownerId: workspace.ownerId && UUID_REGEX.test(workspace.ownerId) ? workspace.ownerId : crypto.randomUUID(),
    })),
    workspace: snapshot.workspace
      ? {
          ...snapshot.workspace,
          id: workspaceMap.get(snapshot.workspace.id) ?? snapshot.workspace.id,
          ownerId:
            snapshot.workspace.ownerId && UUID_REGEX.test(snapshot.workspace.ownerId)
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

export function hydrateState(snapshot: LocalStoreSnapshot): HydratedState {
  const migratedSnapshot = migrateLegacyIds(snapshot);
  const baseWorkspaces = migratedSnapshot.workspaces ?? (migratedSnapshot.workspace ? [migratedSnapshot.workspace] : []);
  const workspaceIdsFromData = new Set<string>();
  migratedSnapshot.spaces.forEach((space) => workspaceIdsFromData.add(space.workspaceId));
  migratedSnapshot.collections.forEach((collection) => workspaceIdsFromData.add(collection.workspaceId));

  const resolveOwnerId = (workspaceId: string) => {
    const directOwnerId = baseWorkspaces.find((workspace) => workspace.id === workspaceId)?.ownerId ?? null;
    const snapshotOwnerId = migratedSnapshot.workspace?.id === workspaceId ? migratedSnapshot.workspace.ownerId : null;
    const collectionOwnerId =
      migratedSnapshot.collections.find((collection) => collection.workspaceId === workspaceId)?.createdBy ?? null;
    const cacheOwnerId = migratedSnapshot.cache.currentUserId ?? null;
    const candidates = [directOwnerId, snapshotOwnerId, collectionOwnerId, cacheOwnerId].filter(
      (value): value is string => Boolean(value)
    );
    const match = candidates.find((value) => UUID_REGEX.test(value));
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
      migratedSnapshot.spaces.some((space) => space.workspaceId === workspaceId) ||
      migratedSnapshot.collections.some((collection) => collection.workspaceId === workspaceId)
    );
  };
  const isPlaceholderWorkspace = (workspace: { name: string; logoUrl?: string | null | undefined }) =>
    workspace.name.startsWith("Workspace ") && !workspace.logoUrl;
  const workspaceSortKey = (workspaceId: string) => {
    const spaceDates = migratedSnapshot.spaces
      .filter((space) => space.workspaceId === workspaceId)
      .map((space) => space.createdAt);
    const collectionDates = migratedSnapshot.collections
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
    migratedSnapshot.cache.selectedWorkspaceId && dataWorkspaceIds.has(migratedSnapshot.cache.selectedWorkspaceId);

  if (
    placeholderDataWorkspaces.length > 0 &&
    namedStaleWorkspaces.length > 0 &&
    namedStaleWorkspaces.every((workspace) => !workspaceHasData(workspace.id)) &&
    placeholderDataWorkspaces.length >= namedStaleWorkspaces.length &&
    selectedWorkspaceIsData
  ) {
    const sortedPlaceholders = [...placeholderDataWorkspaces].sort((a, b) =>
      workspaceSortKey(a.id).localeCompare(workspaceSortKey(b.id))
    );
    const sortedNamedStale = [...namedStaleWorkspaces].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    sortedNamedStale.forEach((stale, index) => {
      const target = sortedPlaceholders[index];
      if (!target) {
        return;
      }
      target.name = stale.name;
      target.logoUrl = stale.logoUrl ?? null;
      if (stale.ownerId && UUID_REGEX.test(stale.ownerId)) {
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
      ? finalWorkspaces.filter((workspace) => dataWorkspaceIds.has(workspace.id) || workspaceHasData(workspace.id))
      : finalWorkspaces;

  const preferredWorkspaceId =
    migratedSnapshot.cache.selectedWorkspaceId &&
    filteredWorkspaces.some((workspace) => workspace.id === migratedSnapshot.cache.selectedWorkspaceId)
      ? migratedSnapshot.cache.selectedWorkspaceId
      : migratedSnapshot.workspace?.id ?? null;

  let activeWorkspaceId = preferredWorkspaceId;
  if (activeWorkspaceId && !workspaceHasData(activeWorkspaceId)) {
    activeWorkspaceId = null;
  }
  if (!activeWorkspaceId && filteredWorkspaces.length > 0) {
    const sorted = [...filteredWorkspaces].sort((a, b) => {
      const scoreA =
        migratedSnapshot.collections.filter((collection) => collection.workspaceId === a.id).length * 1000 +
        migratedSnapshot.spaces.filter((space) => space.workspaceId === a.id).length;
      const scoreB =
        migratedSnapshot.collections.filter((collection) => collection.workspaceId === b.id).length * 1000 +
        migratedSnapshot.spaces.filter((space) => space.workspaceId === b.id).length;
      return scoreB - scoreA;
    });
    activeWorkspaceId = sorted[0]?.id ?? null;
  }

  const activeWorkspace = filteredWorkspaces.find((workspace) => workspace.id === activeWorkspaceId) ?? null;
  const activeSpaceId =
    activeWorkspaceId && migratedSnapshot.cache.selectedSpaceId
      ? migratedSnapshot.spaces.some(
          (space) => space.id === migratedSnapshot.cache.selectedSpaceId && space.workspaceId === activeWorkspaceId
        )
        ? migratedSnapshot.cache.selectedSpaceId
        : migratedSnapshot.spaces.find((space) => space.workspaceId === activeWorkspaceId)?.id ?? null
      : activeWorkspaceId
        ? migratedSnapshot.spaces.find((space) => space.workspaceId === activeWorkspaceId)?.id ?? null
        : null;

  const activeCollectionId =
    activeWorkspaceId && activeSpaceId && migratedSnapshot.cache.selectedCollectionId
      ? migratedSnapshot.collections.some(
          (collection) =>
            collection.id === migratedSnapshot.cache.selectedCollectionId &&
            collection.workspaceId === activeWorkspaceId &&
            collection.spaceId === activeSpaceId
        )
        ? migratedSnapshot.cache.selectedCollectionId
        : migratedSnapshot.collections.find(
            (collection) => collection.workspaceId === activeWorkspaceId && collection.spaceId === activeSpaceId
          )?.id ?? null
      : activeWorkspaceId && activeSpaceId
        ? migratedSnapshot.collections.find(
            (collection) => collection.workspaceId === activeWorkspaceId && collection.spaceId === activeSpaceId
          )?.id ?? null
        : null;

  return {
    workspaces: filteredWorkspaces,
    workspace: activeWorkspace,
    spaces: migratedSnapshot.spaces,
    folders: migratedSnapshot.folders,
    collections: migratedSnapshot.collections,
    tabs: migratedSnapshot.tabs,
    cache: {
      ...migratedSnapshot.cache,
      selectedWorkspaceId: activeWorkspaceId,
      selectedSpaceId: activeSpaceId,
      selectedCollectionId: activeCollectionId,
    },
    rollbackStack: [],
  };
}
