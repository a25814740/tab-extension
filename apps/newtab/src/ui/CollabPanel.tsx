import { useEffect, useMemo, useState } from "react";
import { Card, SectionTitle } from "@toby/shared-ui";
import { SelectMenu } from "./SelectMenu";
import { createSupabaseClient, inviteMember } from "@toby/api-client";
import { getSync } from "@toby/chrome-adapters";
import { useLocale } from "../i18n";

type CollabConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

const CONFIG_KEY = "toby_auth_config_v1";

export function CollabPanel({ defaultWorkspaceId }: { defaultWorkspaceId?: string | null }) {
  const { t } = useLocale();
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

  useEffect(() => {
    if (defaultWorkspaceId && !workspaceId) {
      setWorkspaceId(defaultWorkspaceId);
    }
  }, [defaultWorkspaceId, workspaceId]);

  const client = useMemo(() => {
    if (!config) {
      return null;
    }
    return createSupabaseClient({ url: config.supabaseUrl, anonKey: config.supabaseAnonKey });
  }, [config]);

  const handleInvite = async () => {
    if (!client) {
      setStatus(t("collab.status.missingSupabase"));
      return;
    }
    if (!workspaceId || !userId) {
      setStatus(t("collab.status.workspaceUserRequired"));
      return;
    }
    const result = await inviteMember(client, { workspaceId, userId, role });
    if (result.error) {
      setStatus(result.error.message);
      return;
    }
    setStatus(t("collab.status.invited"));
  };

  return (
    <Card className="p-4">
      <SectionTitle title={t("collab.title")} />
      <div className="mt-3 space-y-2 text-xs">
        <label className="block">
          <span className="text-slate-400">{t("collab.workspaceId")}</span>
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1"
            value={workspaceId}
            onChange={(event) => setWorkspaceId(event.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-slate-400">{t("collab.userId")}</span>
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1"
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
          />
        </label>
        <label className="block">
          <SelectMenu
            value={role}
            onChange={(value) => setRole(value)}
            options={[
              { value: "owner", label: t("collab.role.owner"), group: "角色" },
              { value: "admin", label: t("collab.role.admin"), group: "角色" },
              { value: "editor", label: t("collab.role.editor"), group: "角色" },
              { value: "commenter", label: t("collab.role.commenter"), group: "角色" },
              { value: "viewer", label: t("collab.role.viewer"), group: "角色" },
            ]}
            label={t("collab.role")}
          />
        </label>
        <div className="flex gap-2 pt-2">
          <button className="rounded border border-slate-700 px-2 py-1" onClick={handleInvite}>
            {t("collab.invite")}
          </button>
        </div>
        <div className="text-slate-400">{status}</div>
      </div>
    </Card>
  );
}
