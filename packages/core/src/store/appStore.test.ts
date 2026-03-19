import { describe, expect, it } from "vitest";
import { createAppStore } from "./appStore";
import type { SyncClient } from "../sync/syncEngine";

describe("appStore sync rollback", () => {
  it("rolls back when sync fails", async () => {
    const store = createAppStore();
    const initialCount = store.getState().tabs.length;

    store.getState().addTabToCollection(store.getState().collections[0].id, {
      title: "Test",
      url: "https://example.com",
    });

    expect(store.getState().tabs.length).toBe(initialCount + 1);

    const client: SyncClient = {
      async pushOps() {
        return { syncedIds: [], failedIds: store.getState().cache.pendingOps.map((op) => op.id) };
      },
    };

    await store.getState().flushPendingOps(client);

    expect(store.getState().tabs.length).toBe(initialCount);
  });
});
