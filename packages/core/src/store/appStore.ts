import { createStore } from "zustand/vanilla";
import { nanoid } from "nanoid";
import type { AppState } from "./appState";
import { defaultAppState } from "./appState";
import type { LocalStoreSnapshot } from "../schemas/appSchemas";
import type { TabItem } from "../domain/models";
import { sampleWorkspace } from "../utils/sampleData";
import { enqueueOp } from "../sync/pendingOps";

export type TabInput = {
  title: string;
  url: string;
  favIconUrl?: string;
  pinned?: boolean;
};

export type AppActions = {
  hydrate: (snapshot: LocalStoreSnapshot) => void;
  setViewMode: (mode: AppState["cache"]["ui"]["viewMode"]) => void;
  setSelectedSpaceId: (spaceId: string | null) => void;
  saveCollectionFromTabs: (name: string, tabs: TabInput[]) => void;
  reorderSpaces: (activeId: string, overId: string) => void;
  reorderCollections: (activeId: string, overId: string) => void;
  reorderFolders: (activeId: string, overId: string) => void;
  reorderTabs: (activeId: string, overId: string) => void;
};

export type AppStore = AppState & AppActions;

function buildInitialState(): AppState {
  const sample = sampleWorkspace();
  const collections = sample.collections.map((collection) => ({
    ...collection,
  }));
  const tabs = sample.collections.flatMap((collection) => collection.tabs);

  return {
    ...defaultAppState,
    workspace: sample.workspace,
    spaces: sample.spaces.map((space) => ({
      ...space,
    })),
    folders: sample.spaces.flatMap((space) => space.folders),
    collections,
    tabs,
  };
}

// Central store used by New Tab and Side Panel apps.
export function createAppStore() {
  return createStore<AppStore>((set, get) => ({
    ...buildInitialState(),
    hydrate: (snapshot) => {
      set({
        workspace: snapshot.workspace,
        spaces: snapshot.spaces,
        folders: snapshot.folders,
        collections: snapshot.collections,
        tabs: snapshot.tabs,
        cache: snapshot.cache,
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
    setSelectedSpaceId: (spaceId) => {
      set((state) => ({
        cache: {
          ...state.cache,
          selectedSpaceId: spaceId,
        },
      }));
    },
    reorderSpaces: (activeId, overId) => {
      const state = get();
      const activeIndex = state.spaces.findIndex((space) => space.id === activeId);
      const overIndex = state.spaces.findIndex((space) => space.id === overId);
      if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) {
        return;
      }

      const reordered = [...state.spaces];
      const [moved] = reordered.splice(activeIndex, 1);
      reordered.splice(overIndex, 0, moved);

      const updated = reordered.map((space, index) => ({
        ...space,
        position: (index + 1) * 1000,
      }));

      set({ spaces: updated });
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

      set({ collections: updated });
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
        set({ folders: updatedFolders });
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
        set({ folders: updatedFolders });
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
      set({ folders: updatedFolders });
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
        set({ tabs: updatedTabs });
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

        set({ tabs: updatedTabs });
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
      set({ tabs: updatedTabs });
    },
    saveCollectionFromTabs: (name, tabs) => {
      const state = get();
      const targetSpaceId = state.cache.selectedSpaceId ?? state.spaces[0]?.id ?? "";
      const collectionId = nanoid();
      const now = new Date().toISOString();

      if (!state.workspace || !targetSpaceId) {
        return;
      }

      const newCollection = {
        id: collectionId,
        workspaceId: state.workspace.id,
        spaceId: targetSpaceId,
        folderId: null,
        name,
        note: null,
        color: null,
        position: state.collections.length + 1,
        createdBy: state.workspace.ownerId,
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
      };

      const newTabs: TabItem[] = tabs.map((tab, index) => ({
        id: nanoid(),
        collectionId,
        title: tab.title,
        url: tab.url,
        faviconUrl: tab.favIconUrl ?? null,
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
        collections: [...state.collections, newCollection],
        tabs: [...state.tabs, ...newTabs],
        cache: {
          ...state.cache,
          pendingOps,
          lastSyncAt: now,
        },
      });
    },
  }));
}
