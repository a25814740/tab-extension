import { useEffect, useMemo, useState } from "react";
import {
  FolderTree,
  Layers3,
  LayoutGrid,
  Search,
  Inbox,
  Pin,
  Sparkles,
  ChevronRight,
  Globe,
  Clock3,
  PanelRightOpen,
  PanelRightClose,
  Link2,
  ExternalLink,
  CircleDot,
  Plus,
  ChevronsUpDown,
  Grid2X2,
  List,
  ArrowUpDown,
  Building2,
  Check,
  MoreHorizontal,
  Pencil,
  Trash2,
  UserPlus,
  Settings,
  UserCircle2,
  FolderPlus,
  Layers2,
  Columns3,
  X,
} from "lucide-react";

const demoData = {
  organizations: [
    {
      id: "org-eden",
      name: "Eden's organization",
      spaces: [
        {
          id: "space-work",
          name: "工作",
          collections: [
            {
              id: "col-engineering",
              name: "工程師日常",
              updatedAt: "2 小時前",
              tabs: [
                { title: "GitHub Issues", domain: "github.com" },
                { title: "Linear Sprint", domain: "linear.app" },
                { title: "Vercel Deploy", domain: "vercel.com" },
                { title: "API Docs", domain: "docs.company.dev" },
              ],
            },
            {
              id: "col-research",
              name: "產品研究",
              updatedAt: "昨天",
              tabs: [
                { title: "競品首頁", domain: "example.com" },
                { title: "Pricing", domain: "pricing.example.com" },
                { title: "Roadmap", domain: "roadmap.example.com" },
                { title: "Docs", domain: "docs.example.com" },
                { title: "Changelog", domain: "changelog.example.com" },
              ],
            },
            {
              id: "col-deploy",
              name: "部署追蹤",
              updatedAt: "3 天前",
              tabs: [
                { title: "CI Logs", domain: "github.com" },
                { title: "Preview URL", domain: "vercel.com" },
                { title: "Sentry", domain: "sentry.io" },
                { title: "Status Page", domain: "status.example.com" },
              ],
            },
          ],
        },
        {
          id: "space-learning",
          name: "學習",
          collections: [
            {
              id: "col-reading",
              name: "稍後閱讀",
              updatedAt: "今天",
              tabs: [
                { title: "MDN", domain: "developer.mozilla.org" },
                { title: "Chrome Docs", domain: "developer.chrome.com" },
                { title: "設計靈感文章", domain: "medium.com" },
              ],
            },
            {
              id: "col-ai",
              name: "AI 筆記",
              updatedAt: "4 天前",
              tabs: [
                { title: "OpenAI Docs", domain: "platform.openai.com" },
                { title: "Anthropic Docs", domain: "docs.anthropic.com" },
                { title: "Prompt 範例", domain: "notion.so" },
              ],
            },
          ],
        },
        {
          id: "space-private",
          name: "私人",
          collections: [
            {
              id: "col-shopping",
              name: "購物比較",
              updatedAt: "1 週前",
              tabs: [
                { title: "PChome", domain: "pchome.com.tw" },
                { title: "momo", domain: "momo.com.tw" },
                { title: "蝦皮", domain: "shopee.tw" },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "org-agency",
      name: "Side Project Lab",
      spaces: [
        {
          id: "space-growth",
          name: "Growth",
          collections: [
            {
              id: "col-content",
              name: "內容企劃",
              updatedAt: "5 小時前",
              tabs: [
                { title: "Notion 腳本", domain: "notion.so" },
                { title: "Canva", domain: "canva.com" },
                { title: "Threads 草稿", domain: "threads.net" },
                { title: "GA4", domain: "analytics.google.com" },
              ],
            },
            {
              id: "col-campaign",
              name: "活動追蹤",
              updatedAt: "昨天",
              tabs: [
                { title: "Meta Business", domain: "business.facebook.com" },
                { title: "Ads Manager", domain: "facebook.com" },
                { title: "Looker Studio", domain: "lookerstudio.google.com" },
              ],
            },
          ],
        },
        {
          id: "space-design",
          name: "Design",
          collections: [
            {
              id: "col-brand",
              name: "品牌靈感",
              updatedAt: "2 天前",
              tabs: [
                { title: "Behance", domain: "behance.net" },
                { title: "Dribbble", domain: "dribbble.com" },
                { title: "Mobbin", domain: "mobbin.com" },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "org-personal",
      name: "Personal Archive",
      spaces: [
        {
          id: "space-links",
          name: "Links",
          collections: [
            {
              id: "col-favorites",
              name: "最愛網站",
              updatedAt: "剛剛",
              tabs: [
                { title: "YouTube", domain: "youtube.com" },
                { title: "ChatGPT", domain: "chatgpt.com" },
                { title: "Google Maps", domain: "maps.google.com" },
              ],
            },
          ],
        },
      ],
    },
  ],
  openTabs: [
    { id: "tab-1", title: "GitHub Issues · Project Alpha", domain: "github.com", active: true },
    { id: "tab-2", title: "Linear Sprint Board", domain: "linear.app", active: false },
    { id: "tab-3", title: "Vercel Deployments", domain: "vercel.com", active: false },
    { id: "tab-4", title: "API Docs - Internal", domain: "docs.company.dev", active: false },
    { id: "tab-5", title: "ChatGPT · UI 草圖討論", domain: "chatgpt.com", active: false },
    { id: "tab-6", title: "Notion - 產品規劃", domain: "notion.so", active: false },
    { id: "tab-7", title: "Figma - Dock Flow", domain: "figma.com", active: false },
    { id: "tab-8", title: "GA4 Realtime", domain: "analytics.google.com", active: false },
  ],
};

function AppIcon({ item, compact = false }: { item: { label: string; text?: string; icon?: any }; compact?: boolean }) {
  const Icon = item.icon;
  return (
    <button
      className={`group relative flex items-center justify-center rounded-[20px] border border-zinc-200/80 bg-white/90 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:scale-105 hover:shadow-md ${compact ? "h-11 w-11" : "h-14 w-14"}`}
    >
      {Icon ? (
        <Icon className={`${compact ? "h-4 w-4" : "h-5 w-5"} text-zinc-700`} />
      ) : (
        <span className={`${compact ? "text-[11px]" : "text-sm"} font-semibold text-zinc-700`}>{item.text}</span>
      )}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-[9999] mb-3 -translate-x-1/2 whitespace-nowrap rounded-xl bg-zinc-900 px-2.5 py-1 text-[11px] text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
        {item.label}
      </div>
    </button>
  );
}

function EntityMenuButton({
  type,
  id,
  items,
  className = "",
  entityMenu,
  setEntityMenu,
}: {
  type: string;
  id: string;
  items: { label: string; icon: any }[];
  className?: string;
  entityMenu: { type: string; id: string } | null;
  setEntityMenu: (value: { type: string; id: string } | null) => void;
}) {
  const isOpen = entityMenu?.type === type && entityMenu?.id === id;
  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setEntityMenu(isOpen ? null : { type, id });
        }}
        className={`rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-100 ${className}`}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full z-40 mt-2 w-44 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
          {items.map((item) => (
            <button key={item.label} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-zinc-50">
              <item.icon className="h-4 w-4 text-zinc-500" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function CollectionCard({
  collection,
  entityMenu,
  setEntityMenu,
}: {
  collection: any;
  entityMenu: { type: string; id: string } | null;
  setEntityMenu: (value: { type: string; id: string } | null) => void;
}) {
  return (
    <section className="rounded-[24px] border border-zinc-200 bg-zinc-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold">{collection.name}</h2>
          <div className="mt-1 text-xs text-zinc-500">更新於 {collection.updatedAt}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-white px-3 py-1 text-xs text-zinc-500 shadow-sm">{collection.tabs.length} 頁</div>
          <EntityMenuButton
            type="collection"
            id={collection.id}
            entityMenu={entityMenu}
            setEntityMenu={setEntityMenu}
            items={[
              { label: "新增頁籤", icon: Plus },
              { label: "編輯集合", icon: Pencil },
              { label: "刪除集合", icon: Trash2 },
              { label: "邀請好友", icon: UserPlus },
            ]}
          />
        </div>
      </div>
      <div className="mt-4 grid gap-2">
        {collection.tabs.map((tab: any) => (
          <button key={tab.title} className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-left text-sm transition hover:border-zinc-300 hover:shadow-sm">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500">
                <Globe className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="truncate">{tab.title}</div>
                <div className="truncate text-xs text-zinc-500">{tab.domain}</div>
              </div>
            </div>
            <ExternalLink className="ml-3 h-4 w-4 shrink-0 text-zinc-400" />
          </button>
        ))}
      </div>
    </section>
  );
}

function CollectionRow({
  collection,
  entityMenu,
  setEntityMenu,
}: {
  collection: any;
  entityMenu: { type: string; id: string } | null;
  setEntityMenu: (value: { type: string; id: string } | null) => void;
}) {
  return (
    <button className="flex w-full items-center gap-4 rounded-[22px] border border-zinc-200 bg-zinc-50 px-4 py-4 text-left transition hover:bg-zinc-100">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-zinc-500 shadow-sm">
        <FolderTree className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{collection.name}</div>
        <div className="mt-1 truncate text-xs text-zinc-500">{collection.tabs.length} 頁 · 更新於 {collection.updatedAt}</div>
      </div>
      <EntityMenuButton
        type="collection-row"
        id={collection.id}
        entityMenu={entityMenu}
        setEntityMenu={setEntityMenu}
        items={[
          { label: "編輯集合", icon: Pencil },
          { label: "刪除集合", icon: Trash2 },
          { label: "邀請好友", icon: UserPlus },
        ]}
      />
    </button>
  );
}

export default function DockUiSketchV1() {
  const [selectedOrgId, setSelectedOrgId] = useState(demoData.organizations[0].id);
  const [selectedSpaceId, setSelectedSpaceId] = useState(demoData.organizations[0].spaces[0].id);
  const [sortBy, setSortBy] = useState("recent");
  const [viewMode, setViewMode] = useState("grid");
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [createCollectionMenuOpen, setCreateCollectionMenuOpen] = useState(false);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [selectedTabIds, setSelectedTabIds] = useState(["tab-1", "tab-3"]);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [entityMenu, setEntityMenu] = useState<{ type: string; id: string } | null>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOrgMenuOpen(false);
        setCreateCollectionMenuOpen(false);
        setAccountMenuOpen(false);
        setEntityMenu(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const selectedOrg = useMemo(
    () => demoData.organizations.find((org) => org.id === selectedOrgId) ?? demoData.organizations[0],
    [selectedOrgId]
  );

  const selectedSpace = useMemo(
    () => selectedOrg.spaces.find((space) => space.id === selectedSpaceId) ?? selectedOrg.spaces[0],
    [selectedOrg, selectedSpaceId]
  );

  const collections = useMemo(() => {
    const items = [...selectedSpace.collections];
    if (sortBy === "name") items.sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"));
    if (sortBy === "count") items.sort((a, b) => b.tabs.length - a.tabs.length);
    return items;
  }, [selectedSpace, sortBy]);

  const selectedTabs = demoData.openTabs.filter((tab) => selectedTabIds.includes(tab.id));

  const dockPrimary = [
    { label: "首頁", icon: LayoutGrid },
    { label: "組織", icon: Building2 },
    { label: "空間", icon: Layers3 },
    { label: "收件匣", icon: Inbox },
    { label: "搜尋", icon: Search },
    { label: "AI", icon: Sparkles },
  ];

  const dockPinned = [
    { label: "GitHub", text: "GH" },
    { label: "Notion", text: "N" },
    { label: "ChatGPT", text: "AI" },
    { label: "Figma", text: "F" },
    { label: "GA4", text: "GA" },
  ];

  const dockRecent = [
    { label: "最近 GitHub", text: "GH" },
    { label: "最近 Docs", text: "D" },
    { label: "最近 Vercel", text: "V" },
  ];

  const toggleTabSelection = (id: string) => {
    setSelectedTabIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  return (
    <div className="h-[100vh] overflow-x-auto bg-zinc-100 p-4 text-zinc-900">
      <div className="min-h-full min-w-[1280px]">
        <div
          className={`grid h-full gap-4 pb-24 ${
            leftCollapsed
              ? "grid-cols-[84px_minmax(420px,1fr)_360px]"
              : rightCollapsed
                ? "grid-cols-[280px_minmax(420px,1fr)_72px]"
                : "grid-cols-[280px_minmax(420px,1fr)_360px]"
          }`}
        >
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-4 py-4">
              <div className="flex items-center justify-between gap-2">
                {!leftCollapsed && <div className="text-xs font-semibold tracking-wide text-zinc-500">組織</div>}
                <button onClick={() => setLeftCollapsed((v) => !v)} className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100">
                  <Columns3 className="h-4 w-4" />
                </button>
              </div>

              {!leftCollapsed ? (
                <div className="relative mt-3">
                  <button onClick={() => setOrgMenuOpen((v) => !v)} className="flex w-full items-center justify-between rounded-2xl bg-zinc-50 p-4 pr-4 text-left">
                    <div>
                      <div className="text-lg font-semibold">{selectedOrg.name}</div>
                      <div className="mt-1 text-sm text-zinc-500">{selectedOrg.spaces.length} 個空間</div>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 text-zinc-500" />
                  </button>

                  <div className="absolute right-2 top-[85%] z-10 flex -translate-y-1/2 items-center gap-1 [bottom:auto]">
                    <button className="rounded-xl p-2 text-zinc-500 transition hover:bg-white">
                      <Plus className="h-4 w-4" />
                    </button>
                    <button className="rounded-xl p-2 text-zinc-500 transition hover:bg-white">
                      <Settings className="h-4 w-4" />
                    </button>
                    <button className="rounded-xl p-2 text-zinc-500 transition hover:bg-white">
                      <UserPlus className="h-4 w-4" />
                    </button>
                  </div>

                  {orgMenuOpen && (
                    <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
                      {demoData.organizations.map((org) => (
                        <button
                          key={org.id}
                          onClick={() => {
                            setSelectedOrgId(org.id);
                            setSelectedSpaceId(org.spaces[0].id);
                            setOrgMenuOpen(false);
                          }}
                          className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-zinc-50"
                        >
                          <div>
                            <div className="font-medium">{org.name}</div>
                            <div className="text-xs text-zinc-500">{org.spaces.length} 個空間</div>
                          </div>
                          {selectedOrgId === org.id && <Check className="h-4 w-4 text-zinc-700" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-3 flex justify-center">
                  <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                    <Building2 className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {!leftCollapsed && (
              <div className="flex items-center justify-between px-5 pt-4">
                <div className="text-sm font-semibold text-zinc-600">空間</div>
                <div className="flex items-center gap-1">
                  <button className="rounded-xl bg-zinc-100 px-3 py-1.5 text-xs text-zinc-500">新增空間</button>
                  <EntityMenuButton
                    type="space-global"
                    id={selectedOrg.id}
                    entityMenu={entityMenu}
                    setEntityMenu={setEntityMenu}
                    items={[
                      { label: "新增空間", icon: Layers2 },
                      { label: "編輯目前空間", icon: Pencil },
                      { label: "刪除目前空間", icon: Trash2 },
                      { label: "邀請好友", icon: UserPlus },
                    ]}
                  />
                </div>
              </div>
            )}

            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-3">
              <div className="space-y-2">
                {selectedOrg.spaces.map((space) => (
                  <div key={space.id} className={`group flex items-center gap-2 rounded-2xl ${space.id === selectedSpace.id ? "bg-zinc-900" : "bg-zinc-50 hover:bg-zinc-100"}`}>
                    <button
                      onClick={() => setSelectedSpaceId(space.id)}
                      className={`flex min-w-0 flex-1 items-center justify-between px-4 py-3 text-left ${space.id === selectedSpace.id ? "text-white" : "text-zinc-700"}`}
                    >
                      <span className={`text-sm font-medium ${leftCollapsed ? "mx-auto" : ""}`}>{leftCollapsed ? space.name.slice(0, 1) : space.name}</span>
                      {!leftCollapsed && (
                        <span className={`rounded-full px-2 py-0.5 text-xs ${space.id === selectedSpace.id ? "bg-white/15 text-white" : "bg-white text-zinc-500"}`}>
                          {space.collections.length}
                        </span>
                      )}
                    </button>
                    {!leftCollapsed && (
                      <div className="pr-2 opacity-0 transition group-hover:opacity-100">
                        <EntityMenuButton
                          type="space"
                          id={space.id}
                          entityMenu={entityMenu}
                          setEntityMenu={setEntityMenu}
                          items={[
                            { label: "新增集合", icon: FolderPlus },
                            { label: "編輯空間", icon: Pencil },
                            { label: "刪除空間", icon: Trash2 },
                            { label: "邀請好友", icon: UserPlus },
                          ]}
                          className={space.id === selectedSpace.id ? "text-white hover:bg-white/10" : ""}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {!leftCollapsed && (
                <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">拖曳頁籤到空白處，快速建立新集合</div>
              )}
            </div>

            <div className="border-t border-zinc-200 p-3">
              <div className="relative">
                <button onClick={() => setAccountMenuOpen((v) => !v)} className="flex w-full items-center gap-3 rounded-2xl bg-zinc-50 px-3 py-3 text-left hover:bg-zinc-100">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                    <UserCircle2 className="h-5 w-5" />
                  </div>
                  {!leftCollapsed && (
                    <>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold">Luo Shih Lin</div>
                        <div className="truncate text-xs text-zinc-500">Pro Plan</div>
                      </div>
                      <Settings className="h-4 w-4 text-zinc-500" />
                    </>
                  )}
                </button>
                {accountMenuOpen && !leftCollapsed && (
                  <div className="absolute bottom-full left-0 right-0 z-40 mb-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
                    <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-zinc-50"><Settings className="h-4 w-4 text-zinc-500" />帳號設定</button>
                    <button className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-zinc-50"><UserPlus className="h-4 w-4 text-zinc-500" />邀請好友</button>
                  </div>
                )}
              </div>
            </div>
          </aside>

          <main className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-6 py-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-sm font-semibold text-zinc-500">{selectedOrg.name} / {selectedSpace.name}</div>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <button onClick={() => setCreateCollectionMenuOpen((v) => !v)} className="flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white">
                      <Plus className="h-4 w-4" />
                      <span>新增集合</span>
                    </button>
                    {createCollectionMenuOpen && (
                      <div className="absolute left-0 top-full z-20 mt-2 w-56 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
                        <button className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-zinc-50">空白集合</button>
                        <button className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-zinc-50">從目前開啟分頁建立</button>
                        <button className="block w-full rounded-xl px-3 py-2 text-left text-sm hover:bg-zinc-50">從拖放內容建立</button>
                      </div>
                    )}
                  </div>

                  <button onClick={() => setSortBy((v) => (v === "recent" ? "name" : v === "name" ? "count" : "recent"))} className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-700">
                    <ArrowUpDown className="h-4 w-4" />
                    <span>{sortBy === "recent" ? "排序：最近" : sortBy === "name" ? "排序：名稱" : "排序：頁數"}</span>
                  </button>

                  <div className="flex items-center rounded-2xl border border-zinc-200 bg-white p-1">
                    <button onClick={() => setViewMode("grid")} className={`rounded-xl p-2 ${viewMode === "grid" ? "bg-zinc-900 text-white" : "text-zinc-500"}`}>
                      <Grid2X2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => setViewMode("list")} className={`rounded-xl p-2 ${viewMode === "list" ? "bg-zinc-900 text-white" : "text-zinc-500"}`}>
                      <List className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex min-w-[260px] items-center gap-2 rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-500">
                    <Search className="h-4 w-4" />
                    <span>搜尋集合、頁籤、網址...</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {viewMode === "grid" ? (
                <div className="grid gap-4 xl:grid-cols-2">
                  {collections.map((collection) => (
                    <CollectionCard key={collection.id} collection={collection} entityMenu={entityMenu} setEntityMenu={setEntityMenu} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {collections.map((collection) => (
                    <CollectionRow key={collection.id} collection={collection} entityMenu={entityMenu} setEntityMenu={setEntityMenu} />
                  ))}
                </div>
              )}
            </div>
          </main>

          <section className={`flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm ${rightCollapsed ? "w-[72px]" : "w-auto"}`}>
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-5">
              {!rightCollapsed && (
                <div>
                  <div className="text-sm font-semibold text-zinc-500">目前瀏覽器</div>
                  <h2 className="mt-1 text-2xl font-bold">開啟分頁</h2>
                </div>
              )}
              <button onClick={() => setRightCollapsed((v) => !v)} className="rounded-2xl bg-zinc-100 p-2 text-zinc-500">
                {rightCollapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
              </button>
            </div>

            {!rightCollapsed ? (
              <>
                <div className="border-b border-zinc-200 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white">已選 {selectedTabIds.length}</div>
                    <button className="rounded-xl bg-zinc-100 px-3 py-2 text-xs text-zinc-600">加入集合</button>
                    <button className="rounded-xl bg-zinc-100 px-3 py-2 text-xs text-zinc-600">加入 Dock</button>
                    <button className="rounded-xl bg-zinc-100 px-3 py-2 text-xs text-zinc-600">移到空間</button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                  <div className="space-y-2">
                    {demoData.openTabs.map((tab) => {
                      const selected = selectedTabIds.includes(tab.id);
                      return (
                        <button key={tab.id} onClick={() => toggleTabSelection(tab.id)} className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition ${tab.active ? "border-zinc-900 bg-zinc-900 text-white" : selected ? "border-zinc-400 bg-zinc-100" : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"}`}>
                          <div className="pt-1">
                            <div className={`flex h-4 w-4 items-center justify-center rounded border ${selected ? "border-zinc-900 bg-zinc-900 text-white" : tab.active ? "border-white/40 bg-white/10 text-white" : "border-zinc-300 bg-white text-transparent"}`}>
                              <Check className="h-3 w-3" />
                            </div>
                          </div>
                          <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tab.active ? "bg-white/10" : "bg-white"}`}>
                            <Link2 className={`h-4 w-4 ${tab.active ? "text-white" : "text-zinc-500"}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              {tab.active && <CircleDot className="h-3.5 w-3.5 shrink-0 text-emerald-400" />}
                              <div className="truncate text-sm font-medium">{tab.title}</div>
                            </div>
                            <div className={`mt-1 truncate text-xs ${tab.active ? "text-zinc-300" : "text-zinc-500"}`}>{tab.domain}</div>
                          </div>
                          <ChevronRight className={`mt-1 h-4 w-4 shrink-0 ${tab.active ? "text-zinc-300" : "text-zinc-400"}`} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto px-2 py-4">
                {demoData.openTabs.slice(0, 8).map((tab) => (
                  <button key={tab.id} onClick={() => toggleTabSelection(tab.id)} className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ${selectedTabIds.includes(tab.id) ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"}`}>
                    <Link2 className="h-4 w-4" />
                    {tab.active && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white" />}
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>

        {selectedTabIds.length > 0 && !rightCollapsed && (
          <div className="fixed bottom-28 right-8 z-[998] rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between gap-4 text-sm font-semibold">
              <span>拖放示意：已選 {selectedTabs.length} 個頁籤</span>
              <button className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2 text-xs text-zinc-500">
              <span className="rounded-full bg-zinc-100 px-3 py-1.5">拖到集合</span>
              <span className="rounded-full bg-zinc-100 px-3 py-1.5">拖到 Dock</span>
              <span className="rounded-full bg-zinc-100 px-3 py-1.5">拖到空間</span>
            </div>
          </div>
        )}

        <div className="fixed inset-x-0 bottom-4 z-[999] px-4">
          <div className="mx-auto flex max-w-5xl items-end gap-4 overflow-visible rounded-[30px] border border-zinc-200 bg-white/85 px-5 py-4 shadow-2xl backdrop-blur-xl">
            <div className="flex items-end gap-4 overflow-visible">
              {dockPrimary.map((item) => (
                <AppIcon key={item.label} item={item} />
              ))}
            </div>
            <div className="h-12 w-px shrink-0 bg-zinc-200" />
            <div className="flex items-end gap-4 overflow-visible">
              {dockPinned.map((item) => (
                <AppIcon key={item.label} item={item} />
              ))}
            </div>
            <div className="h-12 w-px shrink-0 bg-zinc-200" />
            <div className="flex items-end gap-4 overflow-visible">
              {dockRecent.map((item) => (
                <AppIcon key={item.label} item={item} compact />
              ))}
            </div>
            <div className="h-12 w-px shrink-0 bg-zinc-200" />
            <div className="flex items-end gap-4 overflow-visible">
              <AppIcon item={{ label: "暫放", icon: Pin }} />
              <AppIcon item={{ label: "最近使用", icon: Clock3 }} compact />
              <AppIcon item={{ label: "帳號設定", icon: Settings }} compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
