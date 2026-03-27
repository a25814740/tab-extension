import { describe, expect, it } from "vitest";
import { syncPendingOps, type SyncClient } from "./syncEngine";

describe("syncPendingOps", () => {
  it("returns empty for no ops", async () => {
    const client: SyncClient = {
      async pushOps() {
        return { syncedIds: [], failedIds: [] };
      },
    };

    const result = await syncPendingOps([], client);
    expect(result.syncedIds.length).toBe(0);
  });
});
