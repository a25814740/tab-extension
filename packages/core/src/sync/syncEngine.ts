import type { PendingOp } from "../domain/models";

export type SyncResult = {
  syncedIds: string[];
  failedIds: string[];
};

export type SyncClient = {
  pushOps: (ops: PendingOp[]) => Promise<SyncResult>;
};

export async function syncPendingOps(ops: PendingOp[], client: SyncClient) {
  if (ops.length === 0) {
    return { syncedIds: [], failedIds: [] };
  }
  return client.pushOps(ops);
}
