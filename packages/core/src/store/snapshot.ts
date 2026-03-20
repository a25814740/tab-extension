import type { AppState } from "./appState";
import type { LocalStoreSnapshot } from "../schemas/appSchemas";

// Serialize the in-memory app state into a snapshot for chrome.storage.local.
export function toSnapshot(state: AppState): LocalStoreSnapshot {
  return {
    workspace: state.workspace,
    workspaces: state.workspaces,
    spaces: state.spaces,
    folders: state.folders,
    collections: state.collections,
    tabs: state.tabs,
    cache: state.cache,
  };
}
