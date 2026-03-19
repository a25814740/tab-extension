import { useEffect, useMemo, useState } from "react";
import { SectionTitle } from "@toby/shared-ui";
import { getCurrentWindowTabs, openTabs } from "@toby/chrome-adapters";
import { useAppStore, useLocalCacheSync } from "../store/appStore";
import { Tree } from "./Tree";
import { CollectionCard } from "./CollectionCard";
import { TabRow } from "./TabRow";
import { createRuleBasedProvider } from "@toby/ai";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  useDndMonitor,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

export function App() {
  useLocalCacheSync();
  const workspace = useAppStore((state) => state.workspace);
  const collections = useAppStore((state) => state.collections);
  const spaces = useAppStore((state) => state.spaces);
  const folders = useAppStore((state) => state.folders);
  const setSelectedSpaceId = useAppStore((state) => state.setSelectedSpaceId);
  const reorderSpaces = useAppStore((state) => state.reorderSpaces);
  const reorderCollections = useAppStore((state) => state.reorderCollections);
  const reorderCollectionsWithIndex = useAppStore((state) => state.reorderCollectionsWithIndex);
  const reorderFolders = useAppStore((state) => state.reorderFolders);
  const reorderTabs = useAppStore((state) => state.reorderTabs);
  const reorderTabsWithIndex = useAppStore((state) => state.reorderTabsWithIndex);
  const expandedFolderIds = useAppStore((state) => state.cache.expandedFolderIds);
  const toggleFolderExpanded = useAppStore((state) => state.toggleFolderExpanded);
  const expandFolder = useAppStore((state) => state.expandFolder);
  const tabs = useAppStore((state) => state.tabs);
  const lastSyncAt = useAppStore((state) => state.cache.lastSyncAt);
  const [overId, setOverId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
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

  const tabsByCollection = useMemo(() => {
    const map = new Map<string, typeof tabs>();
    tabs.forEach((tab) => {
      const list = map.get(tab.collectionId) ?? [];
      list.push(tab);
      map.set(tab.collectionId, list);
    });
    map.forEach((list) => list.sort((a, b) => a.position - b.position));
    return map;
  }, [tabs]);

  useEffect(() => {
    const provider = createRuleBasedProvider();
    const run = async () => {
      const next: Record<string, string> = {};
      for (const collection of collections) {
        const list = tabsByCollection.get(collection.id) ?? [];
        const result = await provider.summarize(list.map((tab) => ({ title: tab.title, url: tab.url })));
        next[collection.id] = result.summary;
      }
      setSummaries(next);
    };
    void run();
  }, [collections, tabsByCollection]);

  const handleSaveCurrentWindow = async () => {
    const tabs = await getCurrentWindowTabs();
    if (tabs.length === 0) {
      return;
    }

    saveCollectionFromTabs(`Window ${new Date().toLocaleTimeString()}`, tabs);
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useDndMonitor({
    onDragOver: (event) => {
      setOverId(event.over ? String(event.over.id) : null);
    },
    onDragEnd: () => setOverId(null),
    onDragCancel: () => setOverId(null),
  });

  const handleDragEnd = (event: DragEndEvent) => {
    if (!event.over || event.active.id === event.over.id) {
      return;
    }

    const activeId = String(event.active.id);
    const overId = String(event.over.id);

    const isSpace = spaces.some((space) => space.id === activeId);
    const isFolder = folders.some((folder) => folder.id === activeId);
    const isCollection = collections.some((collection) => collection.id === activeId);
    const isTab = tabs.some((tab) => tab.id === activeId);

    if (isSpace) {
      reorderSpaces(activeId, overId);
      return;
    }

    if (isFolder) {
      reorderFolders(activeId, overId);
      return;
    }

    if (isCollection) {
      const placeAfter = Boolean(event.over?.data.current?.placeAfter);
      if (event.over?.data.current?.placeAfter !== undefined) {
        reorderCollectionsWithIndex(activeId, overId, placeAfter);
      } else {
        reorderCollections(activeId, overId);
      }
      return;
    }

    if (isTab) {
      const placeAfter = Boolean(event.over?.data.current?.placeAfter);
      if (event.over?.data.current?.placeAfter !== undefined) {
        reorderTabsWithIndex(activeId, overId, placeAfter);
      } else {
        reorderTabs(activeId, overId);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold">Toby-like Dashboard</h1>
          <p className="text-sm text-slate-400">
            Workspace: {workspace?.name ?? "Loading"}{" "}
            {lastSyncAt ? `• Last sync ${new Date(lastSyncAt).toLocaleTimeString()}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="rounded border border-slate-700 px-3 py-2 text-sm">
            Sign In
          </button>
          <button
            className="rounded bg-slate-200 px-3 py-2 text-sm font-medium text-slate-900"
            onClick={handleSaveCurrentWindow}
          >
            Save Current Window
          </button>
          <button className="rounded border border-slate-700 px-3 py-2 text-sm">
            New Collection
          </button>
          <button className="rounded border border-slate-700 px-3 py-2 text-sm">
            Share
          </button>
        </div>
      </header>
      <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
        <main className="grid grid-cols-12 gap-6 px-6 py-6">
        <aside className="col-span-3 space-y-4">
          <SectionTitle title="Spaces" />
          <Tree
            spaces={spaces}
            folders={folders}
            onSelectSpace={setSelectedSpaceId}
            expandedFolderIds={expandedFolderIds}
            onToggleFolder={toggleFolderExpanded}
            onExpandFolder={expandFolder}
            overId={overId}
          />
        </aside>
        <section className="col-span-9 space-y-4">
          <SectionTitle title="Collections" />
          <SortableContext items={collections.map((collection) => collection.id)} strategy={verticalListSortingStrategy}>
            <div className="grid grid-cols-3 gap-4">
              {collections.map((collection) => (
                  <CollectionCard
                    key={collection.id}
                    id={collection.id}
                    name={collection.name}
                    tabCount={tabCountByCollection.get(collection.id) ?? 0}
                    summary={summaries[collection.id]}
                    onOpenAll={() => handleOpenAll(collection.id)}
                  >
                  <SortableContext
                    items={(tabsByCollection.get(collection.id) ?? []).map((tab) => tab.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="mt-3 space-y-2">
                      {(tabsByCollection.get(collection.id) ?? []).map((tab) => (
                        <TabRow key={tab.id} id={tab.id} title={tab.title} url={tab.url} />
                      ))}
                    </div>
                  </SortableContext>
                </CollectionCard>
              ))}
            </div>
          </SortableContext>
        </section>
      </main>
      </DndContext>
    </div>
  );
}
