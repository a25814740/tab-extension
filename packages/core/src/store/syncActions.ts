import type { StoreApi } from "zustand/vanilla";
import type { AppStore } from "./appStore";
import { markSynced } from "../sync/pendingOps";
import { syncPendingOps, type SyncClient } from "../sync/syncEngine";

export function rollbackLastSnapshot(store: StoreApi<AppStore>) {
  const state = store.getState();
  const [latest, ...rest] = state.rollbackStack;
  if (!latest) {
    return;
  }

  store.setState({
    workspace: latest.workspace,
    spaces: latest.spaces,
    folders: latest.folders,
    collections: latest.collections,
    tabs: latest.tabs,
    cache: latest.cache,
    rollbackStack: rest,
  });
}

export async function flushPendingSyncOps(store: StoreApi<AppStore>, client: SyncClient) {
  const state = store.getState();
  const ops = state.cache.pendingOps;
  if (ops.length === 0) {
    return;
  }

  let result;
  try {
    result = await syncPendingOps(ops, client);
  } catch {
    const retryAt = new Date(Date.now() + 30_000).toISOString();
    store.setState({
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
    rollbackLastSnapshot(store);
  }

  const refreshedState = store.getState();
  const now = new Date().toISOString();
  store.setState({
    cache: {
      ...refreshedState.cache,
      pendingOps: remaining,
      lastSyncAt: result.syncedIds.length > 0 ? now : refreshedState.cache.lastSyncAt,
      lastSyncError: result.failedIds.length > 0 ? "sync_failed" : null,
      nextSyncRetryAt: result.failedIds.length > 0 ? new Date(Date.now() + 30_000).toISOString() : null,
    },
  });
}
