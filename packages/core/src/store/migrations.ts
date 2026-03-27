import type { LocalStoreSnapshot } from "../schemas/appSchemas";
import { defaultCache } from "./appState";

export const LOCAL_SCHEMA_VERSION = 2;

export function migrateLocalSnapshot(snapshot: LocalStoreSnapshot): LocalStoreSnapshot {
  const cacheVersion = snapshot.cache?.version ?? 0;
  const mergedCache = {
    ...defaultCache,
    ...snapshot.cache,
    ui: {
      ...defaultCache.ui,
      ...snapshot.cache?.ui,
    },
    dock: snapshot.cache?.dock ?? defaultCache.dock,
    version: Math.max(cacheVersion, LOCAL_SCHEMA_VERSION),
  };
  return {
    ...snapshot,
    cache: mergedCache,
  };
}
