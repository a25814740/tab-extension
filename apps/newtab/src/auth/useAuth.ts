import { useCallback, useEffect, useMemo, useState } from "react";
import { createSupabaseClient, ensureTrialMembership, getGoogleOAuthUrl, signOut } from "@toby/api-client";
import { getRedirectUrl, getSync, launchWebAuthFlow, setSync, getLocal, setLocal } from "@toby/chrome-adapters";
import { useLocale } from "../i18n";

export type AuthConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
};

const CONFIG_KEY = "toby_auth_config_v1";
const USER_KEY = "toby_auth_user_v1";
const TOKEN_KEY = "toby_auth_token_v1";
const MEMBERSHIP_KEY = "toby_membership_v1";

export const DEFAULT_SUPABASE_URL = "https://zhfibzpgabqgqgixgisk.supabase.co";
export const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpoZmlienBnYWJxZ3FnaXhnaXNrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzAyNTksImV4cCI6MjA4OTUwNjI1OX0.R6nnqf9FgpNgWjY3Ya_aLXugYHruK8r1WVNG26jtM4s";

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    let isMounted = true;
    void (async () => {
      const stored = await getLocal<AuthUser | null>(USER_KEY, null);
      if (isMounted) {
        setUser(stored);
      }
    })();

    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== "local" || !changes[USER_KEY]) {
        return;
      }
      setUser((changes[USER_KEY].newValue as AuthUser) ?? null);
    };

    if (chrome?.storage?.onChanged) {
      chrome.storage.onChanged.addListener(onChanged);
    }

    return () => {
      isMounted = false;
      if (chrome?.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(onChanged);
      }
    };
  }, []);

  return user;
}

export function useAuthLogic() {
  const { t } = useLocale();
  const [config, setConfig] = useState<AuthConfig>({
    supabaseUrl: DEFAULT_SUPABASE_URL,
    supabaseAnonKey: DEFAULT_SUPABASE_ANON_KEY,
  });
  const [status, setStatus] = useState<string>(t("auth.status.notSignedIn"));
  const [redirectUrl, setRedirectUrl] = useState<string>("");

  useEffect(() => {
    void (async () => {
      const stored = await getSync<AuthConfig | null>(CONFIG_KEY, null);
      if (stored?.supabaseUrl && stored?.supabaseAnonKey) {
        setConfig(stored);
      }
    })();
  }, []);

  const client = useMemo(() => {
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      return null;
    }
    return createSupabaseClient({
      url: config.supabaseUrl,
      anonKey: config.supabaseAnonKey,
    });
  }, [config.supabaseUrl, config.supabaseAnonKey]);

  const handleSave = useCallback(async () => {
    await setSync(CONFIG_KEY, config);
    setStatus(t("auth.status.configSaved"));
  }, [config, t]);

  const handleGoogle = useCallback(async () => {
    if (!client) {
      setStatus(t("auth.status.missingSupabase"));
      return;
    }

    const oauthRedirectUrl = getRedirectUrl("supabase");
    const oauthResult = await getGoogleOAuthUrl(client, oauthRedirectUrl);
    if (oauthResult.error) {
      setStatus(`${t("auth.status.authFailed")}: ${oauthResult.error.message}`);
      return;
    }
    const authUrl = oauthResult.data?.url;
    if (!authUrl) {
      setStatus(t("auth.status.authFailed"));
      return;
    }

    let responseUrl: string | null = null;
    try {
      responseUrl = await launchWebAuthFlow(authUrl, true);
    } catch (error) {
      setStatus(`${t("auth.status.authFailed")}: ${String(error)}`);
      return;
    }
    if (!responseUrl) {
      setStatus(t("auth.status.authCancelled"));
      return;
    }

    const tokens = extractTokens(responseUrl);
    if (tokens.error) {
      setStatus(tokens.error);
      return;
    }
    if (!tokens.accessToken || !tokens.refreshToken) {
      setStatus(t("auth.status.missingTokens"));
      return;
    }

    await client.auth.setSession({
      access_token: tokens.accessToken,
      refresh_token: tokens.refreshToken,
    });
    const user = await client.auth.getUser();
    const meta = user.data.user?.user_metadata ?? {};
    const name =
      (meta.full_name as string | undefined) ??
      (meta.name as string | undefined) ??
      user.data.user?.email?.split("@")[0] ??
      t("auth.status.signedIn");
    const authUser: AuthUser | null = user.data.user?.email
      ? {
          id: user.data.user.id,
          email: user.data.user.email,
          name,
          avatarUrl: (meta.avatar_url as string | undefined) ?? null,
        }
      : null;

    await setLocal(USER_KEY, authUser);
    await setLocal(TOKEN_KEY, tokens.accessToken);
    const membershipRes = await ensureTrialMembership(client);
    if (!membershipRes.error && membershipRes.data) {
      await setLocal(MEMBERSHIP_KEY, membershipRes.data);
    }
    if (authUser?.email) {
      setStatus(`${t("auth.status.signedInAs")} ${authUser.email}`);
    } else {
      setStatus(t("auth.status.signedIn"));
    }
  }, [client, t]);

  const handleSignOut = useCallback(async () => {
    if (!client) {
      return;
    }
    await signOut(client);
    await setLocal(USER_KEY, null);
    await setLocal(TOKEN_KEY, null);
    await setLocal(MEMBERSHIP_KEY, null);
    setStatus(t("auth.status.signedOut"));
  }, [client, t]);

  const handleClearConfig = useCallback(async () => {
    await setSync(CONFIG_KEY, { supabaseUrl: DEFAULT_SUPABASE_URL, supabaseAnonKey: DEFAULT_SUPABASE_ANON_KEY });
    setConfig({ supabaseUrl: DEFAULT_SUPABASE_URL, supabaseAnonKey: DEFAULT_SUPABASE_ANON_KEY });
    setStatus(t("auth.status.configCleared"));
  }, [t]);

  useEffect(() => {
    const url = getRedirectUrl("supabase");
    setRedirectUrl(url);
  }, []);

  useEffect(() => {
    if (!client) {
      return;
    }
    let isMounted = true;
    setStatus(t("auth.status.checking"));
    void (async () => {
      const session = await client.auth.getSession();
      if (!isMounted) {
        return;
      }
      const email = session.data.session?.user?.email ?? null;
      const meta = session.data.session?.user?.user_metadata ?? {};
      if (email) {
        const name =
          (meta.full_name as string | undefined) ??
          (meta.name as string | undefined) ??
          email.split("@")[0];
        const authUser: AuthUser = {
          id: session.data.session?.user?.id ?? "",
          email,
          name,
          avatarUrl: (meta.avatar_url as string | undefined) ?? null,
        };
        await setLocal(USER_KEY, authUser);
        await setLocal(TOKEN_KEY, session.data.session?.access_token ?? null);
        const membershipRes = await ensureTrialMembership(client);
        if (!membershipRes.error && membershipRes.data) {
          await setLocal(MEMBERSHIP_KEY, membershipRes.data);
        }
        setStatus(`${t("auth.status.signedInAs")} ${email}`);
        return;
      }
      await setLocal(USER_KEY, null);
      await setLocal(TOKEN_KEY, null);
      await setLocal(MEMBERSHIP_KEY, null);
      setStatus(t("auth.status.notSignedIn"));
    })();
    return () => {
      isMounted = false;
    };
  }, [client, t]);

  return {
    config,
    setConfig,
    status,
    redirectUrl,
    handleSave,
    handleGoogle,
    handleSignOut,
    handleClearConfig,
  };
}

function extractTokens(url: string) {
  const parsed = new URL(url);
  const fragment = parsed.hash.startsWith("#") ? parsed.hash.slice(1) : parsed.hash;
  const params = new URLSearchParams(fragment);
  const query = parsed.searchParams;
  const error = query.get("error_description") ?? params.get("error_description");
  return {
    accessToken: params.get("access_token"),
    refreshToken: params.get("refresh_token"),
    error: error ? decodeURIComponent(error) : null,
  };
}
