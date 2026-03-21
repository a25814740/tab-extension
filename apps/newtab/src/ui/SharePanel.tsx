import { useEffect, useMemo, useState } from "react";
import { Card, SectionTitle } from "@toby/shared-ui";
import { SelectMenu } from "./SelectMenu";
import { createSupabaseClient, createShareLink, revokeShareLink } from "@toby/api-client";
import { getSync } from "@toby/chrome-adapters";
import { useLocale } from "../i18n";

type ShareConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

type ShareState = {
  workspaceId: string;
  resourceType: "collection" | "folder" | "space";
  resourceId: string;
  permission: "view" | "comment" | "edit";
  isPublic: boolean;
};

const CONFIG_KEY = "toby_auth_config_v1";

export function SharePanel({
  defaultResourceId,
  defaultWorkspaceId,
  collections,
}: {
  defaultResourceId?: string | null;
  defaultWorkspaceId?: string | null;
  collections?: Array<{ id: string; name: string }>;
}) {
  const { t } = useLocale();
  const checkboxClass =
    "h-4 w-4 rounded border-slate-600 bg-slate-900 text-rose-400 focus:ring-rose-500/40";
  const [config, setConfig] = useState<ShareConfig | null>(null);
  const [state, setState] = useState<ShareState>({
    workspaceId: defaultWorkspaceId ?? "",
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

  useEffect(() => {
    if (defaultWorkspaceId && !state.workspaceId) {
      setState((prev) => ({ ...prev, workspaceId: defaultWorkspaceId }));
    }
  }, [defaultWorkspaceId, state.workspaceId]);

  const client = useMemo(() => {
    if (!config) {
      return null;
    }
    return createSupabaseClient({ url: config.supabaseUrl, anonKey: config.supabaseAnonKey });
  }, [config]);

  const handleCreate = async () => {
    if (!client) {
      setStatus(t("share.status.missingSupabase"));
      return;
    }
    if (!state.workspaceId) {
      setStatus(t("share.status.resourceRequired"));
      return;
    }
    if (!state.resourceId) {
      setStatus(t("share.status.resourceRequired"));
      return;
    }
    const result = await createShareLink(client, state);
    if (result.error) {
      setStatus(result.error.message);
      return;
    }
    setShareId(result.data?.id ?? "");
    setShareToken(result.data?.token ?? "");
    setStatus(t("share.status.created"));
  };

  const handleRevoke = async () => {
    if (!client) {
      setStatus(t("share.status.missingSupabase"));
      return;
    }
    if (!shareId) {
      setStatus(t("share.status.revokeRequired"));
      return;
    }
    const result = await revokeShareLink(client, shareId);
    if (result.error) {
      setStatus(result.error.message);
      return;
    }
    setStatus(t("share.status.revoked"));
  };

  return (
    <Card className="p-4">
      <SectionTitle title={t("share.title")} />
      <div className="mt-3 space-y-2 text-xs">
        <label className="block">
          <SelectMenu
            value={state.resourceType}
            onChange={(value) => setState({ ...state, resourceType: value })}
            options={[
              { value: "collection", label: t("entity.collection"), group: "資源類型" },
              { value: "folder", label: t("entity.folder"), group: "資源類型" },
              { value: "space", label: t("entity.space"), group: "資源類型" },
            ]}
            label={t("share.resourceType")}
          />
        </label>
        <label className="block">
          <span className="text-slate-400">{t("share.resourceId")}</span>
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1"
            value={state.resourceId}
            onChange={(event) => setState({ ...state, resourceId: event.target.value })}
          />
        </label>
        {state.resourceType === "collection" && collections && collections.length > 0 ? (
          <label className="block">
            <SelectMenu
              value={state.resourceId}
              onChange={(value) => setState({ ...state, resourceId: value })}
              options={[
                { value: "", label: t("share.chooseCollection"), group: "集合" },
                ...collections.map((collection) => ({ value: collection.id, label: collection.name, group: "集合" })),
              ]}
              label={t("share.selectCollection")}
              searchable
              searchPlaceholder="搜尋集合"
            />
          </label>
        ) : null}
        <label className="block">
          <SelectMenu
            value={state.permission}
            onChange={(value) => setState({ ...state, permission: value })}
            options={[
              { value: "view", label: t("share.permission.view"), group: "權限" },
              { value: "comment", label: t("share.permission.comment"), group: "權限" },
              { value: "edit", label: t("share.permission.edit"), group: "權限" },
            ]}
            label={t("share.permission")}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            className={checkboxClass}
            checked={state.isPublic}
            onChange={(event) => setState({ ...state, isPublic: event.target.checked })}
          />
          <span className="text-slate-400">{t("share.publicLink")}</span>
        </label>
        <label className="block">
          <span className="text-slate-400">{t("share.shareId")}</span>
          <input
            className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1"
            value={shareId}
            onChange={(event) => setShareId(event.target.value)}
          />
        </label>
        {shareToken ? <div className="text-slate-400">{t("share.token")}: {shareToken}</div> : null}
        <div className="flex flex-wrap gap-2 pt-2">
          <button className="rounded border border-slate-700 px-2 py-1" onClick={handleCreate}>
            {t("share.create")}
          </button>
          <button className="rounded border border-slate-700 px-2 py-1" onClick={handleRevoke}>
            {t("share.revoke")}
          </button>
        </div>
        <div className="text-slate-400">{status}</div>
      </div>
    </Card>
  );
}
