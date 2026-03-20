import { createClient } from "@supabase/supabase-js";

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

type SupabaseClientCache = {
  key: string;
  client: ReturnType<typeof createClient>;
};

declare global {
  // eslint-disable-next-line no-var
  var __tobySupabaseClientCache: SupabaseClientCache | undefined;
}

export function createSupabaseClient(config: SupabaseConfig) {
  const cacheKey = `${config.url}:${config.anonKey}`;
  if (globalThis.__tobySupabaseClientCache?.key === cacheKey) {
    return globalThis.__tobySupabaseClientCache.client;
  }
  const client = createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
  globalThis.__tobySupabaseClientCache = { key: cacheKey, client };
  return client;
}

export { createMockSyncClient, createHttpSyncClient } from "./syncClient";
export * from "./authClient";
export * from "./shareClient";
export * from "./collabClient";
export * from "./snapshotClient";
