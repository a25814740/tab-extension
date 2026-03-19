import type { PendingOp } from "@toby/core";
import type { SyncClient, SyncResult } from "@toby/core";

export function createMockSyncClient(): SyncClient {
  return {
    async pushOps(ops: PendingOp[]): Promise<SyncResult> {
      return {
        syncedIds: ops.map((op) => op.id),
        failedIds: [],
      };
    },
  };
}
