import type { CSSProperties, Dispatch, RefObject, SetStateAction } from "react";
import type { DragEvent } from "react";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { UseDroppableReturn } from "@dnd-kit/core";
import { Plus, Search, Pencil, Trash2, UserPlus } from "lucide-react";

import type { Collection, TabItem, Workspace } from "@toby/core";
import { SelectMenu } from "../SelectMenu";
import { CollectionRow } from "../CollectionRow";
import { CollectionCard } from "../CollectionCard";
import { TabRow } from "../TabRow";

type AddCollectionAction = "blank" | "current-window" | "selected-tabs";
type SortMode = "custom" | "recent";
type ViewMode = "image" | "card" | "compact" | "list";

export type MainContentPanelProps = {
  locale: string;
  t: (key: string) => string;
  workspace: Workspace | null;
  activeSpaceName: string;
  mainPanelThemeStyle: CSSProperties;

  searchWrapRef: RefObject<HTMLDivElement>;
  searchInputRef: RefObject<HTMLInputElement>;
  searchOpen: boolean;
  setSearchOpen: Dispatch<SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;

  createCollectionMenuOpen: boolean;
  setCreateCollectionMenuOpen: Dispatch<SetStateAction<boolean>>;
  handleAddCollectionAction: (action: AddCollectionAction) => void;

  sortMode: SortMode;
  setSortMode: (value: SortMode) => void;
  viewMode: ViewMode;
  setViewMode: (value: ViewMode) => void;

  sortedCollections: Collection[];
  tabsByCollection: Map<string, TabItem[]>;
  tabCountByCollection: Map<string, number>;

  entityMenu: { type: string; id: string } | null;
  setEntityMenu: Dispatch<SetStateAction<{ type: string; id: string } | null>>;
  selectedCollectionId: string | null;
  setSelectedCollectionId: (id: string | null) => void;

  blankCollectionDropActive: boolean;
  setBlankCollectionDropActive: Dispatch<SetStateAction<boolean>>;
  collectionBlankAreaDrop: UseDroppableReturn;
  collectionBlankDrop: UseDroppableReturn;
  handleDropRawToBlank: (dataTransfer: DataTransfer) => void;

  collapsedCollections: Record<string, boolean>;
  handleToggleCollectionCollapse: (collectionId: string) => void;
  allCollectionsCollapsed: boolean;
  handleExpandAllCollections: () => void;
  handleCollapseAllCollections: () => void;

  selectedTabIds: Set<string>;
  toggleTabSelection: (tabId: string) => void;
  openCollectionTabs: (collectionId: string) => void;
  moveCollection: (collectionId: string, direction: "up" | "down") => void;
  handleOpenCollectionSettings: (collectionId: string) => void;
  addTabToDock: (tab: TabItem) => void;
  moveTabToCollection: (tabId: string, destinationCollectionId: string, afterTabId?: string) => void;
  reorderTabsWithIndex: (activeId: string, overId: string, placeAfter: boolean) => void;
  deleteCollection: (collectionId: string) => void;
  handleOpenCollectionInvite: (collectionId: string) => void;
  handleEditCollectionTitle: (collectionId: string, name: string) => void;

  workspaces: Array<{ id: string; name: string }>;
  spaces: Array<{ id: string; workspaceId: string; name: string }>;
  collections: Array<{ id: string; spaceId: string; workspaceId: string; name: string }>;
};

export function MainContentPanel(props: MainContentPanelProps) {
  const {
    locale,
    t,
    workspace,
    activeSpaceName,
    mainPanelThemeStyle,
    searchWrapRef,
    searchInputRef,
    searchOpen,
    setSearchOpen,
    searchQuery,
    setSearchQuery,
    createCollectionMenuOpen,
    setCreateCollectionMenuOpen,
    handleAddCollectionAction,
    sortMode,
    setSortMode,
    viewMode,
    setViewMode,
    sortedCollections,
    tabsByCollection,
    tabCountByCollection,
    entityMenu,
    setEntityMenu,
    setSelectedCollectionId,
    blankCollectionDropActive,
    setBlankCollectionDropActive,
    collectionBlankAreaDrop,
    collectionBlankDrop,
    handleDropRawToBlank,
    collapsedCollections,
    handleToggleCollectionCollapse,
    allCollectionsCollapsed,
    handleExpandAllCollections,
    handleCollapseAllCollections,
    selectedTabIds,
    toggleTabSelection,
    openCollectionTabs,
    moveCollection,
    handleOpenCollectionSettings,
    addTabToDock,
    moveTabToCollection,
    deleteCollection,
    handleOpenCollectionInvite,
    handleEditCollectionTitle,
    workspaces,
    spaces,
    collections,
  } = props;

  return (
    <div
      className="flex flex-col flex-1 overflow-hidden rounded-[28px] border border-zinc-200 shadow-md"
      style={mainPanelThemeStyle}
    >
      <div className="border-b border-zinc-200 px-6 py-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="text-sm font-semibold text-zinc-500">
            {workspace?.name ?? t("app.loading")} / {activeSpaceName}
          </div>
          <div ref={searchWrapRef} className="ml-auto relative flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setCreateCollectionMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2 text-xs font-medium text-white border border-zinc-900"
              >
                <Plus className="h-4 w-4" />
                <span>新增集合</span>
              </button>
              {createCollectionMenuOpen ? (
                <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
                  <button
                    className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-zinc-50"
                    onClick={() => {
                      handleAddCollectionAction("blank");
                      setCreateCollectionMenuOpen(false);
                    }}
                  >
                    空白集合
                  </button>
                  <button
                    className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-zinc-50"
                    onClick={() => {
                      handleAddCollectionAction("current-window");
                      setCreateCollectionMenuOpen(false);
                    }}
                  >
                    從目前開啟分頁建立
                  </button>
                  <button
                    className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-zinc-50"
                    onClick={() => {
                      handleAddCollectionAction("selected-tabs");
                      setCreateCollectionMenuOpen(false);
                    }}
                  >
                    從已選分頁建立
                  </button>
                </div>
              ) : null}
            </div>

            <button
              className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-medium text-zinc-700 border border-zinc-200 hover:bg-zinc-50"
              onClick={() => (allCollectionsCollapsed ? handleExpandAllCollections() : handleCollapseAllCollections())}
              title={allCollectionsCollapsed ? "全部展開" : "全部收起"}
            >
              <span>{allCollectionsCollapsed ? "全部展開" : "全部收起"}</span>
            </button>

            <SelectMenu
              value={sortMode}
              onChange={(value) => setSortMode(value as SortMode)}
              items={[
                { value: "custom", label: "排序：自訂" },
                { value: "recent", label: "排序：最近" },
              ]}
              buttonClassName="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-medium text-zinc-700 border border-zinc-200 hover:bg-zinc-50"
              title="排序"
            />

            <SelectMenu
              value={viewMode}
              onChange={(value) => setViewMode(value as ViewMode)}
              items={[
                { value: "image", label: "圖片" },
                { value: "card", label: "卡片" },
                { value: "compact", label: "精簡" },
                { value: "list", label: "列表" },
              ]}
              buttonClassName="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-xs font-medium text-zinc-700 border border-zinc-200 hover:bg-zinc-50"
              title="檢視"
            />

            <button
              className="flex h-9 w-9 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
              onClick={() => setSearchOpen((prev) => !prev)}
              title={t("app.searchPlaceholder")}
            >
              <Search className="h-4 w-4" />
            </button>

            {searchOpen ? (
              <div className="absolute right-0 top-full z-30 mt-2 w-full">
                <div className="ml-auto w-full">
                  <div className="flex min-w-[260px] items-center gap-2 rounded-2xl bg-zinc-100 px-4 py-2 text-xs text-zinc-500 border border-zinc-100">
                    <Search className="h-4 w-4" />
                    <input
                      ref={searchInputRef}
                      className="w-full bg-transparent text-xs text-zinc-700 outline-none placeholder:text-zinc-400"
                      placeholder={t("app.searchPlaceholder")}
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          setSearchOpen(false);
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <div
        ref={collectionBlankAreaDrop.setNodeRef}
        className={`min-h-0 flex-1 overflow-y-auto px-5 py-5 ${
          collectionBlankAreaDrop.isOver || blankCollectionDropActive ? "bg-rose-50/30" : ""
        }`}
        onDragOver={(event: DragEvent<HTMLDivElement>) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          setBlankCollectionDropActive(true);
        }}
        onDragEnter={() => setBlankCollectionDropActive(true)}
        onDragLeave={(event: DragEvent<HTMLDivElement>) => {
          const related = event.relatedTarget;
          if (related instanceof Node && event.currentTarget.contains(related)) {
            return;
          }
          setBlankCollectionDropActive(false);
        }}
        onDrop={(event: DragEvent<HTMLDivElement>) => {
          if (event.defaultPrevented) {
            return;
          }
          event.preventDefault();
          setBlankCollectionDropActive(false);
          handleDropRawToBlank(event.dataTransfer);
        }}
      >
        <SortableContext items={sortedCollections.map((collection) => collection.id)} strategy={verticalListSortingStrategy}>
          {viewMode === "list" ? (
            <div className="space-y-3">
              {sortedCollections.map((collection) => {
                const list = tabsByCollection.get(collection.id) ?? [];
                return (
                  <div key={collection.id} className="space-y-2">
                    <CollectionRow
                      id={collection.id}
                      name={collection.name}
                      tabCount={tabCountByCollection.get(collection.id) ?? 0}
                      updatedAt={collection.updatedAt}
                      entityMenu={entityMenu}
                      setEntityMenu={setEntityMenu}
                      menuItems={[
                        {
                          label: "編輯集合",
                          icon: Pencil,
                          onClick: () => handleEditCollectionTitle(collection.id, collection.name),
                        },
                        { label: "刪除集合", icon: Trash2, onClick: () => deleteCollection(collection.id) },
                        { label: "邀請好友", icon: UserPlus, onClick: () => handleOpenCollectionInvite(collection.id) },
                      ]}
                      onSelect={() => setSelectedCollectionId(collection.id)}
                    />
                    <div className="space-y-3 pl-4 pr-1">
                      {list.map((tab) => (
                        <TabRow
                          key={tab.id}
                          id={tab.id}
                          title={tab.title}
                          url={tab.url}
                          faviconUrl={tab.faviconUrl ?? undefined}
                          ogTitle={tab.ogTitle ?? null}
                          ogDescription={tab.ogDescription ?? null}
                          ogImage={tab.ogImage ?? null}
                          note={tab.note ?? null}
                          viewMode="list"
                          selected={selectedTabIds.has(tab.id)}
                          onToggleSelect={() => toggleTabSelection(tab.id)}
                          onAddToDock={() => addTabToDock(tab)}
                          onMove={(tabId, workspaceId, spaceId, collectionId) => {
                            void tabId;
                            moveTabToCollection(tab.id, collectionId);
                            void workspaceId;
                            void spaceId;
                          }}
                          workspaces={workspaces}
                          spaces={spaces}
                          collections={collections}
                          currentWorkspaceId={collection.workspaceId}
                          currentSpaceId={collection.spaceId}
                          currentCollectionId={collection.id}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-6">
              {sortedCollections.map((collection, index) => (
                <div key={collection.id} className="space-y-3">
                  <CollectionCard
                    id={collection.id}
                    name={collection.name}
                    tabCount={tabCountByCollection.get(collection.id) ?? 0}
                    onOpenAll={() => openCollectionTabs(collection.id)}
                    onMoveUp={() => moveCollection(collection.id, "up")}
                    onMoveDown={() => moveCollection(collection.id, "down")}
                    canMoveUp={index > 0}
                    canMoveDown={index < sortedCollections.length - 1}
                    onEditTitle={(name) => handleEditCollectionTitle(collection.id, name)}
                    onToggleStar={() => {}}
                    onSortAZ={() => {}}
                    onMove={() => {}}
                    onExport={() => {}}
                    onInvite={() => handleOpenCollectionInvite(collection.id)}
                    onDelete={() => deleteCollection(collection.id)}
                    workspaces={workspaces}
                    spaces={spaces}
                    activeWorkspaceId={collection.workspaceId}
                    spaceId={collection.spaceId}
                    collapsed={collapsedCollections[collection.id] ?? false}
                    onToggleCollapse={() => handleToggleCollectionCollapse(collection.id)}
                    isActive={false}
                    onSelect={() => setSelectedCollectionId(collection.id)}
                  >
                    {/* Keep existing card children rendering inside CollectionCard */}
                  </CollectionCard>
                  <button
                    className="text-xs text-zinc-500 hover:text-zinc-700"
                    onClick={() => handleOpenCollectionSettings(collection.id)}
                  >
                    {locale === "en" ? "Settings" : "設定"}
                  </button>
                </div>
              ))}
            </div>
          )}
          <div
            ref={collectionBlankDrop.setNodeRef}
            className={`mt-4 flex min-h-[72px] items-center justify-center rounded-2xl border border-dashed px-4 py-4 text-xs transition ${
              collectionBlankDrop.isOver || blankCollectionDropActive
                ? "border-rose-300 bg-rose-50 text-rose-600"
                : "border-zinc-300 bg-zinc-50 text-zinc-500"
            }`}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setBlankCollectionDropActive(true);
            }}
            onDragEnter={() => setBlankCollectionDropActive(true)}
            onDragLeave={(event) => {
              const related = event.relatedTarget;
              if (related instanceof Node && event.currentTarget.contains(related)) {
                return;
              }
              setBlankCollectionDropActive(false);
            }}
            onDrop={(event) => {
              event.preventDefault();
              event.stopPropagation();
              setBlankCollectionDropActive(false);
              handleDropRawToBlank(event.dataTransfer);
            }}
          >
            {locale === "en" ? "Drop tab here to quickly create a new collection" : "將分頁拖曳到這裡，快速建立新集合"}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
