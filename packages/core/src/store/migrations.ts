import type { LocalStoreSnapshot } from "../schemas/appSchemas";
import { defaultCache } from "./appState";

export const LOCAL_SCHEMA_VERSION = 1;

export function migrateLocalSnapshot(snapshot: LocalStoreSnapshot): LocalStoreSnapshot {
  const cacheVersion = snapshot.cache?.version ?? 0;
  if (cacheVersion >= LOCAL_SCHEMA_VERSION) {
    return snapshot;
  }
  return {
    ...snapshot,
    cache: {
      ...defaultCache,
      ...snapshot.cache,
      version: LOCAL_SCHEMA_VERSION,
    },
  };
}
