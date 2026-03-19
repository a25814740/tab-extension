import { useMemo } from "react";
import { Card, SectionTitle } from "@toby/shared-ui";
import { getCurrentWindowTabs, openTabs } from "@toby/chrome-adapters";
import { useAppStore, useLocalCacheSync } from "../store/appStore";

export function App() {
  useLocalCacheSync();
  const workspace = useAppStore((state) => state.workspace);
  const collections = useAppStore((state) => state.collections);
  const spaces = useAppStore((state) => state.spaces);
  const tabs = useAppStore((state) => state.tabs);
  const saveCollectionFromTabs = useAppStore((state) => state.saveCollectionFromTabs);

  const tabCountByCollection = useMemo(() => {
    const map = new Map<string, number>();
    tabs.forEach((tab) => {
      map.set(tab.collectionId, (map.get(tab.collectionId) ?? 0) + 1);
    });
    return map;
  }, [tabs]);

  const handleOpenAll = (collectionId: string) => {
    const urls = tabs.filter((tab) => tab.collectionId === collectionId).map((tab) => tab.url);
    if (urls.length > 0) {
      void openTabs(urls);
    }
  };

  const handleSaveCurrentWindow = async () => {
    const tabs = await getCurrentWindowTabs();
    if (tabs.length === 0) {
      return;
    }

    saveCollectionFromTabs(`Window ${new Date().toLocaleTimeString()}`, tabs);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold">Toby-like Dashboard</h1>
          <p className="text-sm text-slate-400">Workspace: {workspace?.name ?? "Loading"}</p>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded bg-slate-200 px-3 py-2 text-sm font-medium text-slate-900"
            onClick={handleSaveCurrentWindow}
          >
            Save Current Window
          </button>
          <button className="rounded border border-slate-700 px-3 py-2 text-sm">
            New Collection
          </button>
        </div>
      </header>
      <main className="grid grid-cols-12 gap-6 px-6 py-6">
        <aside className="col-span-3 space-y-4">
          <SectionTitle title="Spaces" />
          <div className="space-y-2">
            {spaces.map((space) => (
              <Card key={space.id} className="p-3">
                <div className="text-sm font-medium">{space.name}</div>
                <div className="text-xs text-slate-400">Space order #{space.position}</div>
              </Card>
            ))}
          </div>
        </aside>
        <section className="col-span-9 space-y-4">
          <SectionTitle title="Collections" />
          <div className="grid grid-cols-3 gap-4">
            {collections.map((collection) => (
              <Card key={collection.id} className="p-4">
                <div className="text-base font-semibold">{collection.name}</div>
                <div className="mt-2 text-xs text-slate-400">
                  {tabCountByCollection.get(collection.id) ?? 0} tabs
                </div>
                <button
                  className="mt-4 w-full rounded bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900"
                  onClick={() => handleOpenAll(collection.id)}
                >
                  Open All
                </button>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
