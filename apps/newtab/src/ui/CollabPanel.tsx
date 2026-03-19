import { useEffect, useMemo, useState } from "react";
import { Card, SectionTitle } from "@toby/shared-ui";
import { createSupabaseClient, inviteMember } from "@toby/api-client";
import { getSync } from "@toby/chrome-adapters";

type CollabConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

const CONFIG_KEY = "toby_auth_config_v1";

export function CollabPanel() {
  const [config, setConfig] = useState<CollabConfig | null>(null);
  const [workspaceId, setWorkspaceId] = useState("");
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState<"owner" | "admin" | "editor" | "commenter" | "viewer">("viewer");
  const [status, setStatus] = useState("");

  useEffect(() => {
    void (async () => {
      const stored = await getSync<CollabConfig | null>(CONFIG_KEY, null);
      if (stored?.supabaseUrl && stored?.supabaseAnonKey) {
        setConfig(stored);
      }
    })();
  }, []);

  const client = useMemo(() => {
    if (!config) {
      return null;
    }
    return createSupabaseClient({ url: config.supabaseUrl, anonKey: config.supabaseAnonKey });
  }, [config]);

  const handleInvite = async () => {
    if (!client) {
      setStatus("Missing Supabase config");
      return;
    }
    if (!workspaceId || !userId) {
      setStatus("Workspace id and user id required");
      return;
    }
    const result = await inviteMember(client, { workspaceId, userId, role });
    if (result.error) {
      setStatus(result.error.message);
      return;
    }
    setStatus("Member invited");
  };

  return (
    <Card className="p-4">
      <SectionTitle title="Collaboration" />
      <div className="mt-3 space-y-2 text-xs">
        <label className="block">
          <span className="text-slate-400">Workspace id</span>
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1"
            value={workspaceId}
            onChange={(event) => setWorkspaceId(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-slate-400">User id</span>
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-slate-400">Role</span>
          <select
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1"
            value={role}
            onChange={(event) => setRole(event.target.value as typeof role)}
          >
            <option value="owner">Owner</option>
            <option value="admin">Admin</option>
            <option value="editor">Editor</option>
            <option value="commenter">Commenter</option>
            <option value="viewer">Viewer</option>
          </select>
        </label>
        <div className="flex gap-2 pt-2">
          <button className="rounded border border-slate-700 px-2 py-1" onClick={handleInvite}>
            Invite
          </button>
        </div>
        <div className="text-slate-400">{status}</div>
      </div>
    </Card>
  );
}
