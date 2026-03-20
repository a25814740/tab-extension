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

export function createHttpSyncClient(
  endpoint: string,
  options?: { accessToken?: string | null; anonKey?: string | null }
): SyncClient {
  return {
    async pushOps(ops: PendingOp[]): Promise<SyncResult> {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (options?.accessToken) {
        headers.Authorization = `Bearer ${options.accessToken}`;
      }
      if (options?.anonKey) {
        headers.apikey = options.anonKey;
      }
      const response = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({ ops }),
      });
      if (!response.ok) {
        return { syncedIds: [], failedIds: ops.map((op) => op.id) };
      }
      return response.json();
    },
  };
}
