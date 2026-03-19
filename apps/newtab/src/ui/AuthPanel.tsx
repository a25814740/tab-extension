import { useEffect, useMemo, useState } from "react";
import { Card, SectionTitle } from "@toby/shared-ui";
import { createSupabaseClient, signInWithGoogle, signInWithMagicLink, signOut } from "@toby/api-client";
import { getSync, setSync } from "@toby/chrome-adapters";

type AuthConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  email: string;
};

const CONFIG_KEY = "toby_auth_config_v1";

export function AuthPanel() {
  const [config, setConfig] = useState<AuthConfig>({
    supabaseUrl: "",
    supabaseAnonKey: "",
    email: "",
  });
  const [status, setStatus] = useState<string>("Not signed in");

  useEffect(() => {
    void (async () => {
      const stored = await getSync<AuthConfig | null>(CONFIG_KEY, null);
      if (stored) {
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

  const handleSave = async () => {
    await setSync(CONFIG_KEY, config);
    setStatus("Config saved");
  };

  const handleGoogle = async () => {
    if (!client) {
      setStatus("Missing Supabase config");
      return;
    }
    // TODO: Replace with chrome.identity.launchWebAuthFlow for MV3.
    await signInWithGoogle(client);
    const user = await client.auth.getUser();
    setStatus(user.data.user?.email ?? "Signed in");
  };

  const handleMagic = async () => {
    if (!client) {
      setStatus("Missing Supabase config");
      return;
    }
    if (!config.email) {
      setStatus("Email required");
      return;
    }
    await signInWithMagicLink(client, config.email);
    setStatus("Magic link sent");
  };

  const handleSignOut = async () => {
    if (!client) {
      return;
    }
    await signOut(client);
    setStatus("Signed out");
  };

  return (
    <Card className="p-4">
      <SectionTitle title="Auth & Sync" />
      <div className="mt-3 space-y-2 text-xs">
        <label className="block">
          <span className="text-slate-400">Supabase URL</span>
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1"
            value={config.supabaseUrl}
            onChange={(event) => setConfig({ ...config, supabaseUrl: event.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-slate-400">Supabase Anon Key</span>
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1"
            value={config.supabaseAnonKey}
            onChange={(event) => setConfig({ ...config, supabaseAnonKey: event.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-slate-400">Email (magic link)</span>
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1"
            value={config.email}
            onChange={(event) => setConfig({ ...config, email: event.target.value })}
          />
        </label>
        <div className="flex flex-wrap gap-2 pt-2">
          <button className="rounded border border-slate-700 px-2 py-1" onClick={handleSave}>
            Save Config
          </button>
          <button className="rounded border border-slate-700 px-2 py-1" onClick={handleGoogle}>
            Google Sign In
          </button>
          <button className="rounded border border-slate-700 px-2 py-1" onClick={handleMagic}>
            Magic Link
          </button>
          <button className="rounded border border-slate-700 px-2 py-1" onClick={handleSignOut}>
            Sign Out
          </button>
        </div>
        <div className="text-slate-400">{status}</div>
      </div>
    </Card>
  );
}
