import { useEffect, useMemo, useState } from "react";
import { Card, SectionTitle } from "@toby/shared-ui";
import { createSupabaseClient, createShareLink, revokeShareLink } from "@toby/api-client";
import { getSync } from "@toby/chrome-adapters";

type ShareConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

type ShareState = {
  resourceType: "collection" | "folder" | "space";
  resourceId: string;
  permission: "view" | "comment" | "edit";
  isPublic: boolean;
};

const CONFIG_KEY = "toby_auth_config_v1";

export function SharePanel({ defaultResourceId }: { defaultResourceId?: string | null }) {
  const [config, setConfig] = useState<ShareConfig | null>(null);
  const [state, setState] = useState<ShareState>({
    resourceType: "collection",
    resourceId: "",
    permission: "view",
    isPublic: false,
  });
  const [status, setStatus] = useState<string>("");
  const [shareId, setShareId] = useState<string>("");
  const [shareToken, setShareToken] = useState<string>("");

  useEffect(() => {
    void (async () => {
      const stored = await getSync<ShareConfig | null>(CONFIG_KEY, null);
      if (stored?.supabaseUrl && stored?.supabaseAnonKey) {
        setConfig(stored);
      }
    })();
  }, []);

  useEffect(() => {
    if (defaultResourceId && !state.resourceId) {
      setState((prev) => ({ ...prev, resourceId: defaultResourceId }));
    }
  }, [defaultResourceId, state.resourceId]);

  const client = useMemo(() => {
    if (!config) {
      return null;
    }
    return createSupabaseClient({ url: config.supabaseUrl, anonKey: config.supabaseAnonKey });
  }, [config]);

  const handleCreate = async () => {
    if (!client) {
      setStatus("Missing Supabase config");
      return;
    }
    if (!state.resourceId) {
      setStatus("Resource id required");
      return;
    }
    const result = await createShareLink(client, state);
    if (result.error) {
      setStatus(result.error.message);
      return;
    }
    setShareId(result.data?.id ?? "");
    setShareToken(result.data?.token ?? "");
    setStatus("Share link created");
  };

  const handleRevoke = async () => {
    if (!client) {
      setStatus("Missing Supabase config");
      return;
    }
    if (!shareId) {
      setStatus("Share id required");
      return;
    }
    const result = await revokeShareLink(client, shareId);
    if (result.error) {
      setStatus(result.error.message);
      return;
    }
    setStatus("Share link revoked");
  };

  return (
    <Card className="p-4">
      <SectionTitle title="Share" />
      <div className="mt-3 space-y-2 text-xs">
        <label className="block">
          <span className="text-slate-400">Resource type</span>
          <select
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1"
            value={state.resourceType}
            onChange={(event) =>
              setState({ ...state, resourceType: event.target.value as ShareState["resourceType"] })
            }
          >
            <option value="collection">Collection</option>
            <option value="folder">Folder</option>
            <option value="space">Space</option>
          </select>
        </label>
        <label className="block">
          <span className="text-slate-400">Resource id</span>
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1"
            value={state.resourceId}
            onChange={(event) => setState({ ...state, resourceId: event.target.value })}
          />
        </label>
        <label className="block">
          <span className="text-slate-400">Permission</span>
          <select
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1"
            value={state.permission}
            onChange={(event) =>
              setState({ ...state, permission: event.target.value as ShareState["permission"] })
            }
          >
            <option value="view">View</option>
            <option value="comment">Comment</option>
            <option value="edit">Edit</option>
          </select>
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={state.isPublic}
            onChange={(event) => setState({ ...state, isPublic: event.target.checked })}
          />
          <span className="text-slate-400">Public link</span>
        </label>
        <label className="block">
          <span className="text-slate-400">Share id (for revoke)</span>
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1"
            value={shareId}
            onChange={(event) => setShareId(event.target.value)}
          />
        </label>
        {shareToken ? (
          <div className="text-slate-400">Token: {shareToken}</div>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-2">
          <button className="rounded border border-slate-700 px-2 py-1" onClick={handleCreate}>
            Create Link
          </button>
          <button className="rounded border border-slate-700 px-2 py-1" onClick={handleRevoke}>
            Revoke Link
          </button>
        </div>
        <div className="text-slate-400">{status}</div>
      </div>
    </Card>
  );
}
