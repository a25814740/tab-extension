import type { SupabaseClient } from "@supabase/supabase-js";

export async function signInWithGoogle(client: SupabaseClient) {
  return client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "https://extension.local/redirect",
    },
  });
}

export async function getGoogleOAuthUrl(client: SupabaseClient, redirectTo: string) {
  const result = await client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  return result;
}

export async function signInWithMagicLink(client: SupabaseClient, email: string) {
  return client.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: "https://extension.local/redirect",
    },
  });
}

export async function signOut(client: SupabaseClient) {
  return client.auth.signOut();
}
