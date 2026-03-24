import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent, type ReactNode } from "react";
import { getAllWindowsWithTabs, openTabs, focusTab, closeTabs, getLocal, setLocal } from "@toby/chrome-adapters";
import { useAppStore, useLocalCacheSync } from "../store/appStore";
import { CollectionCard } from "./CollectionCard";
import { CollectionRow } from "./CollectionRow";
import { TabRow } from "./TabRow";
import { createRuleBasedProvider } from "@toby/ai";
import { AuthMiniPanel } from "./AuthPanel";
import { PricingModal } from "./PricingModal";
import {
  createSupabaseClient,
  updateMemberRole,
  removeMember,
  createShareLink,
  revokeShareLink,
  acceptShareLink,
  fetchWorkspaceSnapshot,
  type WorkspaceSnapshotResult,
} from "@toby/api-client";
import { appStore } from "../store/appStore";
import { useLocale } from "../i18n";
import { localSnapshotSchema, toSnapshot, type LocalStoreSnapshot, type MembershipStatus } from "@toby/core";
import { DEFAULT_SUPABASE_ANON_KEY, DEFAULT_SUPABASE_URL, useAuthLogic, useAuthUser } from "../auth/useAuth";
import { toSafeFaviconUrl } from "../utils/favicon";
import { SelectMenu } from "./SelectMenu";
import { manualDriveSync, startupDriveSync } from "../sync/driveSync";
import { DockIconButton } from "./DockIconButton";
import { EntityMenuButton } from "./EntityMenuButton";
import {
  ArrowUpDown,
  Building2,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  ChevronsUpDown,
  CircleDot,
  Clock3,
  Columns3,
  FolderPlus,
  Grid2X2,
  Inbox,
  LayoutGrid,
  Layers2,
  Layers3,
  Link2,
  List,
  PanelRightClose,
  PanelRightOpen,
  Pin,
  Plus,
  Search,
  Settings,
  Sparkles,
  Trash2,
  X,
  UserPlus,
  Pencil,
} from "lucide-react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

type MemberRole = "owner" | "admin" | "editor" | "commenter" | "viewer";
type AddCollectionAction = "blank" | "current-window" | "selected-tabs";
type DockEntry = {
  id: string;
  label: string;
  icon?: ReactNode;
  text?: string;
  url?: string;
  onClick: () => void;
  faviconUrl?: string | null;
  onRemove?: () => void;
};
type DockSection = {
  id: string;
  label: string;
  items: DockEntry[];
};

export function App() {
  useLocalCacheSync();
  const toWindowTab = (tab: {
    id: number;
    title: string;
    url: string;
    favIconUrl?: string;
    active?: boolean;
  }) => {
    const item: { id: number; title: string; url: string; favIconUrl?: string; active: boolean } = {
      id: tab.id,
      title: tab.title,
      url: tab.url,
      active: tab.active ?? false,
    };
    const safeFaviconUrl = toSafeFaviconUrl(tab.url, typeof tab.favIconUrl === "string" ? tab.favIconUrl : null);
    if (safeFaviconUrl) {
      item.favIconUrl = safeFaviconUrl;
    }
    return item;
  };

  useEffect(() => {
    void startupDriveSync();
  }, []);
  const { t, locale } = useLocale();
  const [membershipStatus, setMembershipStatus] = useState<MembershipStatus | null>(null);
  const [upgradeNotice, setUpgradeNotice] = useState("");
  const [uiNotice, setUiNotice] = useState("");
  const authUser = useAuthUser();
  const { handleGoogle, status, config } = useAuthLogic();
  const workspaceState = useAppStore((state) => state.workspace);
  const workspaces = useAppStore((state) => state.workspaces);
  const collections = useAppStore((state) => state.collections);
  const spaces = useAppStore((state) => state.spaces);
  const folders = useAppStore((state) => state.folders);
  const addWorkspace = useAppStore((state) => state.addWorkspace);
  const updateWorkspace = useAppStore((state) => state.updateWorkspace);
  const upsertWorkspace = useAppStore((state) => state.upsertWorkspace);
  const deleteWorkspace = useAppStore((state) => state.deleteWorkspace);
  const addSpace = useAppStore((state) => state.addSpace);
  const updateSpace = useAppStore((state) => state.updateSpace);
  const deleteSpace = useAppStore((state) => state.deleteSpace);
  const addCollection = useAppStore((state) => state.addCollection);
  const setSelectedWorkspaceId = useAppStore((state) => state.setSelectedWorkspaceId);
  const setSelectedSpaceId = useAppStore((state) => state.setSelectedSpaceId);
  const setSelectedCollectionId = useAppStore((state) => state.setSelectedCollectionId);
  const updateCollectionTitle = useAppStore((state) => state.updateCollectionTitle);
  const toggleCollectionStar = useAppStore((state) => state.toggleCollectionStar);
  const moveCollectionWithinSpace = useAppStore((state) => state.moveCollectionWithinSpace);
  const moveCollectionToSpace = useAppStore((state) => state.moveCollectionToSpace);
  const sortTabsInCollection = useAppStore((state) => state.sortTabsInCollection);
  const deleteCollection = useAppStore((state) => state.deleteCollection);
  const updateTab = useAppStore((state) => state.updateTab);
  const deleteTab = useAppStore((state) => state.deleteTab);
  const moveTabToCollection = useAppStore((state) => state.moveTabToCollection);
  const addTabToCollection = useAppStore((state) => state.addTabToCollection);
  const saveCollectionFromTabsInSpace = useAppStore((state) => state.saveCollectionFromTabsInSpace);
  const addDockItems = useAppStore((state) => state.addDockItems);
  const removeDockItem = useAppStore((state) => state.removeDockItem);
  const viewMode = useAppStore((state) => state.cache.ui.viewMode);
  const sortMode = useAppStore((state) => state.cache.ui.sortMode);
  const dockPinnedItems = useAppStore((state) => state.cache.dock.pinned);
  const setViewMode = useAppStore((state) => state.setViewMode);
  const setSortMode = useAppStore((state) => state.setSortMode);
  const reorderSpaces = useAppStore((state) => state.reorderSpaces);
  const reorderCollections = useAppStore((state) => state.reorderCollections);
  const reorderCollectionsWithIndex = useAppStore((state) => state.reorderCollectionsWithIndex);
  const reorderFolders = useAppStore((state) => state.reorderFolders);
  const reorderTabs = useAppStore((state) => state.reorderTabs);
  const reorderTabsWithIndex = useAppStore((state) => state.reorderTabsWithIndex);
  const selectedSpaceId = useAppStore((state) => state.cache.selectedSpaceId);
  const selectedWorkspaceId = useAppStore((state) => state.cache.selectedWorkspaceId);
  const tabs = useAppStore((state) => state.tabs);
  const selectedCollectionId = useAppStore((state) => state.cache.selectedCollectionId ?? null);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTabIds, setSelectedTabIds] = useState<Set<string>>(new Set());
  const [selectedWindowTabIds, setSelectedWindowTabIds] = useState<Set<number>>(new Set());
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<Set<string>>(new Set());
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [bulkMoveWorkspaceId, setBulkMoveWorkspaceId] = useState("");
  const [bulkMoveSpaceId, setBulkMoveSpaceId] = useState("");
  const [windowMoveOpen, setWindowMoveOpen] = useState(false);
  const [windowMoveWorkspaceId, setWindowMoveWorkspaceId] = useState("");
  const [windowMoveSpaceId, setWindowMoveSpaceId] = useState("");
  const [windowMoveName, setWindowMoveName] = useState("");
  const [tabMoveOpen, setTabMoveOpen] = useState(false);
  const [tabMoveWorkspaceId, setTabMoveWorkspaceId] = useState("");
  const [tabMoveSpaceId, setTabMoveSpaceId] = useState("");
  const [tabMoveCollectionId, setTabMoveCollectionId] = useState("");
  const [dedupeOpen, setDedupeOpen] = useState(false);
  const [dedupeKeepIds, setDedupeKeepIds] = useState<Set<string>>(new Set());
  const [dedupeQuery, setDedupeQuery] = useState("");
  const [dragOverCollectionId, setDragOverCollectionId] = useState<string | null>(null);
  const [dockDropActive, setDockDropActive] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [pricingOpen, setPricingOpen] = useState(false);
  const [moveNotice, setMoveNotice] = useState<{
    message: string;
    workspaceId: string;
    spaceId: string;
    collectionId: string;
  } | null>(null);
  const [collapsedCollections, setCollapsedCollections] = useState<Record<string, boolean>>({});
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const [createCollectionMenuOpen, setCreateCollectionMenuOpen] = useState(false);
  const [entityMenu, setEntityMenu] = useState<{ type: string; id: string } | null>(null);
  const saveCollectionFromTabs = useAppStore((state) => state.saveCollectionFromTabs);
  const [windowGroups, setWindowGroups] = useState<
    Array<{
      id: number;
      title: string;
      tabs: Array<{ id: number; title: string; url: string; favIconUrl?: string; active: boolean }>;
    }>
  >([]);
  const [orgSettingsOpen, setOrgSettingsOpen] = useState(false);
  const [orgSettingsTab, setOrgSettingsTab] = useState<"preferences" | "members">("preferences");
  const [orgNameDraft, setOrgNameDraft] = useState("");
  const [orgLogoDraft, setOrgLogoDraft] = useState<string | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState("");
  const [memberSearch, setMemberSearch] = useState("");
  const [memberName, setMemberName] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState<MemberRole>("viewer");
  const [members, setMembers] = useState<
    Array<{
      id: string;
      userId: string;
      name: string;
      email: string;
      role: MemberRole;
    }>
  >([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberStatus, setMemberStatus] = useState("");
  const [orgStatus, setOrgStatus] = useState("");
  const [linkAccess, setLinkAccess] = useState<"restricted" | "link">("restricted");
  const [linkRole, setLinkRole] = useState<"view" | "edit">("view");
  const [linkId, setLinkId] = useState("");
  const [linkToken, setLinkToken] = useState("");
  const [linkStatus, setLinkStatus] = useState("");
  const [shareNotice, setShareNotice] = useState("");
  const [collectionInviteOpen, setCollectionInviteOpen] = useState(false);
  const [collectionInviteId, setCollectionInviteId] = useState("");
  const [collectionInviteLink, setCollectionInviteLink] = useState("");
  const [collectionInviteStatus, setCollectionInviteStatus] = useState("");
  const importFileRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const checkboxClass =
    "h-4 w-4 rounded border-zinc-300 bg-white text-zinc-900 focus:ring-zinc-300/40";
  const pulledWorkspacesRef = useRef<Set<string>>(new Set());
  const AUTH_USER_KEY = "toby_auth_user_v1";
  const DOCK_COLLAPSED_KEY = "toby_dock_collapsed_v1";

  const workspace = useMemo(() => {
    if (selectedWorkspaceId) {
      return workspaces.find((item) => item.id === selectedWorkspaceId) ?? workspaceState ?? null;
    }
    return workspaceState ?? workspaces[0] ?? null;
  }, [selectedWorkspaceId, workspaceState, workspaces]);
  const activeWorkspaceId = selectedWorkspaceId ?? workspace?.id ?? null;
  const effectiveSupabaseUrl = config?.supabaseUrl?.trim() || DEFAULT_SUPABASE_URL;
  const effectiveSupabaseAnonKey = config?.supabaseAnonKey?.trim() || DEFAULT_SUPABASE_ANON_KEY;
  if (typeof window !== "undefined") {
    (window as typeof window & {
      __tobySupabaseDebug?: {
        url: string;
        anonKeyPresent: boolean;
        configUrl?: string;
        configKeyPresent?: boolean;
        selectedWorkspaceId?: string | null;
        workspaceId?: string | null;
      };
    }).__tobySupabaseDebug = {
      url: effectiveSupabaseUrl,
      anonKeyPresent: Boolean(effectiveSupabaseAnonKey),
      configUrl: config?.supabaseUrl,
      configKeyPresent: Boolean(config?.supabaseAnonKey),
      selectedWorkspaceId,
      workspaceId: workspace?.id ?? null,
    };
  }
  const supabaseClient = useMemo(() => {
    if (!effectiveSupabaseUrl || !effectiveSupabaseAnonKey) {
      return null;
    }
    // Supabase types are intentionally untyped here to keep the UI demo buildable without schema bindings.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createSupabaseClient({ url: effectiveSupabaseUrl, anonKey: effectiveSupabaseAnonKey }) as any;
  }, [effectiveSupabaseAnonKey, effectiveSupabaseUrl]);
  useEffect(() => {
    if (authUser || !supabaseClient) {
      return;
    }
    let cancelled = false;
    void (async () => {
      const userResult = await supabaseClient.auth.getUser();
      const user = userResult.data.user;
      if (cancelled || !user?.id || !user.email) {
        return;
      }
      const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
      await setLocal(AUTH_USER_KEY, {
        id: user.id,
        email: user.email,
        name:
          (meta.full_name as string | undefined) ??
          (meta.name as string | undefined) ??
          user.email.split("@")[0],
        avatarUrl: (meta.avatar_url as string | undefined) ?? null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [AUTH_USER_KEY, authUser, supabaseClient]);

  useEffect(() => {
    let active = true;
    void (async () => {
      const stored = await getLocal<boolean>(DOCK_COLLAPSED_KEY, false);
      if (active) {
        setDockCollapsed(stored);
      }
    })();
    return () => {
      active = false;
    };
  }, [DOCK_COLLAPSED_KEY]);

  useEffect(() => {
    void setLocal(DOCK_COLLAPSED_KEY, dockCollapsed);
  }, [DOCK_COLLAPSED_KEY, dockCollapsed]);

  const resolveAccessToken = useCallback(async () => {
    if (!supabaseClient) {
      return null;
    }
    try {
      const sessionResult = await supabaseClient.auth.getSession();
      let accessToken = sessionResult.data.session?.access_token ?? null;
      if (!accessToken && sessionResult.data.session) {
        const refreshed = await supabaseClient.auth.refreshSession();
        accessToken = refreshed.data.session?.access_token ?? null;
      }
      return accessToken;
    } catch {
      return null;
    }
  }, [supabaseClient]);

  type RemoteSnapshot = WorkspaceSnapshotResult;

  const applyRemoteSnapshot = useCallback((snapshot: RemoteSnapshot) => {
    if (!snapshot.workspace) {
      return;
    }
    const workspaceId = snapshot.workspace.id;
    const current = toSnapshot(appStore.getState());
    const currentWorkspaces = current.workspaces ?? [];
    const remoteSpaces = snapshot.spaces ?? [];
    const remoteFolders = snapshot.folders ?? [];
    const remoteCollections = snapshot.collections ?? [];
    const remoteTabs = snapshot.tabs ?? [];
    const remoteCollectionIds = new Set(remoteCollections.map((item: { id: string }) => item.id));

    const nextWorkspaces = currentWorkspaces.some((item) => item.id === workspaceId)
      ? currentWorkspaces.map((item) => (item.id === workspaceId ? { ...item, ...snapshot.workspace } : item))
      : [...currentWorkspaces, snapshot.workspace];

    const nextWorkspace =
      current.workspace?.id === workspaceId
        ? { ...current.workspace, ...snapshot.workspace }
        : current.cache.selectedWorkspaceId === workspaceId
          ? snapshot.workspace
          : current.workspace;

    const nextSnapshot: LocalStoreSnapshot = {
      ...current,
      workspaces: nextWorkspaces,
      workspace: nextWorkspace ?? current.workspace ?? snapshot.workspace,
      spaces: [...current.spaces.filter((item) => item.workspaceId !== workspaceId), ...remoteSpaces],
      folders: [...current.folders.filter((item) => item.workspaceId !== workspaceId), ...remoteFolders],
      collections: [
        ...current.collections.filter((item) => item.workspaceId !== workspaceId),
        ...remoteCollections,
      ],
      tabs: [...current.tabs.filter((item) => !remoteCollectionIds.has(item.collectionId)), ...remoteTabs],
    };

    appStore.getState().hydrate(nextSnapshot);
  }, []);
  const SHARE_TOKEN_KEY = "toby_pending_share_token_v1";
  const MEMBERSHIP_KEY = "toby_membership_v1";
  const scopedSpaces = useMemo(
    () => (activeWorkspaceId ? spaces.filter((space) => space.workspaceId === activeWorkspaceId) : []),
    [activeWorkspaceId, spaces]
  );
  const activeSpaceId = selectedSpaceId ?? scopedSpaces[0]?.id ?? null;
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
    let isMounted = true;
    const load = async () => {
      const membership = await getLocal<{ status: MembershipStatus } | null>(MEMBERSHIP_KEY, null);
      if (isMounted) {
        setMembershipStatus(membership?.status ?? null);
      }
    };
    void load();
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== "local" || !changes[MEMBERSHIP_KEY]) {
        return;
      }
      const next = changes[MEMBERSHIP_KEY].newValue as { status?: MembershipStatus } | null;
      setMembershipStatus(next?.status ?? null);
    };
    if (chrome?.storage?.onChanged) {
      chrome.storage.onChanged.addListener(onChanged);
    }
    return () => {
      isMounted = false;
      if (chrome?.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(onChanged);
      }
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOrgMenuOpen(false);
        setEntityMenu(null);
        setCreateCollectionMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    if (!workspaces.length) {
      return;
    }
    const workspaceScores = workspaces.map((item) => {
      const collectionsCount = collections.filter((collection) => collection.workspaceId === item.id).length;
      const spacesCount = spaces.filter((space) => space.workspaceId === item.id).length;
      return { id: item.id, score: collectionsCount * 1000 + spacesCount, collectionsCount, spacesCount };
    });
    const hasData = (id: string) =>
      collections.some((collection) => collection.workspaceId === id) ||
      spaces.some((space) => space.workspaceId === id);
    const currentId = selectedWorkspaceId ?? workspace?.id ?? null;
    if (currentId && hasData(currentId)) {
      return;
    }
    const best = workspaceScores.sort((a, b) => b.score - a.score)[0];
    if (!best || best.score === 0) {
      return;
    }
    if (best.id !== currentId) {
      setSelectedWorkspaceId(best.id);
      const firstSpace = spaces.find((space) => space.workspaceId === best.id) ?? null;
      setSelectedSpaceId(firstSpace?.id ?? null);
      const firstCollection =
        firstSpace
          ? collections.find(
              (collection) => collection.workspaceId === best.id && collection.spaceId === firstSpace.id
            ) ?? null
          : null;
      setSelectedCollectionId(firstCollection?.id ?? null);
    }
  }, [
    collections,
    selectedWorkspaceId,
    setSelectedCollectionId,
    setSelectedSpaceId,
    setSelectedWorkspaceId,
    spaces,
    workspace?.id,
    workspaces,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token") ?? url.searchParams.get("share");
    if (!token) {
      return;
    }
    void setLocal(SHARE_TOKEN_KEY, token);
    url.searchParams.delete("token");
    url.searchParams.delete("share");
    window.history.replaceState({}, "", url.toString());
    setShareNotice(t("share.notice.detected"));
  }, [t]);

  useEffect(() => {
    let isMounted = true;
    if (!supabaseClient) {
      return () => {
        isMounted = false;
      };
    }
    void (async () => {
      const token = await getLocal<string | null>(SHARE_TOKEN_KEY, null);
      if (!token) {
        return;
      }
      if (!authUser?.id) {
        if (isMounted) {
          setShareNotice(t("share.notice.loginRequired"));
        }
        return;
      }
      if (isMounted) {
        setShareNotice(t("share.notice.accepting"));
      }
        const accessToken = await resolveAccessToken();
        if (!accessToken) {
          if (isMounted) {
            setShareNotice(t("share.notice.loginRequired"));
          }
          return;
        }
        const result = await acceptShareLink(supabaseClient, token, {
          accessToken,
          anonKey: effectiveSupabaseAnonKey,
        });
      if (!isMounted) {
        return;
      }
      if (result.error) {
        setShareNotice(`${t("share.notice.failed")}: ${result.error.message ?? result.error}`);
        return;
      }
      const workspaceId = result.data?.workspace?.id ?? null;
      const workspaceName = result.data?.workspace?.name ?? (locale === "en" ? "New workspace" : "新組織");
      const workspaceOwnerId = result.data?.workspace?.ownerId ?? null;
      if (workspaceId) {
        upsertWorkspace({ id: workspaceId, name: workspaceName, ownerId: workspaceOwnerId });
        setSelectedWorkspaceId(workspaceId);
        const firstSpace = spaces.find((space) => space.workspaceId === workspaceId) ?? null;
        setSelectedSpaceId(firstSpace?.id ?? null);
        const firstCollection =
          firstSpace
            ? collections.find((collection) => collection.workspaceId === workspaceId && collection.spaceId === firstSpace.id) ?? null
            : null;
        setSelectedCollectionId(firstCollection?.id ?? null);
      }
        if (workspaceId) {
          const snapshotRes = await fetchWorkspaceSnapshot(supabaseClient, workspaceId, {
            accessToken,
            anonKey: effectiveSupabaseAnonKey,
          });
          if (!snapshotRes.error && snapshotRes.data?.ok) {
            applyRemoteSnapshot(snapshotRes.data);
          }
        }
        await setLocal(SHARE_TOKEN_KEY, null);
        setShareNotice(t("share.notice.joined"));
    })();

    return () => {
      isMounted = false;
    };
  }, [
    authUser?.id,
    collections,
    locale,
    setSelectedCollectionId,
    setSelectedSpaceId,
    setSelectedWorkspaceId,
    spaces,
    supabaseClient,
    t,
    upsertWorkspace,
  ]);

  useEffect(() => {
    if (!supabaseClient || !authUser?.id || !activeWorkspaceId) {
      return;
    }
    const hasData = scopedSpaces.length > 0 || scopedCollections.length > 0 || scopedTabs.length > 0;
    if (hasData || pulledWorkspacesRef.current.has(activeWorkspaceId)) {
      return;
    }
    pulledWorkspacesRef.current.add(activeWorkspaceId);
    void (async () => {
      const accessToken = await resolveAccessToken();
      if (!accessToken) {
        return;
      }
      const snapshotRes = await fetchWorkspaceSnapshot(supabaseClient, activeWorkspaceId, {
        accessToken,
        anonKey: effectiveSupabaseAnonKey,
      });
      if (!snapshotRes.error && snapshotRes.data?.ok) {
        applyRemoteSnapshot(snapshotRes.data);
      }
    })();
  }, [
    activeWorkspaceId,
    applyRemoteSnapshot,
    authUser?.id,
    effectiveSupabaseAnonKey,
    resolveAccessToken,
    scopedCollections.length,
    scopedSpaces.length,
    scopedTabs.length,
    supabaseClient,
  ]);

  const bulkMoveSpaces = useMemo(
    () => spaces.filter((space) => space.workspaceId === bulkMoveWorkspaceId),
    [spaces, bulkMoveWorkspaceId]
  );
  const windowMoveSpaces = useMemo(
    () => spaces.filter((space) => space.workspaceId === windowMoveWorkspaceId),
    [spaces, windowMoveWorkspaceId]
  );

  const tabMoveSpaces = useMemo(
    () => spaces.filter((space) => space.workspaceId === tabMoveWorkspaceId),
    [spaces, tabMoveWorkspaceId]
  );
  const tabMoveCollections = useMemo(
    () => collections.filter((collection) => collection.spaceId === tabMoveSpaceId),
    [collections, tabMoveSpaceId]
  );

  const tabCountByCollection = useMemo(() => {
    const map = new Map<string, number>();
    scopedTabs.forEach((tab) => {
      map.set(tab.collectionId, (map.get(tab.collectionId) ?? 0) + 1);
    });
    return map;
  }, [scopedTabs]);

  const collectionCountBySpace = useMemo(() => {
    const map = new Map<string, number>();
    scopedCollections.forEach((collection) => {
      map.set(collection.spaceId, (map.get(collection.spaceId) ?? 0) + 1);
    });
    return map;
  }, [scopedCollections]);

  const orderBySpace = useMemo(() => {
    const map = new Map<string, string[]>();
    scopedCollections
      .slice()
      .sort((a, b) => a.position - b.position)
      .forEach((collection) => {
        const list = map.get(collection.spaceId) ?? [];
        list.push(collection.id);
        map.set(collection.spaceId, list);
      });
    return map;
  }, [scopedCollections]);

  const collectionById = useMemo(() => {
    const map = new Map<string, { id: string; name: string; spaceId: string; workspaceId: string }>();
    scopedCollections.forEach((collection) => {
      map.set(collection.id, {
        id: collection.id,
        name: collection.name,
        spaceId: collection.spaceId,
        workspaceId: collection.workspaceId,
      });
    });
    return map;
  }, [scopedCollections]);

  const tabsInActiveSpace = useMemo(() => {
    if (!activeSpaceId) {
      return scopedTabs;
    }
    return scopedTabs.filter((tab) => collectionById.get(tab.collectionId)?.spaceId === activeSpaceId);
  }, [activeSpaceId, collectionById, scopedTabs]);

  const activeSpaceName = useMemo(() => {
    if (!activeSpaceId) {
      return t("app.spaces");
    }
    return scopedSpaces.find((space) => space.id === activeSpaceId)?.name ?? t("app.spaces");
  }, [activeSpaceId, scopedSpaces, t]);

  const duplicateGroups = useMemo(() => {
    const byUrl = new Map<string, Array<{ tabId: string; title: string; url: string; collectionName: string }>>();
    tabsInActiveSpace.forEach((tab) => {
      const collectionName = collectionById.get(tab.collectionId)?.name ?? "Unknown";
      const list = byUrl.get(tab.url) ?? [];
      list.push({ tabId: tab.id, title: tab.title, url: tab.url, collectionName });
      byUrl.set(tab.url, list);
    });
    return Array.from(byUrl.entries())
      .filter(([, list]) => list.length > 1)
      .map(([url, list]) => ({ url, items: list }));
  }, [collectionById, tabsInActiveSpace]);

  const filteredDuplicateGroups = useMemo(() => {
    if (!dedupeQuery.trim()) {
      return duplicateGroups;
    }
    const query = dedupeQuery.toLowerCase();
    return duplicateGroups.filter((group) => {
      if (group.url.toLowerCase().includes(query)) {
        return true;
      }
      return group.items.some((item) => item.title.toLowerCase().includes(query));
    });
  }, [dedupeQuery, duplicateGroups]);

  useEffect(() => {
    // Keep collapse state in sync with the active workspace collections.
    setCollapsedCollections((prev) => {
      const next: Record<string, boolean> = {};
      scopedCollections.forEach((collection) => {
        next[collection.id] = prev[collection.id] ?? false;
      });
      return next;
    });
  }, [scopedCollections]);

  useEffect(() => {
    if (activeWorkspaceId) {
      setBulkMoveWorkspaceId(activeWorkspaceId);
      const firstSpace = spaces.find((space) => space.workspaceId === activeWorkspaceId);
      if (firstSpace) {
        setBulkMoveSpaceId(firstSpace.id);
      }
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (activeWorkspaceId) {
      setWindowMoveWorkspaceId(activeWorkspaceId);
      const initialSpace = spaces.find((space) => space.workspaceId === activeWorkspaceId);
      if (initialSpace) {
        setWindowMoveSpaceId(initialSpace.id);
      }
      setTabMoveWorkspaceId(activeWorkspaceId);
      const tabSpace = spaces.find((space) => space.workspaceId === activeWorkspaceId);
      if (tabSpace) {
        setTabMoveSpaceId(tabSpace.id);
      }
    }
  }, [activeWorkspaceId, spaces]);

  useEffect(() => {
    if (tabMoveCollections.length > 0 && !tabMoveCollections.some((collection) => collection.id === tabMoveCollectionId)) {
      setTabMoveCollectionId(tabMoveCollections[0].id);
    }
  }, [tabMoveCollections, tabMoveCollectionId]);

  useEffect(() => {
    if (bulkMoveSpaces.length > 0 && !bulkMoveSpaces.some((space) => space.id === bulkMoveSpaceId)) {
      setBulkMoveSpaceId(bulkMoveSpaces[0].id);
    }
  }, [bulkMoveSpaces, bulkMoveSpaceId]);

  useEffect(() => {
    if (windowMoveSpaces.length > 0 && !windowMoveSpaces.some((space) => space.id === windowMoveSpaceId)) {
      setWindowMoveSpaceId(windowMoveSpaces[0].id);
    }
  }, [windowMoveSpaces, windowMoveSpaceId]);

  useEffect(() => {
    if (!windowMoveOpen) {
      return;
    }
    if (!windowMoveName.trim()) {
      setWindowMoveName(t("right.selectedTabs"));
    }
  }, [t, windowMoveName, windowMoveOpen]);

  useEffect(() => {
    if (!moveNotice) {
      return;
    }
    const timer = window.setTimeout(() => setMoveNotice(null), 2400);
    return () => window.clearTimeout(timer);
  }, [moveNotice]);

  useEffect(() => {
    if (!uiNotice) {
      return;
    }
    const timer = window.setTimeout(() => setUiNotice(""), 2200);
    return () => window.clearTimeout(timer);
  }, [uiNotice]);

  useEffect(() => {
    if (!orgSettingsOpen) {
      return;
    }
    setOrgNameDraft(workspace?.name ?? "");
    setOrgLogoDraft(workspace?.logoUrl ?? null);
    setDeleteConfirmName("");
    setLinkStatus("");
    setLinkToken("");
    setLinkId("");
    setLinkAccess("restricted");
  }, [orgSettingsOpen, workspace]);

  useEffect(() => {
    if (!collectionInviteOpen) {
      return;
    }
    setCollectionInviteStatus("");
    setCollectionInviteLink("");
  }, [collectionInviteOpen]);

  useEffect(() => {
    if (!orgSettingsOpen || orgSettingsTab !== "members") {
      return;
    }
    if (supabaseClient && workspace && linkStatus.includes(t("auth.status.missingSupabase"))) {
      setLinkStatus("");
    }
  }, [linkStatus, orgSettingsOpen, orgSettingsTab, supabaseClient, t, workspace]);

  useEffect(() => {
    if (members.length > 0 || !authUser) {
      return;
    }
      setMembers([
        {
          id: "current-user",
          userId: authUser.id,
          name: authUser.name ?? "You",
          email: authUser.email ?? "",
          role: "owner",
        },
      ]);
  }, [authUser, members.length]);

  const ensureRemoteWorkspace = useCallback(async () => {
    if (!workspace || !supabaseClient || !authUser?.id) {
      return {
        ok: false as const,
        message: `${t("auth.status.missingSupabase")} (client)`,
      };
    }
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(workspace.id)) {
      return {
        ok: false as const,
        message: locale === "en" ? "Invalid workspace id" : "組織 ID 格式錯誤",
      };
    }
    const upsertRes = await supabaseClient.from("workspaces").upsert(
      {
        id: workspace.id,
        owner_id: authUser.id,
        name: workspace.name,
      },
      { onConflict: "id", ignoreDuplicates: true }
    );
    if (upsertRes.error) {
      return {
        ok: false as const,
        message: upsertRes.error.message,
      };
    }
    return { ok: true as const };
  }, [authUser?.id, locale, supabaseClient, t, workspace]);

  const loadMembers = useCallback(async () => {
    if (!workspace || !supabaseClient) {
      return;
    }
    setMembersLoading(true);
    setMemberStatus("");
    const ensureRes = await ensureRemoteWorkspace();
    if (!ensureRes.ok) {
      setMemberStatus(ensureRes.message);
      setMembersLoading(false);
      return;
    }
    const memberRes = await supabaseClient
      .from("workspace_members")
      .select("id, user_id, role")
      .eq("workspace_id", workspace.id);
    if (memberRes.error) {
      setMemberStatus(memberRes.error.message);
      setMembersLoading(false);
      return;
    }

    const rows = [...(memberRes.data ?? [])];
    const ownerId = workspace?.ownerId ?? null;
    // Ensure the owner is represented even if membership rows are missing.
    if (ownerId && !rows.some((row) => row.user_id === ownerId)) {
      if (authUser?.id === ownerId) {
        await supabaseClient.from("workspace_members").insert({
          id: crypto.randomUUID(),
          workspace_id: workspace.id,
          user_id: ownerId,
          role: "owner",
        });
      }
      rows.unshift({
        id: `owner-${ownerId}`,
        user_id: ownerId,
        role: "owner",
      });
    }
    const userIds = rows.map((row) => row.user_id).filter(Boolean);
    // Join profiles to show display names/emails in the member list.
    let profiles: Array<{ id: string; email?: string; full_name?: string; name?: string; avatar_url?: string }> = [];
    if (userIds.length > 0) {
      const profileRes = await supabaseClient
        .from("profiles")
        .select("id, email, full_name, name, avatar_url")
        .in("id", userIds);
      if (!profileRes.error && profileRes.data) {
        profiles = profileRes.data;
      }
    }

    const nextMembers = rows.map((row) => {
      const profile = profiles.find((item) => item.id === row.user_id);
      const displayName =
        profile?.full_name ?? profile?.name ?? profile?.email ?? row.user_id ?? "Member";
      return {
        id: row.id as string,
        userId: row.user_id as string,
        name: displayName,
        email: profile?.email ?? row.user_id ?? "",
        role: (row.role ?? "viewer") as "owner" | "admin" | "editor" | "commenter" | "viewer",
      };
    });
    setMembers(nextMembers);
    setMembersLoading(false);
  }, [authUser?.id, ensureRemoteWorkspace, supabaseClient, workspace]);

  useEffect(() => {
    if (!orgSettingsOpen || orgSettingsTab !== "members") {
      return;
    }
    if (!supabaseClient) {
      setMemberStatus(`${t("auth.status.missingSupabase")} (client)`);
      return;
    }
    void loadMembers();
  }, [loadMembers, orgSettingsOpen, orgSettingsTab, supabaseClient, t]);

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) {
      return members;
    }
    const query = memberSearch.toLowerCase();
    return members.filter(
      (member) =>
        member.name.toLowerCase().includes(query) || member.email.toLowerCase().includes(query)
    );
  }, [memberSearch, members]);

  const currentMemberRole = useMemo(() => {
    if (!authUser) {
      return null;
    }
    if (workspace?.ownerId && authUser.id === workspace.ownerId) {
      return "owner";
    }
    const member = members.find((item) => item.userId === authUser.id || item.email === authUser.email);
    return member?.role ?? null;
  }, [authUser, members, workspace?.ownerId]);

  const canManageMembers = currentMemberRole === "owner" || currentMemberRole === "admin";
  const canAssignOwner = currentMemberRole === "owner";
  const memberRoleOptions = useMemo(() => {
    const base = [
      { value: "admin", label: t("collab.role.admin"), group: "角色" },
      { value: "editor", label: t("collab.role.editor"), group: "角色" },
      { value: "commenter", label: t("collab.role.commenter"), group: "角色" },
      { value: "viewer", label: t("collab.role.viewer"), group: "角色" },
    ];
    if (canAssignOwner) {
      return [{ value: "owner", label: t("collab.role.owner"), group: "角色" }, ...base];
    }
    return base;
  }, [canAssignOwner, t]);

  const handleOpenAll = (collectionId: string) => {
    const urls = scopedTabs.filter((tab) => tab.collectionId === collectionId).map((tab) => tab.url);
    if (urls.length > 0) {
      void openTabs(urls);
    }
  };

  const tabsByCollection = useMemo(() => {
    const map = new Map<string, typeof scopedTabs>();
    scopedTabs.forEach((tab) => {
      const list = map.get(tab.collectionId) ?? [];
      list.push(tab);
      map.set(tab.collectionId, list);
    });
    map.forEach((list) => list.sort((a, b) => a.position - b.position));
    return map;
  }, [scopedTabs]);

  const tabGridClass =
    viewMode === "list"
      ? "grid grid-cols-1"
      : viewMode === "image"
      ? "grid [grid-template-columns:repeat(auto-fill,minmax(240px,1fr))]"
      : "grid [grid-template-columns:repeat(auto-fill,minmax(200px,1fr))]";

  const filteredCollections = useMemo(() => {
    const scopedBySpace = activeSpaceId
      ? scopedCollections.filter((collection) => collection.spaceId === activeSpaceId)
      : scopedCollections;
    if (!searchQuery.trim()) {
      return scopedBySpace;
    }
    const query = searchQuery.toLowerCase();
    return scopedBySpace.filter((collection) => {
      if (collection.name.toLowerCase().includes(query)) {
        return true;
      }
      const list = tabsByCollection.get(collection.id) ?? [];
      return list.some(
        (tab) =>
          tab.title.toLowerCase().includes(query) || tab.url.toLowerCase().includes(query)
      );
    });
  }, [activeSpaceId, scopedCollections, searchQuery, tabsByCollection]);

  const sortedCollections = useMemo(() => {
    const list = [...filteredCollections];
    switch (sortMode) {
      case "name":
        return list.sort((a, b) => a.name.localeCompare(b.name));
      case "createdAt":
        return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      case "recent":
        return list.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
      default:
        return list.sort((a, b) => a.position - b.position);
    }
  }, [filteredCollections, sortMode]);

  const sortLabel = useMemo(() => {
    if (sortMode === "recent") {
      return `排序：${t("app.sort.recent")}`;
    }
    if (sortMode === "name") {
      return `排序：${t("app.sort.name")}`;
    }
    if (sortMode === "createdAt") {
      return `排序：${t("app.sort.createdAt")}`;
    }
    return `排序：${t("app.sort.custom")}`;
  }, [sortMode, t]);

  const handleCycleSortMode = () => {
    const next = sortMode === "recent" ? "name" : sortMode === "name" ? "createdAt" : "recent";
    setSortMode(next);
  };

  useEffect(() => {
    const provider = createRuleBasedProvider();
    const run = async () => {
      const next: Record<string, string> = {};
      for (const collection of scopedCollections) {
        const list = tabsByCollection.get(collection.id) ?? [];
        const result = await provider.summarize(list.map((tab) => ({ title: tab.title, url: tab.url })));
        next[collection.id] = result.summary;
      }
      setSummaries(next);
    };
    void run();
  }, [scopedCollections, tabsByCollection]);

  useEffect(() => {
    let isMounted = true;
    const loadWindows = async () => {
      const windows = await getAllWindowsWithTabs();
      if (!isMounted) {
        return;
      }
      setWindowGroups(
        windows.map((win, index) => ({
          id: win.id,
          title: `${t("right.window")} ${index + 1}`,
          tabs: win.tabs.map(toWindowTab),
        }))
      );
    };
    void loadWindows();
    const interval = window.setInterval(loadWindows, 8000);
    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, [t]);

  const canWrite = membershipStatus === "trial_active" || membershipStatus === "paid_active";
  const guardWrite = () => {
    if (canWrite) {
      return true;
    }
    setUpgradeNotice(locale === "en" ? "Trial expired. Please upgrade." : "試用已到期，請升級方案。");
    return false;
  };

  const handleCreateWorkspace = () => {
    if (!guardWrite()) {
      return;
    }
    const name = window.prompt("輸入新的組織名稱");
    if (!name) {
      return;
    }
    addWorkspace(name.trim());
  };

  const handleCreateSpace = () => {
    if (!guardWrite()) {
      return;
    }
    const name = window.prompt("輸入 Space 名稱");
    if (!name) {
      return;
    }
    addSpace(name.trim());
  };

  const handleCreateCollection = () => {
    if (!guardWrite()) {
      return;
    }
    const name = window.prompt(locale === "en" ? "Collection name" : "請輸入集合名稱");
    if (!name || !name.trim()) {
      return;
    }
    addCollection(name.trim());
  };

  const handleAddCollectionInSpace = (spaceId: string) => {
    setSelectedSpaceId(spaceId);
    handleCreateCollection();
  };

  const handleRenameSpace = (spaceId: string) => {
    if (!guardWrite()) {
      return;
    }
    const current = spaces.find((space) => space.id === spaceId)?.name ?? "";
    const name = window.prompt(locale === "en" ? "Rename space" : "重新命名空間", current);
    if (!name || !name.trim()) {
      return;
    }
    updateSpace(spaceId, { name: name.trim() });
    showUiNotice(locale === "en" ? "Space renamed" : "空間已重新命名");
    setSelectedSpaceId(spaceId);
  };

  const handleDeleteSpace = (spaceId: string) => {
    if (!guardWrite()) {
      return;
    }
    const confirmed = window.confirm(locale === "en" ? "Delete this space?" : "確定刪除空間嗎？");
    if (!confirmed) {
      return;
    }
    deleteSpace(spaceId);
    showUiNotice(locale === "en" ? "Space deleted" : "空間已刪除");
  };

  const handleInviteSpace = (spaceId: string) => {
    setOrgSettingsTab("members");
    setOrgSettingsOpen(true);
    setSelectedSpaceId(spaceId);
  };

  const toTabInput = (tab: { title: string; url: string; favIconUrl?: string }) => {
    const input: { title: string; url: string; pinned: boolean; favIconUrl?: string } = {
      title: tab.title,
      url: tab.url,
      pinned: false,
    };
    const safeFaviconUrl = toSafeFaviconUrl(tab.url, typeof tab.favIconUrl === "string" ? tab.favIconUrl : null);
    if (safeFaviconUrl) {
      input.favIconUrl = safeFaviconUrl;
    }
    return input;
  };

  const handleSaveWindowGroup = (
    title: string,
    list: Array<{ id: number; title: string; url: string; favIconUrl?: string }>
  ) => {
    if (!guardWrite()) {
      return;
    }
    if (list.length === 0) {
      return;
    }
    saveCollectionFromTabs(title, list.map((tab) => toTabInput(tab)));
  };

  const handleDropWindowTabToCollection = (tabId: number, targetCollectionId: string) => {
    if (!guardWrite()) {
      return;
    }
    const tab = windowGroups.flatMap((window) => window.tabs).find((item) => item.id === tabId);
    if (!tab) {
      return;
    }
    const targetCollection = collections.find((collection) => collection.id === targetCollectionId);
    if (!targetCollection) {
      return;
    }
    addTabToCollection(targetCollectionId, toTabInput(tab));
    void closeTabs([tabId]);
    setDragOverCollectionId(null);
  };

  const handleDropSavedTabToCollection = (tabId: string, targetCollectionId: string) => {
    if (!guardWrite()) {
      return;
    }
    const tab = tabs.find((item) => item.id === tabId);
    if (!tab) {
      return;
    }
    if (tab.collectionId === targetCollectionId) {
      setDragOverCollectionId(null);
      return;
    }
    moveTabToCollection(tabId, targetCollectionId);
    const targetCollection = collections.find((collection) => collection.id === targetCollectionId);
    if (targetCollection) {
      setMoveNotice({
        message: locale === "en" ? "Tab moved" : "分頁已移動",
        workspaceId: targetCollection.workspaceId,
        spaceId: targetCollection.spaceId,
        collectionId: targetCollection.id,
      });
    }
    setDragOverCollectionId(null);
  };

  const addDockItemsFromTabs = (items: Array<{ title: string; url: string; faviconUrl?: string | null }>) => {
    if (items.length === 0) {
      return;
    }
    addDockItems(
      items.map((tab) => ({
        type: "tab",
        title: tab.title,
        url: tab.url,
        faviconUrl: tab.faviconUrl ?? null,
      }))
    );
    showUiNotice(locale === "en" ? "Added to Dock" : "已加入 Dock");
  };

  const handleDropToDock = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDockDropActive(false);
    const savedRaw = event.dataTransfer.getData("application/x-toby-saved-tab");
    if (savedRaw) {
      const selectedTabs = selectedTabIds.has(savedRaw)
        ? tabs.filter((tab) => selectedTabIds.has(tab.id))
        : tabs.filter((tab) => tab.id === savedRaw);
      if (selectedTabs.length > 0) {
        addDockItemsFromTabs(
          selectedTabs.map((tab) => ({
            title: tab.title,
            url: tab.url,
            faviconUrl: tab.faviconUrl,
          }))
        );
      }
      return;
    }

    const windowRaw =
      event.dataTransfer.getData("application/x-toby-window-tab") ||
      event.dataTransfer.getData("application/x-toby-tab") ||
      event.dataTransfer.getData("text/plain");
    const tabId = Number(windowRaw);
    if (!Number.isFinite(tabId)) {
      return;
    }
    if (selectedWindowTabIds.has(tabId) && selectedWindowTabIds.size > 0) {
      handleAddSelectedWindowTabsToDock();
      return;
    }
    const tab = openTabList.find((item) => item.id === tabId);
    if (!tab) {
      return;
    }
    addDockItemsFromTabs([
      {
        title: tab.title,
        url: tab.url,
        faviconUrl: tab.favIconUrl ?? null,
      },
    ]);
  };

  const handleOpenWindowTab = (tabId: number, windowId: number) => {
    void focusTab(tabId, windowId);
  };

  const handleSaveSelectedWindowTabs = () => {
    if (!guardWrite()) {
      return;
    }
    if (selectedWindowTabIds.size === 0) {
      return;
    }
    const selectedTabs: Array<{ id: number; title: string; url: string; favIconUrl?: string }> = [];
    windowGroups.forEach((window) => {
      window.tabs.forEach((tab) => {
        if (selectedWindowTabIds.has(tab.id)) {
          selectedTabs.push(tab);
        }
      });
    });
    if (selectedTabs.length === 0) {
      return;
    }
    saveCollectionFromTabs(t("right.selectedTabs"), selectedTabs.map((tab) => toTabInput(tab)));
    setSelectedWindowTabIds(new Set());
  };

  const toggleWindowTabSelected = (tabId: number) => {
    setSelectedWindowTabIds((prev) => {
      const next = new Set(prev);
      if (next.has(tabId)) {
        next.delete(tabId);
      } else {
        next.add(tabId);
      }
      return next;
    });
  };

  const handleAddCollectionAction = (value: AddCollectionAction) => {
    if (value === "blank") {
      handleCreateCollection();
    } else if (value === "current-window") {
      const currentWindow = windowGroups[0];
      if (currentWindow) {
        handleSaveWindowGroup(currentWindow.title, currentWindow.tabs);
      }
    } else if (value === "selected-tabs") {
      handleSaveSelectedWindowTabs();
    }
  };

  const handleOpenCollectionInvite = (collectionId: string) => {
    setCollectionInviteId(collectionId);
    setCollectionInviteOpen(true);
  };

  const handleCreateCollectionInvite = () => {
    if (!collectionInviteId) {
      return;
    }
    if (!supabaseClient || !workspace) {
      setCollectionInviteStatus(`${t("auth.status.missingSupabase")} (client)`);
      return;
    }
    void (async () => {
      setCollectionInviteStatus(locale === "en" ? "Creating link..." : "建立邀請連結中...");
      const ensureRes = await ensureRemoteWorkspace();
      if (!ensureRes.ok) {
        setCollectionInviteStatus(ensureRes.message);
        return;
      }
      const result = await createShareLink(supabaseClient, {
        workspaceId: workspace.id,
        resourceType: "collection",
        resourceId: collectionInviteId,
        permission: "view",
        isPublic: true,
      });
      if (result.error) {
        setCollectionInviteStatus(result.error.message || (locale === "en" ? "Invite failed" : "邀請失敗"));
        return;
      }
      const token = result.data?.token ?? "";
      setCollectionInviteLink(token ? `${effectiveSupabaseUrl}/functions/v1/share?token=${token}` : "");
      setCollectionInviteStatus(locale === "en" ? "Link created" : "邀請連結已建立");
    })();
  };

  const handleOrgLogoChange = (file: File) => {
    if (!supabaseClient || !workspace) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          setOrgLogoDraft(reader.result);
        }
      };
      reader.readAsDataURL(file);
      return;
    }
    const ext = file.name.split(".").pop() ?? "png";
    const path = `${workspace.id}/${Date.now()}.${ext}`;
    void (async () => {
      setOrgStatus("");
      const upload = await supabaseClient.storage.from("workspace-logos").upload(path, file, {
        upsert: true,
      });
      if (upload.error) {
        setOrgStatus(upload.error.message);
        return;
      }
      const publicUrl = supabaseClient.storage.from("workspace-logos").getPublicUrl(path);
      if (publicUrl.data.publicUrl) {
        // Best-effort cleanup of previous logo.
        if (workspace.logoUrl) {
          const parts = workspace.logoUrl.split("/workspace-logos/");
          if (parts[1]) {
            await supabaseClient.storage.from("workspace-logos").remove([parts[1]]);
          }
        }
        setOrgLogoDraft(publicUrl.data.publicUrl);
      }
    })();
  };

  const handleSaveOrgSettings = () => {
    if (!workspace) {
      return;
    }
    if (orgLogoDraft === null && workspace.logoUrl && supabaseClient) {
      const parts = workspace.logoUrl.split("/workspace-logos/");
      if (parts[1]) {
        void supabaseClient.storage.from("workspace-logos").remove([parts[1]]);
      }
    }
    updateWorkspace(workspace.id, {
      name: orgNameDraft.trim() || workspace.name,
      logoUrl: orgLogoDraft ?? null,
    });
    setOrgStatus(t("org.settings.save"));
  };

  const handleDeleteWorkspace = () => {
    if (!workspace) {
      return;
    }
    if (deleteConfirmName.trim() !== workspace.name.trim()) {
      return;
    }
    const confirmed = window.confirm(`${t("org.settings.delete")}：${workspace.name}`);
    if (!confirmed) {
      return;
    }
    deleteWorkspace(workspace.id);
    setOrgSettingsOpen(false);
  };

  const handleAddMember = () => {
    if (!memberEmail.trim() || !workspace) {
      return;
    }
    if (!supabaseClient) {
      setMemberStatus(`${t("auth.status.missingSupabase")} (client)`);
      return;
    }
    if (!canManageMembers) {
      setMemberStatus(t("org.members.noPermission"));
      return;
    }
    if (memberRole === "owner" && !canAssignOwner) {
      setMemberStatus(t("org.members.ownerOnly"));
      return;
    }
    void (async () => {
      setMemberStatus("");
      const invite = await supabaseClient.functions.invoke("invite_member", {
        body: {
          email: memberEmail.trim(),
          workspaceId: workspace.id,
          role: memberRole,
        },
      });
      if (!invite.error) {
        setMemberStatus(t("org.members.inviteSent"));
        setMemberName("");
        setMemberEmail("");
        setMemberRole("viewer");
        if (workspace) {
          updateWorkspace(workspace.id, {
            inviteCount: (workspace.inviteCount ?? 0) + 1,
            points: (workspace.points ?? 0) + 10,
          });
        }
        await loadMembers();
        return;
      }

      // Fallback: direct insert if profile exists.
      const lookup = await supabaseClient
        .from("profiles")
        .select("id, email, full_name, name")
        .eq("email", memberEmail.trim())
        .maybeSingle();
      const profile = lookup.data;
      if (lookup.error || !profile?.id) {
        setMemberStatus(t("org.members.notFound"));
        return;
      }
      const insert = await supabaseClient.from("workspace_members").insert({
        workspace_id: workspace.id,
        user_id: profile.id,
        role: memberRole,
      });
      if (insert.error) {
        setMemberStatus(insert.error.message);
        return;
      }
        setMembers((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            userId: profile.id,
            name: memberName.trim() || profile.full_name || profile.name || profile.email || memberEmail.trim(),
            email: profile.email ?? memberEmail.trim(),
            role: memberRole,
          },
        ]);
      setMemberName("");
      setMemberEmail("");
      setMemberRole("viewer");
      setMemberStatus(t("org.members.added"));
      if (workspace) {
        updateWorkspace(workspace.id, {
          inviteCount: (workspace.inviteCount ?? 0) + 1,
          points: (workspace.points ?? 0) + 10,
        });
      }
      await loadMembers();
    })();
  };

  const handleUpdateMemberRole = (memberId: string, role: "owner" | "admin" | "editor" | "commenter" | "viewer") => {
    if (!supabaseClient) {
      setMemberStatus(`${t("auth.status.missingSupabase")} (client)`);
      return;
    }
    if (!canManageMembers) {
      setMemberStatus(t("org.members.noPermission"));
      return;
    }
    if (role === "owner" && !canAssignOwner) {
      setMemberStatus(t("org.members.ownerOnly"));
      return;
    }
    void (async () => {
      const result = await updateMemberRole(supabaseClient, memberId, role);
      if (result.error) {
        setMemberStatus(result.error.message);
        return;
      }
      setMembers((prev) => prev.map((member) => (member.id === memberId ? { ...member, role } : member)));
      setMemberStatus(t("org.members.updated"));
      await loadMembers();
    })();
  };

  const handleRemoveMember = (memberId: string) => {
    if (!supabaseClient) {
      setMemberStatus(`${t("auth.status.missingSupabase")} (client)`);
      return;
    }
    if (!canManageMembers) {
      setMemberStatus(t("org.members.noPermission"));
      return;
    }
    const target = members.find((member) => member.id === memberId);
    if (target?.role === "owner" && !canAssignOwner) {
      setMemberStatus(t("org.members.ownerOnly"));
      return;
    }
    const confirmed = window.confirm(t("org.members.removeConfirm"));
    if (!confirmed) {
      return;
    }
    void (async () => {
      const result = await removeMember(supabaseClient, memberId);
      if (result.error) {
        setMemberStatus(result.error.message);
        return;
      }
      setMembers((prev) => prev.filter((member) => member.id !== memberId));
      setMemberStatus(t("org.members.removed"));
      await loadMembers();
    })();
  };

  const handleToggleLinkAccess = (next: "restricted" | "link") => {
    setLinkStatus("");
    if (!supabaseClient) {
      setLinkStatus(`${t("auth.status.missingSupabase")} (client)`);
      return;
    }
    if (!workspace) {
      setLinkStatus(locale === "en" ? "Organization not ready" : "組織尚未就緒");
      return;
    }
    if (!canManageMembers) {
      setLinkStatus(t("org.members.noPermission"));
      return;
    }
    setLinkAccess(next);
    if (next === "restricted") {
      if (!linkId) {
        return;
      }
      void (async () => {
        const result = await revokeShareLink(supabaseClient, linkId);
        if (result.error) {
          setLinkStatus(result.error.message);
          return;
        }
        setLinkToken("");
        setLinkId("");
        setLinkStatus(t("org.link.revoked"));
      })();
      return;
    }

    void (async () => {
      setLinkStatus(t("org.link.creating"));
      const ensureRes = await ensureRemoteWorkspace();
      if (!ensureRes.ok) {
        setLinkStatus(ensureRes.message);
        return;
      }
      const result = await createShareLink(supabaseClient, {
        workspaceId: workspace.id,
        resourceType: "workspace",
        resourceId: workspace.id,
        permission: linkRole,
        isPublic: true,
      });
      if (result.error) {
        setLinkStatus(result.error.message || t("org.link.failed"));
        return;
      }
      setLinkId(result.data?.id ?? "");
      setLinkToken(result.data?.token ?? "");
      setLinkStatus(t("org.link.created"));
    })();
  };

  const handleImportSnapshot = (file: File) => {
    void (async () => {
      const text = await file.text();
      try {
        const data = JSON.parse(text);
        const parsed = localSnapshotSchema.safeParse(data);
        if (!parsed.success) {
          setOrgStatus(t("org.settings.importFailed"));
          return;
        }
        appStore.getState().hydrate(parsed.data);
        setOrgStatus(t("org.settings.imported"));
      } catch {
        setOrgStatus(t("org.settings.importFailed"));
      }
    })();
  };

  const handleOpenSelectedWindowTabs = () => {
    const urls: string[] = [];
    windowGroups.forEach((window) => {
      window.tabs.forEach((tab) => {
        if (selectedWindowTabIds.has(tab.id)) {
          urls.push(tab.url);
        }
      });
    });
    if (urls.length > 0) {
      void openTabs(urls);
    }
  };

  const handleOpenSelectedTabs = () => {
    if (selectedTabIds.size === 0) {
      return;
    }
    const urls = scopedTabs.filter((tab) => selectedTabIds.has(tab.id)).map((tab) => tab.url);
    if (urls.length > 0) {
      void openTabs(urls);
    }
  };

  const handleAddSelectedWindowTabsToDock = () => {
    if (selectedWindowTabIds.size === 0) {
      return;
    }
    const selectedTabs: Array<{ id: number; title: string; url: string; favIconUrl?: string }> = [];
    windowGroups.forEach((window) => {
      window.tabs.forEach((tab) => {
        if (selectedWindowTabIds.has(tab.id)) {
          selectedTabs.push(tab);
        }
      });
    });
    if (selectedTabs.length === 0) {
      return;
    }
    addDockItems(
      selectedTabs.map((tab) => ({
        type: "tab",
        title: tab.title,
        url: tab.url,
        faviconUrl: tab.favIconUrl ?? null,
      }))
    );
    setSelectedWindowTabIds(new Set());
    showUiNotice(locale === "en" ? "Added to Dock" : "已加入 Dock");
  };

  const handleMoveSelectedWindowTabsToSpace = () => {
    if (!guardWrite()) {
      return;
    }
    if (selectedWindowTabIds.size === 0 || !windowMoveWorkspaceId || !windowMoveSpaceId) {
      return;
    }
    const selectedTabs: Array<{ id: number; title: string; url: string; favIconUrl?: string }> = [];
    windowGroups.forEach((window) => {
      window.tabs.forEach((tab) => {
        if (selectedWindowTabIds.has(tab.id)) {
          selectedTabs.push(tab);
        }
      });
    });
    if (selectedTabs.length === 0) {
      return;
    }
    const name = windowMoveName.trim() || t("right.selectedTabs");
    saveCollectionFromTabsInSpace(name, selectedTabs.map((tab) => toTabInput(tab)), windowMoveWorkspaceId, windowMoveSpaceId);
    setSelectedWindowTabIds(new Set());
    setWindowMoveOpen(false);
    showUiNotice(locale === "en" ? "Moved to space" : "已移到空間");
  };

  const handleDeleteSelectedTabs = () => {
    const confirmed = window.confirm(t("tab.confirmDelete"));
    if (!confirmed) {
      return;
    }
    Array.from(selectedTabIds).forEach((tabId) => deleteTab(tabId));
    setSelectedTabIds(new Set());
  };

  const handleMoveSelectedTabs = () => {
    if (!tabMoveCollectionId) {
      return;
    }
    Array.from(selectedTabIds).forEach((tabId) => moveTabToCollection(tabId, tabMoveCollectionId));
    const targetCollection = collections.find((collection) => collection.id === tabMoveCollectionId);
    if (targetCollection) {
      setMoveNotice({
        message: locale === "en" ? "Tabs moved" : "分頁已移動",
        workspaceId: targetCollection.workspaceId,
        spaceId: targetCollection.spaceId,
        collectionId: targetCollection.id,
      });
    }
    setSelectedTabIds(new Set());
    setTabMoveOpen(false);
  };

  const handleApplyDedupe = () => {
    const toDelete = duplicateGroups.flatMap((group) =>
      group.items.filter((item) => !dedupeKeepIds.has(item.tabId)).map((item) => item.tabId)
    );
    toDelete.forEach((tabId) => deleteTab(tabId));
    setDedupeOpen(false);
  };

  const handleEditCollectionTitle = (collectionId: string, currentName: string) => {
    const next = window.prompt(t("collection.editTitlePrompt"), currentName);
    if (!next || !next.trim()) {
      return;
    }
    updateCollectionTitle(collectionId, next.trim());
  };

  const handleExportCollection = (collectionId: string, name: string) => {
    const list = tabsByCollection.get(collectionId) ?? [];
    const payload = {
      id: collectionId,
      name,
      tabs: list.map((tab) => ({
        title: tab.title,
        url: tab.url,
        description: tab.note ?? tab.ogDescription ?? null,
        ogImage: tab.ogImage ?? null,
      })),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${name.replace(/\s+/g, "_")}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const handleBulkMove = () => {
    if (!bulkMoveWorkspaceId || !bulkMoveSpaceId) {
      return;
    }
    Array.from(selectedCollectionIds).forEach((collectionId) => {
      moveCollectionToSpace(collectionId, bulkMoveWorkspaceId, bulkMoveSpaceId);
    });
    setSelectedCollectionIds(new Set());
    setBulkMoveOpen(false);
  };

  const handleBulkDelete = () => {
    const confirmed = window.confirm(t("collection.confirmDelete"));
    if (!confirmed) {
      return;
    }
    Array.from(selectedCollectionIds).forEach((collectionId) => {
      deleteCollection(collectionId);
    });
    setSelectedCollectionIds(new Set());
  };

  const handleToggleCollectionCollapse = (collectionId: string) => {
    setCollapsedCollections((prev) => ({
      ...prev,
      [collectionId]: !prev[collectionId],
    }));
  };

  const handleSync = async () => {
    const result = await manualDriveSync();
    if (!result.ok && result.error === "membership_inactive") {
      setUpgradeNotice(locale === "en" ? "Trial expired. Please upgrade." : "試用已到期，請升級方案。");
    }
  };

  const showUiNotice = useCallback((message: string) => {
    setUiNotice(message);
  }, []);

  const buildPayuniCheckoutUrl = useCallback(
    (planId: "personal_yearly" | "pro_monthly", accessToken: string) => {
      if (!effectiveSupabaseUrl) {
        return null;
      }
      const baseUrl = effectiveSupabaseUrl.replace(/\/$/, "");
      const params = new URLSearchParams({
        plan: planId,
        token: accessToken,
        locale,
      });
      return `${baseUrl}/functions/v1/payuni_checkout?${params.toString()}`;
    },
    [effectiveSupabaseUrl, locale]
  );

  const buildPayuniAutoSubmitHtml = useCallback(
    (payload: { merchantId: string; tradeInfo: string; tradeSha: string; version: string; checkoutUrl: string }) => `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Redirecting...</title>
  </head>
  <body>
    <form id="payuni-form" method="post" action="${payload.checkoutUrl}">
      <input type="hidden" name="MerchantID" value="${payload.merchantId}" />
      <input type="hidden" name="TradeInfo" value="${payload.tradeInfo}" />
      <input type="hidden" name="TradeSha" value="${payload.tradeSha}" />
      <input type="hidden" name="Version" value="${payload.version}" />
      <noscript>
        <p>JavaScript 已被停用，請手動按下按鈕繼續付款。</p>
        <button type="submit">繼續前往付款</button>
      </noscript>
    </form>
    <script>
      document.getElementById("payuni-form").submit();
    </script>
  </body>
</html>`,
    []
  );

  const handleStartCheckout = useCallback(
    async (planId: "trial" | "personal_yearly" | "pro_monthly" | "enterprise") => {
      if (planId === "trial") {
        return;
      }
      if (planId === "enterprise") {
        showUiNotice(locale === "en" ? "Contact us for enterprise pricing." : "企業方案請聯絡我們。");
        return;
      }
      if (!supabaseClient) {
        showUiNotice(t("auth.status.missingSupabase"));
        return;
      }
      const accessToken = await resolveAccessToken();
      if (!accessToken) {
        showUiNotice(locale === "en" ? "Please sign in again." : "請重新登入後再嘗試。");
        return;
      }
      const checkoutUrl = buildPayuniCheckoutUrl(planId, accessToken);
      if (!checkoutUrl) {
        showUiNotice(locale === "en" ? "Missing checkout URL." : "金流連結未設定。");
        return;
      }
      const popup = window.open("", "_blank", "noopener,noreferrer");
      if (!popup) {
        showUiNotice(locale === "en" ? "Please allow pop-ups to continue." : "請允許彈出視窗以完成付款。");
        return;
      }
      popup.document.write(
        `<p style="font-family: system-ui; padding: 24px;">${locale === "en" ? "Preparing checkout..." : "正在準備付款頁面..."}</p>`
      );
      try {
        const response = await fetch(checkoutUrl, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ planId }),
        });
        const data = (await response.json()) as {
          ok: boolean;
          checkout?: {
            merchantId: string;
            tradeInfo: string;
            tradeSha: string;
            version: string;
            checkoutUrl: string;
          };
          error?: string;
        };
        if (!response.ok || !data?.ok || !data.checkout) {
          showUiNotice(locale === "en" ? "Checkout failed. Please try again." : "付款建立失敗，請稍後再試。");
          popup.close();
          return;
        }
        const html = buildPayuniAutoSubmitHtml(data.checkout);
        popup.document.open();
        popup.document.write(html);
        popup.document.close();
      } catch (error) {
        showUiNotice(locale === "en" ? "Checkout failed. Please try again." : "付款建立失敗，請稍後再試。");
        popup.close();
      }
    },
    [buildPayuniAutoSubmitHtml, buildPayuniCheckoutUrl, locale, resolveAccessToken, showUiNotice, supabaseClient, t]
  );

  const dockSections = useMemo<DockSection[]>(() => {
    const openCollection = (collectionId: string) => {
      const urls = scopedTabs.filter((tab) => tab.collectionId === collectionId).map((tab) => tab.url);
      if (urls.length > 0) {
        void openTabs(urls);
      }
    };

    const coreItems: DockEntry[] = [
      {
        id: "home",
        label: locale === "en" ? "Home" : "首頁",
        icon: <LayoutGrid className="h-5 w-5" />,
        onClick: () => setSelectedCollectionId(null),
      },
      {
        id: "org",
        label: locale === "en" ? "Organization" : "組織",
        icon: <Building2 className="h-5 w-5" />,
        onClick: () => {
          setOrgSettingsTab("preferences");
          setOrgSettingsOpen(true);
        },
      },
      {
        id: "space",
        label: locale === "en" ? "Spaces" : "空間",
        icon: <Layers3 className="h-5 w-5" />,
        onClick: () => setLeftCollapsed(false),
      },
      {
        id: "inbox",
        label: locale === "en" ? "Inbox" : "收件匣",
        icon: <Inbox className="h-5 w-5" />,
        onClick: () => showUiNotice(locale === "en" ? "Inbox is coming soon." : "收件匣功能開發中"),
      },
      {
        id: "search",
        label: locale === "en" ? "Search" : "搜尋",
        icon: <Search className="h-5 w-5" />,
        onClick: () => searchInputRef.current?.focus(),
      },
      {
        id: "ai",
        label: "AI",
        icon: <Sparkles className="h-5 w-5" />,
        onClick: () => showUiNotice(locale === "en" ? "AI shortcuts are coming soon." : "AI 入口準備中"),
      },
    ];

    const pinnedItems: DockEntry[] = dockPinnedItems.map((item) => ({
      id: item.id,
      label: item.title,
      text: item.title.slice(0, 2).toUpperCase(),
      url: item.url ?? undefined,
      faviconUrl: item.faviconUrl ?? null,
      onClick: () => {
        if (item.type === "collection" && item.collectionId) {
          openCollection(item.collectionId);
          return;
        }
        if (item.type === "tab" && item.url) {
          void openTabs([item.url]);
        }
      },
      onRemove: () => {
        removeDockItem(item.id);
        showUiNotice(locale === "en" ? "Removed from Dock" : "已從 Dock 移除");
      },
    }));

    const recentItems: DockEntry[] = scopedCollections
      .slice()
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 3)
      .map((collection) => ({
        id: collection.id,
        label: collection.name,
        text: collection.name.slice(0, 2).toUpperCase(),
        onClick: () => openCollection(collection.id),
      }));

    const stashItems: DockEntry[] = [
      {
        id: "pin",
        label: locale === "en" ? "Stash" : "暫放",
        icon: <Pin className="h-5 w-5" />,
        onClick: () => showUiNotice(locale === "en" ? "Stash is coming soon." : "暫放功能準備中"),
      },
      {
        id: "recent",
        label: locale === "en" ? "Recent" : "最近使用",
        icon: <Clock3 className="h-5 w-5" />,
        onClick: () => showUiNotice(locale === "en" ? "Recent shortcuts are coming soon." : "最近使用入口準備中"),
      },
      {
        id: "settings",
        label: t("sidebar.settings"),
        icon: <Settings className="h-5 w-5" />,
        onClick: () => {
          setOrgSettingsTab("preferences");
          setOrgSettingsOpen(true);
        },
      },
    ];

    return [
      { id: "core", label: locale === "en" ? "Core" : "核心功能", items: coreItems },
      { id: "fixed", label: locale === "en" ? "Pinned" : "固定捷徑", items: pinnedItems },
      { id: "recent", label: locale === "en" ? "Recent" : "最近使用", items: recentItems },
      { id: "temp", label: locale === "en" ? "Stash & Settings" : "暫放 / 設定", items: stashItems },
    ];
  }, [
    dockPinnedItems,
    locale,
    removeDockItem,
    scopedCollections,
    scopedTabs,
    showUiNotice,
    setLeftCollapsed,
    setOrgSettingsOpen,
    setOrgSettingsTab,
    setSelectedCollectionId,
    t,
  ]);

  const openTabList = useMemo(
    () => windowGroups.flatMap((window) => window.tabs.map((tab) => ({ ...tab, windowId: window.id }))),
    [windowGroups]
  );

  const collapsedTabIcons = useMemo(() => openTabList.slice(0, 8), [openTabList]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  // Layout mirrors a Toby-like information hierarchy while keeping data wiring intact.
  if (!authUser) {
    return (
      <div className="flex h-[100vh] w-full min-w-[1280px] items-center justify-center overflow-x-auto bg-zinc-100 p-4 text-zinc-900">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-lg font-semibold text-white">
            OO
          </div>
          <div className="text-lg font-semibold">{t("login.title")}</div>
          <div className="mt-2 text-sm text-zinc-500">{t("login.subtitle")}</div>
          <button
            className="mt-4 w-full rounded-xl bg-rose-500 px-4 py-2 text-sm font-semibold text-white"
            onClick={handleGoogle}
          >
            {t("login.google")}
          </button>
          <div className="mt-3 text-xs text-zinc-500">{status || t("login.required")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100vh] w-full overflow-x-auto bg-zinc-100 p-4 text-zinc-900">
      <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
        <main
          className={`grid h-full min-h-full min-w-[1280px] gap-4 pb-4 ${
            leftCollapsed
              ? "grid-cols-[84px_minmax(420px,1fr)_360px]"
              : rightCollapsed
                ? "grid-cols-[280px_minmax(420px,1fr)_72px]"
                : "grid-cols-[280px_minmax(420px,1fr)_360px]"
          }`}
        >
          {shareNotice ? (
            <div className="fixed left-1/2 top-4 z-[9999] -translate-x-1/2 rounded-full border border-zinc-200 bg-white/90 px-4 py-2 text-xs text-zinc-700 shadow-lg backdrop-blur">
              {shareNotice}
            </div>
          ) : null}
          {upgradeNotice ? (
            <div className="fixed left-1/2 top-12 z-[9999] -translate-x-1/2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700 shadow-lg backdrop-blur">
              <div className="flex items-center gap-3">
                <span>{upgradeNotice}</span>
                <button
                  className="rounded-full bg-rose-500 px-3 py-1 text-[10px] font-semibold text-white"
                  onClick={() => setPricingOpen(true)}
                >
                  {locale === "en" ? "Upgrade" : "升級方案"}
                </button>
              </div>
            </div>
          ) : null}
          {uiNotice ? (
            <div className="fixed left-1/2 top-20 z-[9999] -translate-x-1/2 rounded-full border border-zinc-200 bg-white/90 px-4 py-2 text-xs text-zinc-700 shadow-lg backdrop-blur">
              {uiNotice}
            </div>
          ) : null}
          <aside className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-4 py-4">
              <div className="flex items-center justify-between gap-2">
                {!leftCollapsed ? <div className="text-xs font-semibold tracking-wide text-zinc-500">組織</div> : null}
                <button
                  onClick={() => setLeftCollapsed((prev) => !prev)}
                  className="rounded-xl p-2 text-zinc-500 hover:bg-zinc-100"
                  aria-label={leftCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                >
                  <Columns3 className="h-4 w-4" />
                </button>
              </div>
              {!leftCollapsed ? (
                <div className="relative mt-3">
                  <button
                    onClick={() => setOrgMenuOpen((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-2xl bg-zinc-50 p-4 pr-4 text-left"
                  >
                    <div>
                      <div className="text-lg font-semibold">{workspace?.name ?? t("app.loading")}</div>
                      <div className="mt-1 text-sm text-zinc-500">{scopedSpaces.length} 個空間</div>
                    </div>
                    <ChevronsUpDown className="h-4 w-4 text-zinc-500" />
                  </button>

                  <div className="absolute right-2 top-[85%] z-10 flex -translate-y-1/2 items-center gap-1 [bottom:auto]">
                    <button className="rounded-xl p-2 text-zinc-500 transition hover:bg-white" onClick={handleCreateWorkspace}>
                      <Plus className="h-4 w-4" />
                    </button>
                    <button className="rounded-xl p-2 text-zinc-500 transition hover:bg-white" onClick={() => setOrgSettingsOpen(true)}>
                      <Settings className="h-4 w-4" />
                    </button>
                    <button
                      className="rounded-xl p-2 text-zinc-500 transition hover:bg-white"
                      onClick={() => {
                        setOrgSettingsTab("members");
                        setOrgSettingsOpen(true);
                      }}
                    >
                      <UserPlus className="h-4 w-4" />
                    </button>
                  </div>

                  {orgMenuOpen ? (
                    <div className="absolute left-0 right-0 top-full z-30 mt-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
                      {workspaces.map((org) => {
                        const spaceCount = spaces.filter((space) => space.workspaceId === org.id).length;
                        return (
                          <button
                            key={org.id}
                            onClick={() => {
                              setSelectedWorkspaceId(org.id);
                              const firstSpace = spaces.find((space) => space.workspaceId === org.id);
                              if (firstSpace) {
                                setSelectedSpaceId(firstSpace.id);
                              }
                              setOrgMenuOpen(false);
                            }}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm hover:bg-zinc-50"
                          >
                            <div>
                              <div className="font-medium text-zinc-900">{org.name}</div>
                              <div className="text-xs text-zinc-500">{spaceCount} 個空間</div>
                            </div>
                            {activeWorkspaceId === org.id ? <Check className="h-4 w-4 text-zinc-700" /> : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="mt-3 flex justify-center">
                  <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-white">
                    <Building2 className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>

            {!leftCollapsed ? (
              <div className="flex items-center justify-between px-5 pt-4">
                <div className="text-sm font-semibold text-zinc-600">空間</div>
                <div className="flex items-center gap-1">
                  <button className="rounded-xl bg-zinc-100 px-3 py-1.5 text-xs text-zinc-500" onClick={handleCreateSpace}>
                    新增空間
                  </button>
                  <EntityMenuButton
                    type="space-global"
                    id={activeWorkspaceId ?? "space"}
                    entityMenu={entityMenu}
                    setEntityMenu={setEntityMenu}
                    items={[
                      { label: "新增空間", icon: Layers2, onClick: handleCreateSpace },
                      { label: "編輯目前空間", icon: Pencil, onClick: () => activeSpaceId && handleRenameSpace(activeSpaceId) },
                      { label: "刪除目前空間", icon: Trash2, onClick: () => activeSpaceId && handleDeleteSpace(activeSpaceId) },
                      { label: "邀請好友", icon: UserPlus, onClick: () => activeSpaceId && handleInviteSpace(activeSpaceId) },
                    ]}
                  />
                </div>
              </div>
            ) : null}

            <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-3 pt-3">
              <div className="space-y-2">
                {scopedSpaces.map((space) => (
                  <div
                    key={space.id}
                    className={`group flex items-center gap-2 rounded-2xl ${
                      space.id === activeSpaceId ? "bg-zinc-900" : "bg-zinc-50 hover:bg-zinc-100"
                    }`}
                  >
                    <button
                      onClick={() => setSelectedSpaceId(space.id)}
                      className={`flex min-w-0 flex-1 items-center justify-between px-4 py-3 text-left ${
                        space.id === activeSpaceId ? "text-white" : "text-zinc-700"
                      }`}
                    >
                      <span className={`text-sm font-medium ${leftCollapsed ? "mx-auto" : ""}`}>
                        {leftCollapsed ? space.name.slice(0, 1) : space.name}
                      </span>
                      {!leftCollapsed ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs ${
                            space.id === activeSpaceId ? "bg-white/15 text-white" : "bg-white text-zinc-500"
                          }`}
                        >
                          {collectionCountBySpace.get(space.id) ?? 0}
                        </span>
                      ) : null}
                    </button>
                    {!leftCollapsed ? (
                      <div className="pr-2 opacity-0 transition group-hover:opacity-100">
                        <EntityMenuButton
                          type="space"
                          id={space.id}
                          entityMenu={entityMenu}
                          setEntityMenu={setEntityMenu}
                          items={[
                            { label: "新增集合", icon: FolderPlus, onClick: () => handleAddCollectionInSpace(space.id) },
                            { label: "編輯空間", icon: Pencil, onClick: () => handleRenameSpace(space.id) },
                            { label: "刪除空間", icon: Trash2, onClick: () => handleDeleteSpace(space.id) },
                            { label: "邀請好友", icon: UserPlus, onClick: () => handleInviteSpace(space.id) },
                          ]}
                          className={space.id === activeSpaceId ? "text-white hover:bg-white/10" : ""}
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>

              {!leftCollapsed ? (
                <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 p-4 text-sm text-zinc-500">
                  拖曳頁籤到空白處，快速建立新集合
                </div>
              ) : null}
            </div>
            <div className="mt-auto space-y-2 border-t border-zinc-200 px-4 pb-4 pt-3 text-xs text-zinc-500">
              {!leftCollapsed ? <div>{t("rail.account")}</div> : null}
              <div className={`flex items-center ${leftCollapsed ? "justify-center" : "justify-between"}`}>
                <button className="rounded-xl bg-zinc-100 px-2 py-1 text-[10px] text-zinc-600" onClick={handleSync}>
                  {leftCollapsed ? "⟳" : t("app.syncNow")}
                </button>
                {!leftCollapsed ? (
                  <button
                    className="rounded-xl bg-zinc-100 px-2 py-1 text-[10px] text-zinc-600"
                    onClick={() => {
                      setOrgSettingsTab("preferences");
                      setOrgSettingsOpen(true);
                    }}
                  >
                    {t("sidebar.settings")}
                  </button>
                ) : null}
              </div>
              {!leftCollapsed ? (
                <button
                  className="w-full rounded-xl border border-rose-200 bg-rose-50 px-2 py-1 text-[10px] font-semibold text-rose-600"
                  onClick={() => setPricingOpen(true)}
                >
                  {locale === "en" ? "Upgrade plan" : "升級方案"}
                </button>
              ) : null}
              <div className={`flex items-center ${leftCollapsed ? "justify-center" : "justify-between"}`}>
                <div className="w-12">
                  <AuthMiniPanel />
                </div>
              </div>
            </div>
          </aside>

          <main className="flex h-full min-h-0 flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm">
            <div className="border-b border-zinc-200 px-6 py-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="text-sm font-semibold text-zinc-500">
                  {workspace?.name ?? t("app.loading")} / {activeSpaceName}
                </div>
                <div className="ml-auto flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <button
                      onClick={() => setCreateCollectionMenuOpen((prev) => !prev)}
                      className="flex items-center gap-2 rounded-2xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white"
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
                          從拖放內容建立
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <button
                    onClick={handleCycleSortMode}
                    className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-700"
                  >
                    <ArrowUpDown className="h-4 w-4" />
                    <span>{sortLabel}</span>
                  </button>

                  <div className="flex items-center rounded-2xl border border-zinc-200 bg-white p-1">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`rounded-xl p-2 ${viewMode === "grid" ? "bg-zinc-900 text-white" : "text-zinc-500"}`}
                    >
                      <Grid2X2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`rounded-xl p-2 ${viewMode === "list" ? "bg-zinc-900 text-white" : "text-zinc-500"}`}
                    >
                      <List className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex min-w-[260px] items-center gap-2 rounded-2xl bg-zinc-100 px-4 py-3 text-sm text-zinc-500">
                    <Search className="h-4 w-4" />
                    <input
                      ref={searchInputRef}
                      className="w-full bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
                      placeholder={t("app.searchPlaceholder")}
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <SortableContext
                items={sortedCollections.map((collection) => collection.id)}
                strategy={verticalListSortingStrategy}
              >
                {viewMode === "list" ? (
                  <div className="space-y-3">
                    {sortedCollections.map((collection) => (
                      <CollectionRow
                        key={collection.id}
                        id={collection.id}
                        name={collection.name}
                        tabCount={tabCountByCollection.get(collection.id) ?? 0}
                        updatedAt={collection.updatedAt}
                        entityMenu={entityMenu}
                        setEntityMenu={setEntityMenu}
                        menuItems={[
                          { label: "編輯集合", icon: Pencil, onClick: () => handleEditCollectionTitle(collection.id, collection.name) },
                          { label: "刪除集合", icon: Trash2, onClick: () => deleteCollection(collection.id) },
                          { label: "邀請好友", icon: UserPlus, onClick: () => handleOpenCollectionInvite(collection.id) },
                        ]}
                        onSelect={() => setSelectedCollectionId(collection.id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 xl:grid-cols-2">
                    {sortedCollections.map((collection) => {
                      const list = orderBySpace.get(collection.spaceId) ?? [];
                      const index = list.indexOf(collection.id);
                      const canMoveUp = index > 0;
                      const canMoveDown = index >= 0 && index < list.length - 1;
                      return (
                        <CollectionCard
                          key={collection.id}
                          name={collection.name}
                          tabCount={tabCountByCollection.get(collection.id) ?? 0}
                          summary={summaries[collection.id]}
                          onOpenAll={() => handleOpenAll(collection.id)}
                          onMoveUp={() => moveCollectionWithinSpace(collection.id, "up")}
                          onMoveDown={() => moveCollectionWithinSpace(collection.id, "down")}
                          canMoveUp={canMoveUp}
                          canMoveDown={canMoveDown}
                          onEditTitle={(name) => handleEditCollectionTitle(collection.id, name)}
                          onToggleStar={() => toggleCollectionStar(collection.id)}
                          onSortAZ={() => sortTabsInCollection(collection.id)}
                          onMove={(workspaceId, spaceId) => {
                            moveCollectionToSpace(collection.id, workspaceId, spaceId);
                            setMoveNotice({
                              message: locale === "en" ? "Collection moved" : "集合已移動",
                              workspaceId,
                              spaceId,
                              collectionId: collection.id,
                            });
                          }}
                          onExport={() => handleExportCollection(collection.id, collection.name)}
                          onInvite={() => handleOpenCollectionInvite(collection.id)}
                          onDelete={() => deleteCollection(collection.id)}
                          onDropWindowTab={(tabId) => handleDropWindowTabToCollection(tabId, collection.id)}
                          onDropSavedTab={(tabId) => handleDropSavedTabToCollection(tabId, collection.id)}
                          onDragEnterDropZone={() => setDragOverCollectionId(collection.id)}
                          onDragLeaveDropZone={() => {
                            setDragOverCollectionId((prev) => (prev === collection.id ? null : prev));
                          }}
                          isDropTarget={dragOverCollectionId === collection.id}
                          starred={collection.starred ?? false}
                          workspaces={workspaces}
                          spaces={spaces}
                          activeWorkspaceId={activeWorkspaceId}
                          spaceId={collection.spaceId}
                          isActive={selectedCollectionId === collection.id}
                          onSelect={() => setSelectedCollectionId(collection.id)}
                          onToggleSelect={() =>
                            setSelectedCollectionIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(collection.id)) {
                                next.delete(collection.id);
                              } else {
                                next.add(collection.id);
                              }
                              return next;
                            })
                          }
                          selected={selectedCollectionIds.has(collection.id)}
                          collapsed={collapsedCollections[collection.id] ?? false}
                          onToggleCollapse={() => handleToggleCollectionCollapse(collection.id)}
                        >
                          <SortableContext
                            items={(tabsByCollection.get(collection.id) ?? []).map((tab) => tab.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            <div className={`mt-4 ${tabGridClass}`}>
                              {(tabsByCollection.get(collection.id) ?? []).map((tab) => (
                                <div key={tab.id} className="group/tab relative">
                                  <TabRow
                                    id={tab.id}
                                    title={tab.title}
                                    url={tab.url}
                                    {...(tab.faviconUrl ? { faviconUrl: tab.faviconUrl } : {})}
                                    ogTitle={tab.ogTitle ?? null}
                                    ogDescription={tab.ogDescription ?? null}
                                    note={tab.note ?? null}
                                    ogImage={tab.ogImage ?? null}
                                    viewMode={viewMode}
                                    onDelete={deleteTab}
                                    onUpdate={updateTab}
                                    onMove={(tabId, workspaceId, spaceId, collectionId) => {
                                      if (
                                        collectionId === tab.collectionId &&
                                        workspaceId === collection.workspaceId &&
                                        spaceId === collection.spaceId
                                      ) {
                                        return;
                                      }
                                      moveTabToCollection(tabId, collectionId);
                                      setMoveNotice({
                                        message: locale === "en" ? "Tab moved" : "分頁已移動",
                                        workspaceId,
                                        spaceId,
                                        collectionId,
                                      });
                                    }}
                                    selected={selectedTabIds.has(tab.id)}
                                    onToggleSelect={() =>
                                      setSelectedTabIds((prev) => {
                                        const next = new Set(prev);
                                        if (next.has(tab.id)) {
                                          next.delete(tab.id);
                                        } else {
                                          next.add(tab.id);
                                        }
                                        return next;
                                      })
                                    }
                                    workspaces={workspaces}
                                    spaces={spaces}
                                    collections={collections}
                                    currentWorkspaceId={collection.workspaceId}
                                    currentSpaceId={collection.spaceId}
                                    currentCollectionId={collection.id}
                                  />
                                </div>
                              ))}
                            </div>
                          </SortableContext>
                        </CollectionCard>
                      );
                    })}
                  </div>
                )}
              </SortableContext>
            </div>
            <div className="border-t border-zinc-200 bg-white/90">
              <div className="flex items-center justify-between px-6 py-3">
                <div className="text-xs font-semibold text-zinc-500">Dock</div>
                <button
                  className="flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] text-zinc-600 hover:bg-zinc-50"
                  onClick={() => setDockCollapsed((prev) => !prev)}
                >
                  {dockCollapsed ? (locale === "en" ? "Expand" : "展開") : locale === "en" ? "Collapse" : "收合"}
                  {dockCollapsed ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                </button>
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 ease-out ${
                  dockCollapsed ? "max-h-0 -translate-y-2 opacity-0" : "max-h-[220px] translate-y-0 opacity-100"
                }`}
              >
                <div
                  className={`mx-6 mb-4 flex items-end gap-4 overflow-visible rounded-[24px] border border-zinc-200 bg-white/95 px-5 py-4 shadow-lg backdrop-blur ${
                    dockDropActive ? "ring-2 ring-zinc-300" : ""
                  }`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "copy";
                    setDockDropActive(true);
                  }}
                  onDragEnter={() => setDockDropActive(true)}
                  onDragLeave={(event) => {
                    if (event.currentTarget.contains(event.relatedTarget as Node)) {
                      return;
                    }
                    setDockDropActive(false);
                  }}
                  onDrop={handleDropToDock}
                >
                  {dockSections.map((section, index) => (
                    <div key={section.id} className="flex items-end gap-4 overflow-visible">
                      {section.items.map((item) => {
                        const compact = section.id === "recent" || (section.id === "temp" && item.id !== "pin");
                        return (
                          <DockIconButton
                            key={item.id}
                            label={item.label}
                            icon={item.icon}
                            text={item.text}
                            url={item.url}
                            faviconUrl={item.faviconUrl}
                            compact={compact}
                            onClick={item.onClick}
                            onRemove={item.onRemove}
                          />
                        );
                      })}
                      {index < dockSections.length - 1 ? <div className="h-12 w-px shrink-0 bg-zinc-200" /> : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>

          <section
            className={`flex min-h-0 flex-col overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-sm ${
              rightCollapsed ? "w-[72px]" : "w-auto"
            }`}
          >
            <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-5">
              {!rightCollapsed ? (
                <div>
                  <div className="text-sm font-semibold text-zinc-500">目前瀏覽器</div>
                  <h2 className="mt-1 text-2xl font-bold">開啟分頁</h2>
                </div>
              ) : null}
              <button
                onClick={() => setRightCollapsed((prev) => !prev)}
                className="rounded-2xl bg-zinc-100 p-2 text-zinc-500"
                aria-label={rightCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {rightCollapsed ? <PanelRightOpen className="h-4 w-4" /> : <PanelRightClose className="h-4 w-4" />}
              </button>
            </div>

            {!rightCollapsed ? (
              <>
                <div className="border-b border-zinc-200 px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="rounded-full bg-zinc-900 px-3 py-1 text-xs font-medium text-white">
                      已選 {selectedWindowTabIds.size}
                    </div>
                    <button
                      className="rounded-xl bg-zinc-100 px-3 py-2 text-xs text-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={handleSaveSelectedWindowTabs}
                      disabled={selectedWindowTabIds.size === 0}
                    >
                      {locale === "en" ? "Add to collection" : "加入集合"}
                    </button>
                    <button
                      className="rounded-xl bg-zinc-100 px-3 py-2 text-xs text-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={handleAddSelectedWindowTabsToDock}
                      disabled={selectedWindowTabIds.size === 0}
                    >
                      {locale === "en" ? "Add to Dock" : "加入 Dock"}
                    </button>
                    <button
                      className="rounded-xl bg-zinc-100 px-3 py-2 text-xs text-zinc-600 disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() => setWindowMoveOpen(true)}
                      disabled={selectedWindowTabIds.size === 0}
                    >
                      {locale === "en" ? "Move to space" : "移到空間"}
                    </button>
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                  <div className="space-y-2">
                    {openTabList.length === 0 ? (
                      <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-500">
                        {locale === "en" ? "No open tabs." : "尚無開啟中的分頁"}
                      </div>
                    ) : (
                      openTabList.map((tab) => {
                        const selected = selectedWindowTabIds.has(tab.id);
                        const safeWindowTabFavicon = toSafeFaviconUrl(tab.url, tab.favIconUrl ?? null);
                        return (
                          <div
                            key={tab.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => handleOpenWindowTab(tab.id, tab.windowId)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                handleOpenWindowTab(tab.id, tab.windowId);
                              }
                            }}
                            draggable
                            onDragStart={(event) => {
                              event.dataTransfer.setData("application/x-toby-window-tab", String(tab.id));
                              event.dataTransfer.effectAllowed = "move";
                            }}
                            className={`flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition ${
                              tab.active
                                ? "border-zinc-900 bg-zinc-900 text-white"
                                : selected
                                  ? "border-zinc-400 bg-zinc-100"
                                  : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                            }`}
                          >
                            <div className="pt-1">
                              <button
                                type="button"
                                className={`flex h-4 w-4 items-center justify-center rounded border ${
                                  selected
                                    ? "border-zinc-900 bg-zinc-900 text-white"
                                    : tab.active
                                      ? "border-white/40 bg-white/10 text-white"
                                      : "border-zinc-300 bg-white text-transparent"
                                }`}
                                onClick={(event) => {
                                  event.stopPropagation();
                                  toggleWindowTabSelected(tab.id);
                                }}
                                onMouseDown={(event) => event.stopPropagation()}
                                aria-label={selected ? "取消選取" : "選取分頁"}
                              >
                                <Check className="h-3 w-3" />
                              </button>
                            </div>
                            <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${tab.active ? "bg-white/10" : "bg-white"}`}>
                              {safeWindowTabFavicon ? (
                                <img src={safeWindowTabFavicon} alt={tab.title} className="h-4 w-4 object-contain" />
                              ) : (
                                <Link2 className={`h-4 w-4 ${tab.active ? "text-white" : "text-zinc-500"}`} />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                {tab.active ? <CircleDot className="h-3.5 w-3.5 shrink-0 text-emerald-400" /> : null}
                                <div className="truncate text-sm font-medium">{tab.title}</div>
                              </div>
                              <div className={`mt-1 truncate text-xs ${tab.active ? "text-zinc-300" : "text-zinc-500"}`}>
                                {tab.url}
                              </div>
                            </div>
                            <ChevronRight className={`mt-1 h-4 w-4 shrink-0 ${tab.active ? "text-zinc-300" : "text-zinc-400"}`} />
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex min-h-0 flex-1 flex-col items-center gap-3 overflow-y-auto px-2 py-4">
                {collapsedTabIcons.map((tab) => {
                  const safeWindowTabFavicon = toSafeFaviconUrl(tab.url, tab.favIconUrl ?? null);
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleOpenWindowTab(tab.id, tab.windowId)}
                      onMouseDown={() => toggleWindowTabSelected(tab.id)}
                      className={`relative flex h-12 w-12 items-center justify-center rounded-2xl ${
                        selectedWindowTabIds.has(tab.id) ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500"
                      }`}
                    >
                      {safeWindowTabFavicon ? (
                        <img src={safeWindowTabFavicon} alt={tab.title} className="h-4 w-4 object-contain" />
                      ) : (
                        <Link2 className="h-4 w-4" />
                      )}
                      {tab.active ? <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white" /> : null}
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        </main>

        {selectedWindowTabIds.size > 0 && !rightCollapsed ? (
          <div className="fixed bottom-28 right-8 z-[998] rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between gap-4 text-sm font-semibold text-zinc-700">
              <span>拖放示意：已選 {selectedWindowTabIds.size} 個頁籤</span>
              <button
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100"
                onClick={() => setSelectedWindowTabIds(new Set())}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex gap-2 text-xs text-zinc-500">
              <span className="rounded-full bg-zinc-100 px-3 py-1.5">拖到集合</span>
              <span className="rounded-full bg-zinc-100 px-3 py-1.5">拖到 Dock</span>
              <span className="rounded-full bg-zinc-100 px-3 py-1.5">拖到空間</span>
            </div>
          </div>
        ) : null}
        {selectedCollectionIds.size > 0 || selectedWindowTabIds.size > 0 || selectedTabIds.size > 0 ? (
          <div className="fixed bottom-20 left-1/2 z-[9999] -translate-x-1/2 rounded-full border border-zinc-200 bg-white/95 px-4 py-2 text-xs text-zinc-700 shadow-xl backdrop-blur">
            <div className="flex items-center gap-4">
              {selectedCollectionIds.size > 0 ? (
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500">
                    {locale === "en"
                      ? `${selectedCollectionIds.size} ${
                          selectedCollectionIds.size === 1 ? "collection" : "collections"
                        } selected`
                      : `${selectedCollectionIds.size} 個集合 已選取`}
                  </span>
                  <button
                    className="flex items-center gap-2 text-zinc-700 hover:text-zinc-900"
                    onClick={() => setBulkMoveOpen(true)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 9l7 -7l7 7"></path>
                      <path d="M5 15l7 7l7 -7"></path>
                    </svg>
                    {t("collection.move")}
                  </button>
                  <button className="flex items-center gap-2 text-rose-500 hover:text-rose-600" onClick={handleBulkDelete}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 7h16"></path>
                      <path d="M10 11v6"></path>
                      <path d="M14 11v6"></path>
                      <path d="M6 7l1 -3h10l1 3"></path>
                      <path d="M9 7h6"></path>
                    </svg>
                    {t("collection.delete")}
                  </button>
                </div>
              ) : null}
              {selectedCollectionIds.size > 0 && (selectedWindowTabIds.size > 0 || selectedTabIds.size > 0) ? (
                <div className="h-5 w-px bg-zinc-200" />
              ) : null}
              {selectedTabIds.size > 0 ? (
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500">
                    {locale === "en"
                      ? `${selectedTabIds.size} ${selectedTabIds.size === 1 ? "tab" : "tabs"} selected`
                      : `${selectedTabIds.size} 個分頁 已選取`}
                  </span>
                  <button
                    className="flex items-center gap-2 text-zinc-700 hover:text-zinc-900"
                    onClick={() => setTabMoveOpen(true)}
                  >
                    {locale === "en" ? "Move" : "移動"}
                  </button>
                  <button
                    className="flex items-center gap-2 text-zinc-700 hover:text-zinc-900"
                    onClick={handleOpenSelectedTabs}
                  >
                    {t("tab.openSelected")}
                  </button>
                  <button
                    className="flex items-center gap-2 text-rose-500 hover:text-rose-600"
                    onClick={handleDeleteSelectedTabs}
                  >
                    {t("tab.delete")}
                  </button>
                </div>
              ) : null}
              {(selectedCollectionIds.size > 0 || selectedTabIds.size > 0) && selectedWindowTabIds.size > 0 ? (
                <div className="h-5 w-px bg-zinc-200" />
              ) : null}
              {selectedWindowTabIds.size > 0 ? (
                <div className="flex items-center gap-3">
                  <span className="text-zinc-500">
                    {t("right.selected")} {selectedWindowTabIds.size}
                  </span>
                  <button
                    className="flex items-center gap-2 text-zinc-700 hover:text-zinc-900"
                    onClick={handleOpenSelectedWindowTabs}
                  >
                    {t("right.openSelected")}
                  </button>
                  <button
                    className="flex items-center gap-2 text-zinc-700 hover:text-zinc-900"
                    onClick={handleSaveSelectedWindowTabs}
                  >
                    {t("right.saveSelected")}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
          <PricingModal
            open={pricingOpen}
            onClose={() => setPricingOpen(false)}
            onSelectPlan={(planId) => {
            void handleStartCheckout(planId);
            setPricingOpen(false);
          }}
          />
        {bulkMoveOpen ? (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={() => setBulkMoveOpen(false)}>
            <div className="modal-enter w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
              <div className="text-sm font-semibold">{t("collection.moveTitle")}</div>
              <div className="mt-3 space-y-3 text-xs">
                <label className="block">
                  <div className="mb-1 text-zinc-500">{t("collection.moveWorkspace")}</div>
                  <SelectMenu
                    value={bulkMoveWorkspaceId}
                    onChange={(value) => setBulkMoveWorkspaceId(value)}
                    options={workspaces.map((workspace) => ({ value: workspace.id, label: workspace.name }))}
                    label={t("collection.moveWorkspace")}
                    searchable
                    searchPlaceholder="搜尋組織"
                  />
                </label>
                <label className="block">
                  <SelectMenu
                    value={bulkMoveSpaceId}
                    onChange={(value) => setBulkMoveSpaceId(value)}
                    options={bulkMoveSpaces.map((space) => ({ value: space.id, label: space.name }))}
                    label={t("collection.moveSpace")}
                    searchable
                    searchPlaceholder="搜尋空間"
                  />
                </label>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button className="rounded-lg border border-zinc-200 px-3 py-2 text-xs" onClick={() => setBulkMoveOpen(false)}>
                  {t("tab.cancel")}
                </button>
                <button className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white" onClick={handleBulkMove}>
                  {t("tab.save")}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {windowMoveOpen ? (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={() => setWindowMoveOpen(false)}>
            <div className="modal-enter w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
              <div className="text-sm font-semibold">{locale === "en" ? "Move tabs to space" : "移動分頁到空間"}</div>
              <div className="mt-3 space-y-3 text-xs">
                <label className="block">
                  <div className="mb-1 text-zinc-500">{locale === "en" ? "Collection name" : "集合名稱"}</div>
                  <input
                    className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                    value={windowMoveName}
                    onChange={(event) => setWindowMoveName(event.target.value)}
                  />
                </label>
                <label className="block">
                  <div className="mb-1 text-zinc-500">{locale === "en" ? "Organization" : "組織"}</div>
                  <SelectMenu
                    value={windowMoveWorkspaceId}
                    onChange={(value) => setWindowMoveWorkspaceId(value)}
                    options={workspaces.map((workspace) => ({ value: workspace.id, label: workspace.name }))}
                    label={locale === "en" ? "Organization" : "組織"}
                    searchable
                    searchPlaceholder={locale === "en" ? "Search organizations" : "搜尋組織"}
                  />
                </label>
                <label className="block">
                  <div className="mb-1 text-zinc-500">{locale === "en" ? "Space" : "空間"}</div>
                  <SelectMenu
                    value={windowMoveSpaceId}
                    onChange={(value) => setWindowMoveSpaceId(value)}
                    options={windowMoveSpaces.map((space) => ({ value: space.id, label: space.name }))}
                    label={locale === "en" ? "Space" : "空間"}
                    searchable
                    searchPlaceholder={locale === "en" ? "Search spaces" : "搜尋空間"}
                  />
                </label>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button className="rounded-lg border border-zinc-200 px-3 py-2 text-xs" onClick={() => setWindowMoveOpen(false)}>
                  {t("tab.cancel")}
                </button>
                <button className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white" onClick={handleMoveSelectedWindowTabsToSpace}>
                  {t("tab.save")}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {dedupeOpen ? (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={() => setDedupeOpen(false)}>
            <div className="modal-enter h-[90vh] w-[90vw] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
                <div className="text-sm font-semibold">{locale === "en" ? "Remove duplicates" : "移除重複分頁"}</div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded border border-zinc-200 px-2 py-1 text-[11px] text-zinc-700 hover:text-zinc-900"
                    onClick={() => {
                      const next = new Set<string>();
                      duplicateGroups.forEach((group) => {
                        if (group.items[0]) {
                          next.add(group.items[0].tabId);
                        }
                      });
                      setDedupeKeepIds(next);
                    }}
                  >
                    {locale === "en" ? "Keep newest" : "每組留最新"}
                  </button>
                  <button
                    className="rounded border border-zinc-200 px-2 py-1 text-[11px] text-zinc-700 hover:text-zinc-900"
                    onClick={() => {
                      const next = new Set<string>();
                      duplicateGroups.forEach((group) => {
                        const last = group.items[group.items.length - 1];
                        if (last) {
                          next.add(last.tabId);
                        }
                      });
                      setDedupeKeepIds(next);
                    }}
                  >
                    {locale === "en" ? "Keep oldest" : "每組留最舊"}
                  </button>
                  <button
                    className="rounded border border-zinc-200 px-2 py-1 text-[11px] text-zinc-700 hover:text-zinc-900"
                    onClick={() => {
                      const next = new Set<string>();
                      duplicateGroups.forEach((group) => {
                        group.items.forEach((item) => next.add(item.tabId));
                      });
                      setDedupeKeepIds(next);
                    }}
                  >
                    {locale === "en" ? "Select all" : "全選"}
                  </button>
                  <button
                    className="rounded border border-zinc-200 px-2 py-1 text-[11px] text-zinc-700 hover:text-zinc-900"
                    onClick={() => setDedupeKeepIds(new Set())}
                  >
                    {locale === "en" ? "Clear" : "清空"}
                  </button>
                  <button className="text-zinc-500 hover:text-zinc-700" onClick={() => setDedupeOpen(false)}>✕</button>
                </div>
              </div>
              <div className="h-[calc(90vh-120px)] overflow-y-auto px-6 py-4 text-xs text-zinc-700 scrollbar-hide">
                <div className="mb-4 flex items-center gap-2">
                  <input
                    className="w-full rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700"
                    placeholder={locale === "en" ? "Search duplicates" : "搜尋重複分頁"}
                    value={dedupeQuery}
                    onChange={(event) => setDedupeQuery(event.target.value)}
                  />
                </div>
                {filteredDuplicateGroups.length === 0 ? (
                  <div className="text-zinc-500">{locale === "en" ? "No duplicates found in this space." : "此空間沒有重複分頁。"}</div>
                ) : (
                  <div className="space-y-6">
                    {filteredDuplicateGroups.map((group) => (
                      <div key={group.url} className="rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                        <div className="text-xs text-zinc-500">{group.url}</div>
                        <div className="mt-3 space-y-2">
                          {group.items.map((item) => (
                            <label key={item.tabId} className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                className={checkboxClass}
                                checked={dedupeKeepIds.has(item.tabId)}
                                onChange={(event) => {
                                  setDedupeKeepIds((prev) => {
                                    const next = new Set(prev);
                                    if (event.target.checked) {
                                      next.add(item.tabId);
                                    } else {
                                      next.delete(item.tabId);
                                    }
                                    return next;
                                  });
                                }}
                              />
                              <div className="min-w-0 flex-1">
                                <div className="truncate">{item.title}</div>
                                <div className="truncate text-[10px] text-zinc-400">{item.collectionName}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-zinc-200 px-6 py-4">
                <button className="rounded-lg border border-zinc-200 px-3 py-2 text-xs" onClick={() => setDedupeOpen(false)}>
                  {t("tab.cancel")}
                </button>
                <button className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white" onClick={handleApplyDedupe}>
                  {locale === "en" ? "Delete unselected" : "刪除未選取"}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {moveNotice ? (
          <div className="fixed left-1/2 top-6 z-[9999] -translate-x-1/2 rounded-full border border-zinc-200 bg-white/95 px-5 py-2 text-sm text-zinc-700 shadow-xl backdrop-blur">
            <div className="flex items-center gap-3">
              <span>{moveNotice.message}</span>
              <button
                className="text-xs text-rose-300 hover:text-rose-200"
                onClick={() => {
                  setSelectedWorkspaceId(moveNotice.workspaceId);
                  setSelectedSpaceId(moveNotice.spaceId);
                  setSelectedCollectionId(moveNotice.collectionId);
                  setMoveNotice(null);
                }}
              >
                {locale === "en" ? "Jump" : "跳轉"}
              </button>
              <button className="text-zinc-400 hover:text-zinc-700" onClick={() => setMoveNotice(null)}>✕</button>
            </div>
          </div>
        ) : null}
        {tabMoveOpen ? (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={() => setTabMoveOpen(false)}>
            <div className="modal-enter w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
              <div className="text-sm font-semibold">{locale === "en" ? "Move tabs" : "移動分頁"}</div>
              <div className="mt-3 space-y-3 text-xs">
                <label className="block">
                  <div className="mb-1 text-zinc-500">{locale === "en" ? "Organization" : "組織"}</div>
                  <SelectMenu
                    value={tabMoveWorkspaceId}
                    onChange={(value) => setTabMoveWorkspaceId(value)}
                    options={workspaces.map((workspace) => ({ value: workspace.id, label: workspace.name }))}
                    label={locale === "en" ? "Organization" : "組織"}
                    searchable
                    searchPlaceholder={locale === "en" ? "Search organizations" : "搜尋組織"}
                  />
                </label>
                <label className="block">
                  <SelectMenu
                    value={tabMoveSpaceId}
                    onChange={(value) => setTabMoveSpaceId(value)}
                    options={tabMoveSpaces.map((space) => ({ value: space.id, label: space.name }))}
                    label={locale === "en" ? "Space" : "空間"}
                    searchable
                    searchPlaceholder={locale === "en" ? "Search spaces" : "搜尋空間"}
                  />
                </label>
                <label className="block">
                  <SelectMenu
                    value={tabMoveCollectionId}
                    onChange={(value) => setTabMoveCollectionId(value)}
                    options={tabMoveCollections.map((collection) => ({ value: collection.id, label: collection.name }))}
                    label={locale === "en" ? "Collection" : "集合"}
                    searchable
                    searchPlaceholder={locale === "en" ? "Search collections" : "搜尋集合"}
                  />
                </label>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button className="rounded-lg border border-zinc-200 px-3 py-2 text-xs" onClick={() => setTabMoveOpen(false)}>
                  {t("tab.cancel")}
                </button>
                <button className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white" onClick={handleMoveSelectedTabs}>
                  {t("tab.save")}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {collectionInviteOpen ? (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={() => setCollectionInviteOpen(false)}>
            <div className="modal-enter w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
              <div className="text-sm font-semibold">{locale === "en" ? "Invite to collection" : "邀請加入集合"}</div>
              <div className="mt-3 space-y-3 text-xs">
                <div className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs">
                  {collections.find((collection) => collection.id === collectionInviteId)?.name ?? t("app.loading")}
                </div>
                <button className="rounded-lg border border-zinc-200 px-3 py-2 text-xs" onClick={handleCreateCollectionInvite}>
                  {locale === "en" ? "Create invite link" : "建立邀請連結"}
                </button>
                {collectionInviteLink ? (
                  <div className="space-y-2">
                    <div className="text-[11px] text-zinc-500">{locale === "en" ? "Invite link" : "邀請連結"}</div>
                    <div className="flex items-center gap-2">
                      <input
                        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700"
                        value={collectionInviteLink}
                        readOnly
                      />
                      <button
                        className="rounded border border-zinc-200 px-2 py-2 text-xs"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(collectionInviteLink);
                            setCollectionInviteStatus(locale === "en" ? "Copied" : "已複製");
                          } catch {
                            // ignore
                          }
                        }}
                      >
                        {t("org.link.copy")}
                      </button>
                    </div>
                  </div>
                ) : null}
                {collectionInviteStatus ? <div className="text-xs text-zinc-500">{collectionInviteStatus}</div> : null}
              </div>
              <div className="mt-4 flex justify-end">
                <button className="rounded-lg border border-zinc-200 px-3 py-2 text-xs" onClick={() => setCollectionInviteOpen(false)}>
                  {t("tab.cancel")}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {orgSettingsOpen ? (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4" onClick={() => setOrgSettingsOpen(false)}>
            <div className="modal-enter w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{t("org.settings.title")}</div>
                <button className="text-zinc-500 hover:text-zinc-700" onClick={() => setOrgSettingsOpen(false)}>✕</button>
              </div>
              <div className="mt-4 flex items-center gap-2 border-b border-zinc-200 pb-3 text-xs">
                <button
                  className={`rounded-full px-3 py-1 ${orgSettingsTab === "preferences" ? "bg-rose-500 text-white" : "text-zinc-600 hover:text-zinc-900"}`}
                  onClick={() => setOrgSettingsTab("preferences")}
                >
                  {t("org.settings.preferences")}
                </button>
                <button
                  className={`rounded-full px-3 py-1 ${orgSettingsTab === "members" ? "bg-rose-500 text-white" : "text-zinc-600 hover:text-zinc-900"}`}
                  onClick={() => setOrgSettingsTab("members")}
                >
                  {t("org.settings.members")}
                </button>
              </div>

              {orgSettingsTab === "preferences" ? (
                <div className="mt-5 grid gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-zinc-200 text-sm">
                      {orgLogoDraft ? (
                        <img src={orgLogoDraft} alt="logo" className="h-full w-full object-cover" />
                      ) : (
                        <span>{workspace?.name?.slice(0, 2).toUpperCase() ?? "OO"}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="rounded border border-zinc-200 px-3 py-2 text-xs hover:bg-zinc-50">
                        {t("org.settings.logo")}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              handleOrgLogoChange(file);
                            }
                          }}
                        />
                      </label>
                      <button
                        className="rounded border border-zinc-200 px-3 py-2 text-xs hover:bg-zinc-50"
                        onClick={() => setOrgLogoDraft(null)}
                      >
                        {t("auth.clear")}
                      </button>
                    </div>
                  </div>

                  <label className="block">
                    <div className="mb-1 text-zinc-500">{t("org.settings.name")}</div>
                    <input
                      className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                      value={orgNameDraft}
                      onChange={(event) => setOrgNameDraft(event.target.value)}
                    />
                  </label>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded border border-zinc-200 px-3 py-2 text-xs hover:bg-zinc-50"
                        onClick={() => importFileRef.current?.click()}
                      >
                        {t("org.settings.import")}
                      </button>
                      <input
                        ref={importFileRef}
                        type="file"
                        accept="application/json"
                        className="hidden"
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) {
                            handleImportSnapshot(file);
                          }
                        }}
                      />
                    </div>
                    <button
                      className="rounded bg-rose-500 px-3 py-2 text-xs font-semibold text-white"
                      onClick={handleSaveOrgSettings}
                    >
                      {t("org.settings.save")}
                    </button>
                  </div>
                  {orgStatus ? <div className="text-xs text-zinc-500">{orgStatus}</div> : null}

                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
                    <div className="text-xs font-semibold text-rose-300">{t("org.settings.delete")}</div>
                    <div className="mt-2 text-xs text-zinc-500">{t("org.settings.deleteHint")}</div>
                    <input
                      className="mt-3 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                      placeholder={t("org.settings.deletePlaceholder")}
                      value={deleteConfirmName}
                      onChange={(event) => setDeleteConfirmName(event.target.value)}
                    />
                    <div className="mt-3 flex justify-end">
                      <button
                        className="rounded border border-rose-500 px-3 py-2 text-xs text-rose-300 disabled:opacity-40"
                        disabled={!workspace || deleteConfirmName.trim() !== (workspace?.name ?? "")}
                        onClick={handleDeleteWorkspace}
                      >
                        {t("org.settings.delete")}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-5 grid gap-4">
                  <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="text-xs font-semibold">{t("org.link.title")}</div>
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <button
                        className={`rounded-full px-3 py-1 ${
                          linkAccess === "restricted" ? "bg-rose-500 text-white" : "text-zinc-600 hover:text-zinc-900"
                        }`}
                        onClick={() => handleToggleLinkAccess("restricted")}
                      >
                        {t("org.link.restricted")}
                      </button>
                      <button
                        className={`rounded-full px-3 py-1 ${
                          linkAccess === "link" ? "bg-rose-500 text-white" : "text-zinc-600 hover:text-zinc-900"
                        }`}
                        onClick={() => handleToggleLinkAccess("link")}
                      >
                        {t("org.link.anyone")}
                      </button>
                      <div className="ml-auto w-44">
                        <SelectMenu
                          value={linkRole}
                          onChange={(value) => setLinkRole(value as "view" | "edit")}
                          options={[
                            { value: "view", label: t("share.permission.view"), group: "權限" },
                            { value: "edit", label: t("share.permission.edit"), group: "權限" },
                          ]}
                          size="sm"
                          buttonClassName={!canManageMembers ? "opacity-50 pointer-events-none" : ""}
                        />
                      </div>
                    </div>
                    {linkToken ? (
                      <div className="mt-3 flex items-center gap-2">
                        <div className="text-[11px] text-zinc-500">{t("org.link.url")}</div>
                        <input
                          className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700"
                          value={`${effectiveSupabaseUrl}/functions/v1/share?token=${linkToken}`}
                          readOnly
                        />
                        <button
                          className="rounded border border-zinc-200 px-2 py-2 text-xs"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(
                                `${effectiveSupabaseUrl}/functions/v1/share?token=${linkToken}`
                              );
                              setLinkStatus(t("org.link.copied"));
                            } catch {
                              // ignore
                            }
                          }}
                        >
                          {t("org.link.copy")}
                        </button>
                      </div>
                    ) : null}
                    {linkStatus ? <div className="mt-2 text-xs text-zinc-500">{linkStatus}</div> : null}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold">{t("org.members.list")}</div>
                    <input
                      className="w-64 rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                      placeholder={t("org.members.search")}
                      value={memberSearch}
                      onChange={(event) => setMemberSearch(event.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                    <div className="text-xs font-semibold">{t("org.members.add")}</div>
                    {!canManageMembers ? (
                      <div className="text-xs text-rose-300">{t("org.members.noPermission")}</div>
                    ) : null}
                    <div className="text-[11px] text-zinc-500">
                      {t("org.members.reward")}
                      <span className="ml-2 text-zinc-700">{workspace?.inviteCount ?? 0}</span>
                      <span className="ml-1">{t("org.members.invites")}</span>
                      <span className="ml-3 text-zinc-700">{workspace?.points ?? 0}</span>
                      <span className="ml-1">{t("org.members.points")}</span>
                    </div>
                    <div className="grid grid-cols-[1fr_1fr_200px_auto] gap-2">
                      <input
                        className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                        placeholder={t("org.members.name")}
                        value={memberName}
                        onChange={(event) => setMemberName(event.target.value)}
                      />
                      <input
                        className="rounded-md border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                        placeholder={t("org.members.email")}
                        value={memberEmail}
                        onChange={(event) => setMemberEmail(event.target.value)}
                      />
                      <SelectMenu
                        value={memberRole}
                        onChange={(value) => setMemberRole(value as MemberRole)}
                        options={memberRoleOptions}
                      />
                      <button
                        className="rounded bg-rose-500 px-3 py-2 text-xs font-semibold text-white disabled:opacity-40"
                        onClick={handleAddMember}
                        disabled={!canManageMembers}
                      >
                        {t("org.members.add")}
                      </button>
                    </div>
                    {memberStatus ? <div className="text-xs text-zinc-500">{memberStatus}</div> : null}
                  </div>

                  <div className="rounded-xl border border-zinc-200 bg-zinc-50">
                    <div className="grid grid-cols-[1fr_1fr_200px_80px] gap-3 border-b border-zinc-200 px-4 py-2 text-[11px] text-zinc-400">
                      <span>{t("org.members.name")}</span>
                      <span>{t("org.members.email")}</span>
                      <span>{t("org.members.role")}</span>
                      <span></span>
                    </div>
                    <div className="max-h-64 overflow-y-auto scrollbar-hide">
                      {membersLoading ? (
                        <div className="px-4 py-4 text-xs text-zinc-500">{t("app.loading")}</div>
                      ) : filteredMembers.length === 0 ? (
                        <div className="px-4 py-4 text-xs text-zinc-500">{t("org.members.empty")}</div>
                      ) : (
                        filteredMembers.map((member) => (
                          <div key={member.id} className="grid grid-cols-[1fr_1fr_200px_80px] items-center gap-3 border-b border-zinc-200/70 px-4 py-3 text-xs text-zinc-700">
                            <span className="truncate">{member.name}</span>
                            <span className="truncate text-zinc-500">{member.email}</span>
                            <SelectMenu
                              value={member.role}
                              onChange={(value) =>
                                handleUpdateMemberRole(
                                  member.id,
                                  value as "owner" | "admin" | "editor" | "commenter" | "viewer"
                                )
                              }
                              options={memberRoleOptions}
                              size="sm"
                              buttonClassName={!canManageMembers ? "opacity-50 pointer-events-none" : ""}
                            />
                            <button
                              className="rounded border border-zinc-200 px-2 py-1 text-[11px] text-rose-300 hover:bg-zinc-50 disabled:opacity-40"
                              onClick={() => handleRemoveMember(member.id)}
                              disabled={!canManageMembers}
                            >
                              {t("tab.delete")}
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </DndContext>
    </div>
  );
}
