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
