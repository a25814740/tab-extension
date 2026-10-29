import { describe, expect, it } from "vitest";
import { createAppStore } from "../../packages/core/src/store/appStore";
import type { PendingOp } from "../../packages/core/src/domain/models";
import type { SyncClient } from "../../packages/core/src/sync/syncEngine";

function seedPendingCollection(store: ReturnType<typeof createAppStore>) {
  store.getState().addWorkspace("Workspace");
  store.getState().addSpace("Space");
  store.getState().addCollection("Collection");
  return store.getState().collections[0]?.id ?? null;
}

function createResultClient(
  handler: (ops: PendingOp[]) => Promise<{ syncedIds: string[]; failedIds: string[] }>
): SyncClient {
  return {
    async pushOps(ops) {
      return handler(ops);
    },
  };
}

describe("sync flow integration", () => {
  it("clears pending ops and stamps lastSyncAt after a successful push", async () => {
    const store = createAppStore();
    const collectionId = seedPendingCollection(store);
    expect(collectionId).toBeTruthy();

    const pendingBefore = store.getState().cache.pendingOps;
    expect(pendingBefore.length).toBeGreaterThan(0);

    await store.getState().flushPendingOps(
      createResultClient(async (ops) => ({
        syncedIds: ops.map((op) => op.id),
        failedIds: [],
      }))
    );

    expect(store.getState().cache.pendingOps).toHaveLength(0);
    expect(store.getState().cache.lastSyncAt).toBeTruthy();
    expect(store.getState().cache.lastSyncError).toBeNull();
    expect(store.getState().cache.nextSyncRetryAt).toBeNull();
  });

  it("rolls back state and schedules retry when the server rejects pending ops", async () => {
    const store = createAppStore();
    const collectionId = seedPendingCollection(store);
    expect(collectionId).toBeTruthy();

    const initialTabCount = store.getState().tabs.length;
    store.getState().addTabToCollection(collectionId!, {
      title: "Blocked tab",
      url: "https://example.com/blocked",
    });
    expect(store.getState().tabs).toHaveLength(initialTabCount + 1);

    const pendingIds = store.getState().cache.pendingOps.map((op) => op.id);
    await store.getState().flushPendingOps(
      createResultClient(async () => ({
        syncedIds: [],
        failedIds: pendingIds,
      }))
    );

    expect(store.getState().tabs).toHaveLength(initialTabCount);
    expect(store.getState().cache.lastSyncError).toBe("sync_failed");
    expect(store.getState().cache.nextSyncRetryAt).toBeTruthy();
  });

  it("keeps pending ops and marks network retry when sync throws", async () => {
    const store = createAppStore();
    seedPendingCollection(store);
    const pendingBefore = store.getState().cache.pendingOps.length;

    await store.getState().flushPendingOps(
      createResultClient(async () => {
        throw new Error("offline");
      })
    );

    expect(store.getState().cache.pendingOps).toHaveLength(pendingBefore);
    expect(store.getState().cache.lastSyncError).toBe("network_error");
    expect(store.getState().cache.nextSyncRetryAt).toBeTruthy();
  });
});
