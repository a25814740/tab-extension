import { useEffect, useMemo, useState } from "react";
import { Card, SectionTitle } from "@toby/shared-ui";
import { getActiveTab, getCurrentWindowTabs, openTabs } from "@toby/chrome-adapters";
import { useAppStore, useLocalCacheSync } from "../store/appStore";
import { AiPanel } from "./AiPanel";
import { useLocale } from "../i18n";

export function App() {
  useLocalCacheSync();
  const { t } = useLocale();
  const workspaces = useAppStore((state) => state.workspaces);
  const spaces = useAppStore((state) => state.spaces);
  const collections = useAppStore((state) => state.collections);
  const tabs = useAppStore((state) => state.tabs);
  const selectedWorkspaceId = useAppStore((state) => state.cache.selectedWorkspaceId);
  const workspace = useAppStore((state) => state.workspace);
  const setSelectedWorkspaceId = useAppStore((state) => state.setSelectedWorkspaceId);
  const setSelectedSpaceId = useAppStore((state) => state.setSelectedSpaceId);
  const setSelectedCollectionId = useAppStore((state) => state.setSelectedCollectionId);
  const saveCollectionFromTabs = useAppStore((state) => state.saveCollectionFromTabs);
  const addTabToCollection = useAppStore((state) => state.addTabToCollection);
  const lastSyncAt = useAppStore((state) => state.cache.lastSyncAt);
  const lastSyncError = useAppStore((state) => state.cache.lastSyncError);
  const nextSyncRetryAt = useAppStore((state) => state.cache.nextSyncRetryAt);
  const pendingCount = useAppStore((state) => state.cache.pendingOps.length);
  const activeWorkspaceId = selectedWorkspaceId ?? workspace?.id ?? null;
  const scopedCollections = useMemo(
    () =>
      activeWorkspaceId
        ? collections.filter((collection) => collection.workspaceId === activeWorkspaceId)
        : [],
    [activeWorkspaceId, collections]
  );
  const scopedTabs = useMemo(
    () =>
      activeWorkspaceId
        ? tabs.filter((tab) => scopedCollections.some((collection) => collection.id === tab.collectionId))
        : [],
    [activeWorkspaceId, tabs, scopedCollections]
  );

  useEffect(() => {
    if (!collections.length) {
      return;
    }
    const workspaceScores = new Map<string, { score: number }>();
    collections.forEach((collection) => {
      workspaceScores.set(collection.workspaceId, {
        score: (workspaceScores.get(collection.workspaceId)?.score ?? 0) + 1000,
      });
    });
    const currentId = selectedWorkspaceId ?? workspace?.id ?? null;
    if (currentId && workspaceScores.has(currentId)) {
      return;
    }
    const best = Array.from(workspaceScores.entries())
      .sort((a, b) => b[1].score - a[1].score)[0]
      ?.[0];
    if (!best) {
      return;
    }
    setSelectedWorkspaceId(best);
    const firstCollection = collections.find((collection) => collection.workspaceId === best) ?? null;
    if (firstCollection) {
      setSelectedCollectionId(firstCollection.id);
    }
    const firstSpace =
      firstCollection && collections.length
        ? collections.find((collection) => collection.workspaceId === best)?.spaceId ?? null
        : null;
    if (firstSpace) {
      setSelectedSpaceId(firstSpace);
    }
  }, [
    collections,
    selectedWorkspaceId,
    setSelectedCollectionId,
    setSelectedSpaceId,
    setSelectedWorkspaceId,
    workspace?.id,
  ]);
  const [searchQuery, setSearchQuery] = useState("");
  const [targetWorkspaceId, setTargetWorkspaceId] = useState("");
  const [targetSpaceId, setTargetSpaceId] = useState("");
  const [targetCollectionId, setTargetCollectionId] = useState("");
  const recentCollections = scopedCollections.slice(0, 3);

  const tabCountByCollection = useMemo(() => {
    const map = new Map<string, number>();
    scopedTabs.forEach((tab) => {
      map.set(tab.collectionId, (map.get(tab.collectionId) ?? 0) + 1);
    });
    return map;
  }, [scopedTabs]);

  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) {
      return recentCollections;
    }
    const query = searchQuery.toLowerCase();
    return scopedCollections.filter((collection) => {
      if (collection.name.toLowerCase().includes(query)) {
        return true;
      }
      const list = scopedTabs.filter((tab) => tab.collectionId === collection.id);
      return list.some(
        (tab) =>
          tab.title.toLowerCase().includes(query) || tab.url.toLowerCase().includes(query)
      );
    });
  }, [scopedCollections, recentCollections, searchQuery, scopedTabs]);

  // Keep the save target aligned with the current workspace/space selection.
  useEffect(() => {
    const workspaceId = targetWorkspaceId || activeWorkspaceId || workspaces[0]?.id || "";
    if (!workspaceId) {
      return;
    }
    if (workspaceId !== targetWorkspaceId) {
      setTargetWorkspaceId(workspaceId);
    }
    const nextSpaceId =
      targetSpaceId && spaces.some((space) => space.id === targetSpaceId && space.workspaceId === workspaceId)
        ? targetSpaceId
        : spaces.find((space) => space.workspaceId === workspaceId)?.id ?? "";
    if (nextSpaceId !== targetSpaceId) {
      setTargetSpaceId(nextSpaceId);
    }
    const nextCollectionId =
      targetCollectionId &&
      collections.some(
        (collection) => collection.id === targetCollectionId && collection.spaceId === nextSpaceId
      )
        ? targetCollectionId
        : collections.find(
            (collection) => collection.workspaceId === workspaceId && collection.spaceId === nextSpaceId
          )?.id ?? "";
    if (nextCollectionId !== targetCollectionId) {
      setTargetCollectionId(nextCollectionId);
    }
  }, [
    activeWorkspaceId,
    collections,
    spaces,
    targetCollectionId,
    targetSpaceId,
    targetWorkspaceId,
    workspaces,
  ]);

  const workspaceOptions = useMemo(
    () => workspaces.filter((item) => item.id),
    [workspaces]
  );
  const spaceOptions = useMemo(
    () => spaces.filter((space) => space.workspaceId === targetWorkspaceId),
    [spaces, targetWorkspaceId]
  );
  const collectionOptions = useMemo(
    () => collections.filter((collection) => collection.spaceId === targetSpaceId),
    [collections, targetSpaceId]
  );

  const handleSaveActiveTab = async () => {
    const tab = await getActiveTab();
    if (!tab) {
      return;
    }
    if (targetCollectionId) {
      addTabToCollection(targetCollectionId, tab);
      return;
    }
    saveCollectionFromTabs(tab.title, [tab]);
  };

  const handleSaveCurrentWindow = async () => {
    const windowTabs = await getCurrentWindowTabs();
    if (windowTabs.length === 0) {
      return;
    }
    saveCollectionFromTabs(`${t("side.windowPrefix")} ${new Date().toLocaleTimeString()}`, windowTabs);
  };

  const handleOpenAll = (collectionId: string) => {
    const urls = scopedTabs.filter((tab) => tab.collectionId === collectionId).map((tab) => tab.url);
    if (urls.length > 0) {
      void openTabs(urls);
    }
  };

  return (
    <div className="min-h-screen min-w-[380px] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      <header className="border-b border-slate-800/80 px-4 py-3">
        <h1 className="text-base font-semibold tracking-wide">{t("side.title")}</h1>
        <p className="text-xs text-slate-400/90">
          {lastSyncAt
            ? `${t("side.lastSync")} ${new Date(lastSyncAt).toLocaleTimeString()}`
            : t("side.syncPending")}
          {lastSyncError ? ` • ${t("side.error")} (${lastSyncError})` : ""}
          {nextSyncRetryAt ? ` • ${t("side.retry")} ${new Date(nextSyncRetryAt).toLocaleTimeString()}` : ""}
          {pendingCount > 0 ? ` • ${t("side.pending")} ${pendingCount}` : ""}
        </p>
      </header>
      <main className="space-y-4 px-4 py-4">
        <div>
          <SectionTitle title={t("side.quickSearch")} />
          <input
            className="mt-2 w-full rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm shadow-sm focus:border-rose-400/60 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
            placeholder={t("side.searchPlaceholder")}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <div className="space-y-2 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-3 shadow-lg shadow-black/20">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
            {t("side.saveTarget")}
          </div>
          <label className="block">
            <div className="mb-1 text-xs text-slate-400">{t("side.organization")}</div>
            <select
              className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm focus:border-rose-400/60 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              value={targetWorkspaceId}
              onChange={(event) => {
                const nextId = event.target.value;
                setTargetWorkspaceId(nextId);
                setSelectedWorkspaceId(nextId);
              }}
            >
              {workspaceOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <div className="mb-1 text-xs text-slate-400">{t("side.space")}</div>
            <select
              className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm focus:border-rose-400/60 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              value={targetSpaceId}
              onChange={(event) => {
                const nextId = event.target.value;
                setTargetSpaceId(nextId);
                setSelectedSpaceId(nextId);
              }}
            >
              {spaceOptions.map((space) => (
                <option key={space.id} value={space.id}>
                  {space.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <div className="mb-1 text-xs text-slate-400">{t("side.collection")}</div>
            <select
              className="w-full rounded-xl border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm focus:border-rose-400/60 focus:outline-none focus:ring-2 focus:ring-rose-500/30"
              value={targetCollectionId}
              onChange={(event) => {
                const nextId = event.target.value;
                setTargetCollectionId(nextId);
                setSelectedCollectionId(nextId || null);
              }}
            >
              <option value="">{t("side.saveToNewCollection")}</option>
              {collectionOptions.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
          </label>
          <button
            className="w-full rounded-xl bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900 shadow-sm"
            onClick={handleSaveActiveTab}
          >
            {t("side.saveActiveTab")}
          </button>
          <button
            className="w-full rounded-xl border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:border-rose-400/60"
            onClick={handleSaveCurrentWindow}
          >
            {t("side.saveCurrentWindow")}
          </button>
        </div>
        <div>
          <SectionTitle title={t("side.recentCollections")} />
          <div className="mt-2 space-y-2">
            {filteredCollections.map((collection) => (
              <Card key={collection.id} className="border border-slate-800/80 bg-slate-900/50 p-3 shadow">
                <div className="text-sm font-medium tracking-wide">{collection.name}</div>
                <div className="text-xs text-slate-400/90">
                  {tabCountByCollection.get(collection.id) ?? 0} {t("side.tabs")}
                </div>
                <button
                  className="mt-2 w-full rounded-lg border border-slate-700 px-2 py-1 text-xs hover:border-rose-400/60"
                  onClick={() => handleOpenAll(collection.id)}
                >
                  {t("side.openAll")}
                </button>
              </Card>
            ))}
          </div>
        </div>
        <AiPanel />
      </main>
    </div>
  );
}
