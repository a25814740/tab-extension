import { createClient } from "@supabase/supabase-js";

export type SupabaseConfig = {
  url: string;
  anonKey: string;
};

export function createSupabaseClient(config: SupabaseConfig) {
  return createClient(config.url, config.anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

export { createMockSyncClient } from "./syncClient";
