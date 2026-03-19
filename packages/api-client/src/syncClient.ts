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

export function createHttpSyncClient(endpoint: string): SyncClient {
  return {
    async pushOps(ops: PendingOp[]): Promise<SyncResult> {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ops }),
      });
      if (!response.ok) {
        return { syncedIds: [], failedIds: ops.map((op) => op.id) };
      }
      return response.json();
    },
  };
}
