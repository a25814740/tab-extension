import { useMemo, useState } from "react";
import { Card, SectionTitle } from "@toby/shared-ui";
import { getActiveTab, getCurrentWindowTabs, openTabs } from "@toby/chrome-adapters";
import { useAppStore, useLocalCacheSync } from "../store/appStore";
import { AiPanel } from "./AiPanel";

export function App() {
  useLocalCacheSync();
  const collections = useAppStore((state) => state.collections);
  const tabs = useAppStore((state) => state.tabs);
  const saveCollectionFromTabs = useAppStore((state) => state.saveCollectionFromTabs);
  const addTabToCollection = useAppStore((state) => state.addTabToCollection);
  const lastSyncAt = useAppStore((state) => state.cache.lastSyncAt);
  const lastSyncError = useAppStore((state) => state.cache.lastSyncError);
  const nextSyncRetryAt = useAppStore((state) => state.cache.nextSyncRetryAt);
  const recentCollections = collections.slice(0, 3);
  const [searchQuery, setSearchQuery] = useState("");
  const [targetCollectionId, setTargetCollectionId] = useState("");

  const tabCountByCollection = useMemo(() => {
    const map = new Map<string, number>();
    tabs.forEach((tab) => {
      map.set(tab.collectionId, (map.get(tab.collectionId) ?? 0) + 1);
    });
    return map;
  }, [tabs]);

  const filteredCollections = useMemo(() => {
    if (!searchQuery.trim()) {
      return recentCollections;
    }
    const query = searchQuery.toLowerCase();
    return collections.filter((collection) => {
      if (collection.name.toLowerCase().includes(query)) {
        return true;
      }
      const list = tabs.filter((tab) => tab.collectionId === collection.id);
      return list.some(
        (tab) =>
          tab.title.toLowerCase().includes(query) || tab.url.toLowerCase().includes(query)
      );
    });
  }, [collections, recentCollections, searchQuery, tabs]);

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
    saveCollectionFromTabs(`Window ${new Date().toLocaleTimeString()}`, windowTabs);
  };

  const handleOpenAll = (collectionId: string) => {
    const urls = tabs.filter((tab) => tab.collectionId === collectionId).map((tab) => tab.url);
    if (urls.length > 0) {
      void openTabs(urls);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 px-4 py-3">
        <h1 className="text-base font-semibold">Quick Actions</h1>
        <p className="text-xs text-slate-400">
          {lastSyncAt ? `Last sync ${new Date(lastSyncAt).toLocaleTimeString()}` : "Sync pending"}
          {lastSyncError ? ` • Error (${lastSyncError})` : ""}
          {nextSyncRetryAt ? ` • Retry ${new Date(nextSyncRetryAt).toLocaleTimeString()}` : ""}
        </p>
      </header>
      <main className="space-y-4 px-4 py-4">
        <div className="space-y-2">
          <select
            className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
            value={targetCollectionId}
            onChange={(event) => setTargetCollectionId(event.target.value)}
          >
            <option value="">Save to new collection</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.name}
              </option>
            ))}
          </select>
          <button
            className="w-full rounded bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900"
            onClick={handleSaveActiveTab}
          >
            Save Active Tab
          </button>
          <button
            className="w-full rounded border border-slate-700 px-3 py-2 text-sm"
            onClick={handleSaveCurrentWindow}
          >
            Save Current Window
          </button>
        </div>
        <div>
          <SectionTitle title="Recent Collections" />
          <div className="mt-2 space-y-2">
            {filteredCollections.map((collection) => (
              <Card key={collection.id} className="p-3">
                <div className="text-sm font-medium">{collection.name}</div>
                <div className="text-xs text-slate-400">
                  {tabCountByCollection.get(collection.id) ?? 0} tabs
                </div>
                <button
                  className="mt-2 w-full rounded border border-slate-700 px-2 py-1 text-xs"
                  onClick={() => handleOpenAll(collection.id)}
                >
                  Open All
                </button>
              </Card>
            ))}
          </div>
        </div>
        <div>
          <SectionTitle title="Quick Search" />
          <input
            className="mt-2 w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
            placeholder="Search tabs, collections, folders"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>
        <AiPanel />
      </main>
    </div>
  );
}
