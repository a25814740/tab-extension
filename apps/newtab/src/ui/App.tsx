import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SectionTitle } from "@toby/shared-ui";
import { getAllWindowsWithTabs, openTabs, focusTab, closeTabs, getLocal, setLocal } from "@toby/chrome-adapters";
import { useAppStore, useLocalCacheSync } from "../store/appStore";
import { Tree } from "./Tree";
import { CollectionCard } from "./CollectionCard";
import { TabRow } from "./TabRow";
import { createRuleBasedProvider } from "@toby/ai";
import { AuthMiniPanel } from "./AuthPanel";
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
import { fetchOgMetadata } from "../utils/og";
import { SelectMenu } from "./SelectMenu";
import { manualDriveSync, startupDriveSync } from "../sync/driveSync";
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

type MemberRole = "owner" | "admin" | "editor" | "commenter" | "viewer";
type AddCollectionAction = "blank" | "current-window" | "selected-tabs";

export function App() {
  useLocalCacheSync();
  const toWindowTab = (tab: { id: number; title: string; url: string; favIconUrl?: string }) => {
    const item: { id: number; title: string; url: string; favIconUrl?: string } = {
      id: tab.id,
      title: tab.title,
      url: tab.url,
    };
    if (typeof tab.favIconUrl === "string") {
      item.favIconUrl = tab.favIconUrl;
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
  const addCollection = useAppStore((state) => state.addCollection);
  const setSelectedWorkspaceId = useAppStore((state) => state.setSelectedWorkspaceId);
  const setSelectedSpaceId = useAppStore((state) => state.setSelectedSpaceId);
  const setSelectedCollectionId = useAppStore((state) => state.setSelectedCollectionId);
  const updateTabMetadata = useAppStore((state) => state.updateTabMetadata);
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
  const viewMode = useAppStore((state) => state.cache.ui.viewMode);
  const sortMode = useAppStore((state) => state.cache.ui.sortMode);
  const setViewMode = useAppStore((state) => state.setViewMode);
  const setSortMode = useAppStore((state) => state.setSortMode);
  const reorderSpaces = useAppStore((state) => state.reorderSpaces);
  const reorderCollections = useAppStore((state) => state.reorderCollections);
  const reorderCollectionsWithIndex = useAppStore((state) => state.reorderCollectionsWithIndex);
  const reorderFolders = useAppStore((state) => state.reorderFolders);
  const reorderTabs = useAppStore((state) => state.reorderTabs);
  const reorderTabsWithIndex = useAppStore((state) => state.reorderTabsWithIndex);
  const expandedFolderIds = useAppStore((state) => state.cache.expandedFolderIds);
  const selectedSpaceId = useAppStore((state) => state.cache.selectedSpaceId);
  const selectedWorkspaceId = useAppStore((state) => state.cache.selectedWorkspaceId);
  const toggleFolderExpanded = useAppStore((state) => state.toggleFolderExpanded);
  const expandFolder = useAppStore((state) => state.expandFolder);
  const tabs = useAppStore((state) => state.tabs);
  const selectedCollectionId = useAppStore((state) => state.cache.selectedCollectionId ?? null);
  const [overId, setOverId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTabIds, setSelectedTabIds] = useState<Set<string>>(new Set());
  const [selectedWindowTabIds, setSelectedWindowTabIds] = useState<Set<number>>(new Set());
  const [selectedCollectionIds, setSelectedCollectionIds] = useState<Set<string>>(new Set());
  const [bulkMoveOpen, setBulkMoveOpen] = useState(false);
  const [bulkMoveWorkspaceId, setBulkMoveWorkspaceId] = useState("");
  const [bulkMoveSpaceId, setBulkMoveSpaceId] = useState("");
  const [tabMoveOpen, setTabMoveOpen] = useState(false);
  const [tabMoveWorkspaceId, setTabMoveWorkspaceId] = useState("");
  const [tabMoveSpaceId, setTabMoveSpaceId] = useState("");
  const [tabMoveCollectionId, setTabMoveCollectionId] = useState("");
  const [dedupeOpen, setDedupeOpen] = useState(false);
  const [dedupeKeepIds, setDedupeKeepIds] = useState<Set<string>>(new Set());
  const [dedupeQuery, setDedupeQuery] = useState("");
  const [draggingWindowTabId, setDraggingWindowTabId] = useState<number | null>(null);
  const [dragOverCollectionId, setDragOverCollectionId] = useState<string | null>(null);
  const [moveNotice, setMoveNotice] = useState<{
    message: string;
    workspaceId: string;
    spaceId: string;
    collectionId: string;
  } | null>(null);
  const [collapsedCollections, setCollapsedCollections] = useState<Record<string, boolean>>({});
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [addCollectionMode, setAddCollectionMode] = useState<AddCollectionAction>("blank");
  const saveCollectionFromTabs = useAppStore((state) => state.saveCollectionFromTabs);
  const [windowGroups, setWindowGroups] = useState<
    Array<{ id: number; title: string; tabs: Array<{ id: number; title: string; url: string; favIconUrl?: string }> }>
  >([]);
  const [collapsedWindows, setCollapsedWindows] = useState<Record<number, boolean>>({});
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
  const importFileRef = useRef<HTMLInputElement | null>(null);
  const checkboxClass =
    "h-4 w-4 rounded border-slate-600 bg-slate-900 text-rose-400 focus:ring-rose-500/40";
  const pulledWorkspacesRef = useRef<Set<string>>(new Set());
  const AUTH_USER_KEY = "toby_auth_user_v1";

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
  const scopedFolders = useMemo(
    () => (activeWorkspaceId ? folders.filter((folder) => folder.workspaceId === activeWorkspaceId) : []),
    [activeWorkspaceId, folders]
  );
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

  const tabMoveSpaces = useMemo(
    () => spaces.filter((space) => space.workspaceId === tabMoveWorkspaceId),
    [spaces, tabMoveWorkspaceId]
  );
  const tabMoveCollections = useMemo(
    () => collections.filter((collection) => collection.spaceId === tabMoveSpaceId),
    [collections, tabMoveSpaceId]
  );

  const addCollectionOptions = useMemo(
    () => [
      {
        value: "blank",
        label: locale === "en" ? "Blank collection" : "空白集合",
        group: locale === "en" ? "Add collection" : "新增集合",
      },
      {
        value: "current-window",
        label: locale === "en" ? "From current window" : "從目前視窗",
        group: locale === "en" ? "Add collection" : "新增集合",
      },
      {
        value: "selected-tabs",
        label: locale === "en" ? "From selected tabs" : "從已選分頁",
        group: locale === "en" ? "Add collection" : "新增集合",
      },
    ],
    [locale]
  );

  const tabCountByCollection = useMemo(() => {
    const map = new Map<string, number>();
    scopedTabs.forEach((tab) => {
      map.set(tab.collectionId, (map.get(tab.collectionId) ?? 0) + 1);
    });
    return map;
  }, [scopedTabs]);

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
      setTabMoveWorkspaceId(activeWorkspaceId);
      const firstSpace = spaces.find((space) => space.workspaceId === activeWorkspaceId);
      if (firstSpace) {
        setTabMoveSpaceId(firstSpace.id);
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

  const orgOptions = useMemo(
    () =>
      workspaces.map((item) => ({
        value: item.id,
        label: item.name,
        icon: item.logoUrl ? (
          <img src={item.logoUrl} alt={item.name} className="h-4 w-4 rounded-full object-cover" />
        ) : (
          <span className="text-[10px] font-semibold">{item.name.slice(0, 2).toUpperCase()}</span>
        ),
      })),
    [workspaces]
  );
  const activeWorkspaceValue = activeWorkspaceId ?? orgOptions[0]?.value ?? "";

  const dockSections = useMemo(
    () => [
      {
        id: "core",
        label: locale === "en" ? "Core" : "核心功能",
        items: [
          { id: "new-tab", label: locale === "en" ? "New Tab" : "新分頁", icon: "⌘" },
          { id: "collections", label: locale === "en" ? "Collections" : "集合", icon: "▦" },
          { id: "spaces", label: locale === "en" ? "Spaces" : "空間", icon: "◈" },
        ],
      },
      {
        id: "fixed",
        label: locale === "en" ? "Pinned" : "固定捷徑",
        items: [
          { id: "docs", label: locale === "en" ? "Docs" : "文件", icon: "DOC" },
          { id: "mail", label: locale === "en" ? "Mail" : "郵件", icon: "✉" },
          { id: "calendar", label: locale === "en" ? "Calendar" : "行事曆", icon: "CAL" },
        ],
      },
      {
        id: "recent",
        label: locale === "en" ? "Recent" : "最近使用",
        items: [
          { id: "recent-1", label: locale === "en" ? "Recent 1" : "最近 1", icon: "R1" },
          { id: "recent-2", label: locale === "en" ? "Recent 2" : "最近 2", icon: "R2" },
        ],
      },
      {
        id: "temp",
        label: locale === "en" ? "Stash & Settings" : "暫放 / 設定",
        items: [
          { id: "stash", label: locale === "en" ? "Stash" : "暫放", icon: "…" },
          { id: "settings", label: locale === "en" ? "Settings" : "設定", icon: "⚙" },
        ],
      },
    ],
    [locale]
  );

  const collapsedTabIcons = useMemo(
    () =>
      windowGroups
        .flatMap((window) => window.tabs.map((tab) => ({ ...tab, windowId: window.id })))
        .slice(0, 12),
    [windowGroups]
  );


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

  const ogFetchInFlight = useRef<Set<string>>(new Set());
  useEffect(() => {
    const candidates = scopedTabs.filter(
      (tab) => !tab.ogTitle || !tab.ogDescription || !tab.ogImage
    );
    if (candidates.length === 0) {
      return;
    }
    candidates.forEach((tab) => {
      if (ogFetchInFlight.current.has(tab.id)) {
        return;
      }
      ogFetchInFlight.current.add(tab.id);
      void (async () => {
        const meta = await fetchOgMetadata(tab.url);
        if (meta) {
          updateTabMetadata(tab.id, {
            ogTitle: meta.title ?? tab.ogTitle ?? null,
            ogDescription: meta.description ?? tab.ogDescription ?? null,
            ogImage: meta.image ?? tab.ogImage ?? null,
          });
        }
      })();
    });
  }, [scopedTabs, updateTabMetadata]);

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

  const toTabInput = (tab: { title: string; url: string; favIconUrl?: string }) => {
    const input: { title: string; url: string; pinned: boolean; favIconUrl?: string } = {
      title: tab.title,
      url: tab.url,
      pinned: false,
    };
    if (typeof tab.favIconUrl === "string") {
      input.favIconUrl = tab.favIconUrl;
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

  const handleAddCollectionAction = (value: AddCollectionAction) => {
    setAddCollectionMode(value);
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
    setAddCollectionMode("blank");
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

  const toggleWindowCollapse = (windowId: number) => {
    setCollapsedWindows((prev) => ({
      ...prev,
      [windowId]: !prev[windowId],
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

  const DndMonitorBridge = () => {
    // Dnd monitor must be used inside DndContext provider.
    useDndMonitor({
      onDragOver: (event) => {
        setOverId(event.over ? String(event.over.id) : null);
      },
      onDragEnd: () => setOverId(null),
      onDragCancel: () => setOverId(null),
    });
    return null;
  };

  // Layout mirrors a Toby-like information hierarchy while keeping data wiring intact.
  if (!authUser) {
    return (
      <div className="flex h-screen w-full min-w-[1280px] items-center justify-center overflow-x-auto bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-slate-100">
        <div className="w-full max-w-sm rounded border border-slate-800 bg-slate-900/70 p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500 text-lg font-semibold">
            OO
          </div>
          <div className="text-lg font-semibold">{t("login.title")}</div>
          <div className="mt-2 text-sm text-slate-400">{t("login.subtitle")}</div>
          <button
            className="mt-4 w-full rounded bg-rose-500 px-4 py-2 text-sm font-semibold text-white"
            onClick={handleGoogle}
          >
            {t("login.google")}
          </button>
          <div className="mt-3 text-xs text-slate-500">{status || t("login.required")}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full overflow-x-auto bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900 text-slate-100">
      <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
        <DndMonitorBridge />
        <main className="flex h-full min-w-[1280px]">
          {shareNotice ? (
            <div className="fixed left-1/2 top-4 z-[9999] -translate-x-1/2 rounded-full border border-slate-800 bg-slate-900/90 px-4 py-2 text-xs text-slate-200 shadow-lg backdrop-blur">
              {shareNotice}
            </div>
          ) : null}
          {upgradeNotice ? (
            <div className="fixed left-1/2 top-12 z-[9999] -translate-x-1/2 rounded-full border border-rose-700/60 bg-rose-900/60 px-4 py-2 text-xs text-rose-100 shadow-lg backdrop-blur">
              {upgradeNotice}
            </div>
          ) : null}
          {uiNotice ? (
            <div className="fixed left-1/2 top-20 z-[9999] -translate-x-1/2 rounded-full border border-slate-800 bg-slate-900/90 px-4 py-2 text-xs text-slate-100 shadow-lg backdrop-blur">
              {uiNotice}
            </div>
          ) : null}
          <aside
            className={`flex h-full flex-col border-r border-slate-800 px-4 py-4 ${
              leftCollapsed ? "w-16" : "w-72"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-wide text-slate-500">
                {leftCollapsed ? "ORG" : t("app.workspace")}
              </div>
              <button
                className="rounded border border-slate-700 px-2 py-1 text-[10px]"
                onClick={() => setLeftCollapsed((prev) => !prev)}
                aria-label={leftCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {leftCollapsed ? "»" : "«"}
              </button>
            </div>
            {leftCollapsed ? (
              <div className="mt-4 flex flex-1 flex-col items-center gap-3 overflow-y-auto scrollbar-hide">
                {workspaces.map((item) => (
                  <button
                    key={item.id}
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-semibold ${
                      item.id === activeWorkspaceId ? "bg-rose-500 text-white" : "border border-slate-700 text-slate-200"
                    }`}
                    onClick={() => setSelectedWorkspaceId(item.id)}
                    title={item.name}
                  >
                    {item.logoUrl ? (
                      <img src={item.logoUrl} alt={item.name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      item.name.slice(0, 2).toUpperCase()
                    )}
                  </button>
                ))}
                <div className="h-px w-8 bg-slate-800" />
                {scopedSpaces.map((space) => (
                  <button
                    key={space.id}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 text-[10px]"
                    title={space.name}
                    onClick={() => setSelectedSpaceId(space.id)}
                  >
                    {space.name.slice(0, 1).toUpperCase()}
                  </button>
                ))}
              </div>
            ) : (
              <>
                <div className="relative mt-4">
                  <SelectMenu
                    value={activeWorkspaceValue}
                    onChange={(value) => setSelectedWorkspaceId(value)}
                    options={orgOptions}
                    buttonClassName="pr-4"
                    searchable
                    searchPlaceholder={t("org.members.search")}
                  />
                  <div className="absolute right-2 top-[85%] -translate-y-1/2 [bottom:auto] flex items-center gap-2">
                    <button
                      className="rounded border border-slate-700 p-1 text-[10px] hover:border-rose-400"
                      onClick={handleCreateWorkspace}
                      aria-label="新增組織"
                    >
                      +
                    </button>
                    <button
                      className="rounded border border-slate-700 p-1 text-[10px] hover:border-rose-400"
                      onClick={() => setOrgSettingsOpen(true)}
                      aria-label="編輯組織"
                    >
                      ⚙
                    </button>
                    <button
                      className="rounded border border-slate-700 p-1 text-[10px] hover:border-rose-400"
                      onClick={() => {
                        setOrgSettingsTab("members");
                        setOrgSettingsOpen(true);
                      }}
                      aria-label="邀請好友"
                    >
                      👥
                    </button>
                  </div>
                </div>
                <div className="mt-5 flex min-h-0 flex-1 flex-col">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <SectionTitle title={t("app.spaces")} />
                    <button className="rounded border border-slate-700 px-2 py-1 text-xs" onClick={handleCreateSpace}>
                      +
                    </button>
                  </div>
                  <div className="mt-2 min-h-0 flex-1 overflow-y-auto scrollbar-hide">
                    <Tree
                      spaces={scopedSpaces}
                      folders={scopedFolders}
                      onSelectSpace={setSelectedSpaceId}
                      expandedFolderIds={expandedFolderIds}
                      onToggleFolder={toggleFolderExpanded}
                      onExpandFolder={expandFolder}
                      overId={overId}
                      onAddCollection={(spaceId) => {
                        setSelectedSpaceId(spaceId);
                        handleCreateCollection();
                      }}
                      onEditSpace={(spaceId) => {
                        const name = window.prompt(locale === "en" ? "Rename space (placeholder)" : "重新命名空間（示意）");
                        if (!name) {
                          return;
                        }
                        showUiNotice(locale === "en" ? "Space renamed (placeholder)" : "空間已重新命名（示意）");
                        setSelectedSpaceId(spaceId);
                      }}
                      onDeleteSpace={(spaceId) => {
                        void spaceId;
                        showUiNotice(locale === "en" ? "Delete space (placeholder)" : "刪除空間（示意）");
                      }}
                      onInviteSpace={(spaceId) => {
                        setOrgSettingsTab("members");
                        setOrgSettingsOpen(true);
                        setSelectedSpaceId(spaceId);
                      }}
                    />
                  </div>
                </div>
              </>
            )}
            <div className="mt-auto space-y-2 border-t border-slate-800/60 pt-3 text-xs text-slate-400">
              {!leftCollapsed ? <div>{t("rail.account")}</div> : null}
              <div className={`flex items-center ${leftCollapsed ? "justify-center" : "justify-between"}`}>
                <button className="rounded border border-slate-700 px-2 py-1 text-[10px]" onClick={handleSync}>
                  {leftCollapsed ? "⟳" : t("app.syncNow")}
                </button>
                {!leftCollapsed ? (
                  <button
                    className="rounded border border-slate-700 px-2 py-1 text-[10px]"
                    onClick={() => {
                      setOrgSettingsTab("preferences");
                      setOrgSettingsOpen(true);
                    }}
                  >
                    {t("sidebar.settings")}
                  </button>
                ) : null}
              </div>
              <div className={`flex items-center ${leftCollapsed ? "justify-center" : "justify-between"}`}>
                <div className="w-12">
                  <AuthMiniPanel />
                </div>
              </div>
            </div>
          </aside>

          <section className="flex h-full flex-1 flex-col px-6 py-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="text-sm text-slate-400">
                {workspace?.name ?? t("app.loading")} / {activeSpaceName}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="flex items-center gap-3 text-xs text-slate-400">
                <div className="w-44">
                  <SelectMenu
                    value={addCollectionMode}
                    onChange={(value) => handleAddCollectionAction(value as AddCollectionAction)}
                    size="sm"
                    options={addCollectionOptions}
                    showSelectedIcon={false}
                  />
                </div>
                <div className="w-40">
                  <SelectMenu
                    value={viewMode}
                    onChange={(value) => setViewMode(value)}
                    size="sm"
                    options={[
                      {
                        value: "grid",
                        label: t("toolbar.view.card"),
                        icon: (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="7" height="7" />
                            <rect x="14" y="3" width="7" height="7" />
                            <rect x="14" y="14" width="7" height="7" />
                            <rect x="3" y="14" width="7" height="7" />
                          </svg>
                        ),
                      },
                      {
                        value: "list",
                        label: t("toolbar.view.list"),
                        icon: (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="8" y1="6" x2="21" y2="6" />
                            <line x1="8" y1="12" x2="21" y2="12" />
                            <line x1="8" y1="18" x2="21" y2="18" />
                            <circle cx="4" cy="6" r="1" />
                            <circle cx="4" cy="12" r="1" />
                            <circle cx="4" cy="18" r="1" />
                          </svg>
                        ),
                      },
                      {
                        value: "compact",
                        label: t("toolbar.view.compact"),
                        icon: (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="4" y="6" width="16" height="4" />
                            <rect x="4" y="14" width="16" height="4" />
                          </svg>
                        ),
                      },
                      {
                        value: "image",
                        label: t("toolbar.view.image"),
                        icon: (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="5" width="18" height="14" rx="2" />
                            <path d="M3 15l4 -4a3 3 0 0 1 4 0l4 4" />
                            <path d="M14 13l2 -2a3 3 0 0 1 4 0l1 1" />
                            <circle cx="8" cy="9" r="1" />
                          </svg>
                        ),
                      },
                    ]}
                  />
                </div>
                <div className="w-48">
                  <SelectMenu
                    value={sortMode}
                    onChange={(value) => setSortMode(value)}
                    size="sm"
                    options={[
                      { value: "custom", label: `排序: ${t("app.sort.custom")}` },
                      { value: "recent", label: `排序: ${t("app.sort.recent")}` },
                      { value: "name", label: `排序: ${t("app.sort.name")}` },
                      { value: "createdAt", label: `排序: ${t("app.sort.createdAt")}` },
                    ]}
                  />
                </div>
              </div>
              <div className="ml-auto w-64">
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-slate-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0"></path>
                      <path d="M21 21l-6 -6"></path>
                    </svg>
                  </div>
                  <input
                    className="w-full rounded border border-slate-800 bg-slate-900/70 px-3 py-2 pl-6 text-xs text-slate-100 placeholder:text-slate-500"
                    placeholder={t("app.searchPlaceholder")}
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex-1 overflow-y-auto pr-2 scrollbar-hide">
              <SortableContext
                items={sortedCollections.map((collection) => collection.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex flex-col gap-4">
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
                        <div className={`mt-3 ${tabGridClass}`}>
                          {(tabsByCollection.get(collection.id) ?? []).map((tab) => (
                            <div key={tab.id} className="group/tab relative p-2 transition-transform duration-150 hover:-translate-y-1">
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
                                  // Only move when target differs; avoids no-op reorders.
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
              </SortableContext>
            </div>
            <div className="mt-4 text-xs text-slate-500"></div>
          </section>

          <aside
            className={`flex h-full flex-col border-l border-slate-800 px-4 py-4 ${
              rightCollapsed ? "w-16" : "w-72"
            }`}
          >
            <div className={`flex items-center ${rightCollapsed ? "justify-center" : "justify-between"}`}>
              {!rightCollapsed ? (
                <div className="text-sm font-semibold">{t("right.openTabs")}</div>
              ) : (
                <div className="text-[10px] uppercase tracking-wide text-slate-500">TAB</div>
              )}
              <button
                className="rounded border border-slate-700 px-2 py-1 text-[10px]"
                onClick={() => setRightCollapsed((prev) => !prev)}
                aria-label={rightCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {rightCollapsed ? "«" : "»"}
              </button>
            </div>
            {rightCollapsed ? (
              <div className="mt-4 flex-1 space-y-3 overflow-y-auto scrollbar-hide">
                {collapsedTabIcons.length === 0 ? (
                  <div className="text-center text-[10px] text-slate-500">0</div>
                ) : (
                  collapsedTabIcons.map((tab) => {
                    const isSelected = selectedWindowTabIds.has(tab.id);
                    return (
                      <button
                        key={tab.id}
                        className={`flex h-9 w-9 items-center justify-center rounded-lg border text-[10px] ${
                          isSelected ? "border-rose-400 text-rose-200" : "border-slate-700 text-slate-200"
                        }`}
                        title={tab.title}
                        onClick={() => handleOpenWindowTab(tab.id, tab.windowId)}
                      >
                        {tab.favIconUrl ? (
                          <img src={tab.favIconUrl} alt="icon" className="h-5 w-5 object-contain" />
                        ) : (
                          tab.title.slice(0, 2).toUpperCase()
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            ) : (
              <>
                <div className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
                  <button
                    className="rounded border border-slate-700 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => {
                      if (selectedWindowTabIds.size === 0) {
                        return;
                      }
                      handleSaveSelectedWindowTabs();
                    }}
                    disabled={selectedWindowTabIds.size === 0}
                  >
                    {locale === "en" ? "Add to collection" : "加入集合"}
                  </button>
                  <button
                    className="rounded border border-slate-700 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => {
                      if (selectedWindowTabIds.size === 0) {
                        return;
                      }
                      showUiNotice(locale === "en" ? "Added to Dock (placeholder)" : "已加入 Dock（示意）");
                      setSelectedWindowTabIds(new Set());
                    }}
                    disabled={selectedWindowTabIds.size === 0}
                  >
                    {locale === "en" ? "Add to Dock" : "加入 Dock"}
                  </button>
                  <button
                    className="rounded border border-slate-700 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => {
                      if (selectedWindowTabIds.size === 0) {
                        return;
                      }
                      showUiNotice(locale === "en" ? "Move to space (placeholder)" : "移到空間（示意）");
                    }}
                    disabled={selectedWindowTabIds.size === 0}
                  >
                    {locale === "en" ? "Move to space" : "移到空間"}
                  </button>
                </div>
                <div className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 scrollbar-hide">
                  {windowGroups.map((window) => {
                    const isCollapsed = collapsedWindows[window.id];
                    return (
                      <div key={window.id} className="rounded border border-slate-800 bg-slate-900/40 p-3">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <button onClick={() => toggleWindowCollapse(window.id)} className="flex items-center gap-2 font-semibold">
                            {window.title}
                            {isCollapsed ? (
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 15l6 -6l6 6"></path>
                              </svg>
                            ) : (
                              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 9l6 6l6 -6"></path>
                              </svg>
                            )}
                          </button>
                          <div className="flex items-center gap-2">
                            <button
                              className="rounded border border-slate-700 px-2 py-1 text-[10px]"
                              onClick={() => handleSaveWindowGroup(window.title, window.tabs)}
                            >
                              {t("right.saveWindow")}
                            </button>
                          </div>
                        </div>
                        {!isCollapsed ? (
                          <div className="mt-3 space-y-2">
                            {window.tabs.length === 0 ? (
                              <div className="text-xs text-slate-500">{t("right.emptyWindow")}</div>
                            ) : (
                              window.tabs.map((tab) => {
                                const isSelected = selectedWindowTabIds.has(tab.id);
                                return (
                                <div
                                  key={tab.id}
                                  className="group flex items-center gap-2 rounded bg-slate-900/70 px-2 py-2 text-xs text-slate-200 transition-colors hover:bg-slate-800"
                                  onClick={() => {
                                    if (draggingWindowTabId === tab.id) {
                                      return;
                                    }
                                    handleOpenWindowTab(tab.id, window.id);
                                  }}
                                  draggable
                                  onDragStart={(event) => {
                                    event.dataTransfer.setData("text/plain", String(tab.id));
                                    event.dataTransfer.setData("application/x-toby-window-tab", String(tab.id));
                                    event.dataTransfer.setData("application/x-toby-tab", String(tab.id));
                                    event.dataTransfer.effectAllowed = "move";
                                    setDraggingWindowTabId(tab.id);
                                  }}
                                  onDragEnd={() => setDraggingWindowTabId(null)}
                                >
                                    <div className={`flex h-5 w-5 items-center justify-center overflow-hidden rounded bg-slate-800 ${isSelected ? "hidden" : "group-hover:hidden"}`}>
                                      {tab.favIconUrl ? (
                                        <img src={tab.favIconUrl} alt="icon" className="h-full w-full object-contain" />
                                      ) : null}
                                    </div>
                                    <input
                                      type="checkbox"
                                      className={`${checkboxClass} ${isSelected ? "block" : "hidden group-hover:block"}`}
                                      checked={isSelected}
                                      onChange={(event) => {
                                        event.stopPropagation();
                                        setSelectedWindowTabIds((prev) => {
                                          const next = new Set(prev);
                                          if (next.has(tab.id)) {
                                            next.delete(tab.id);
                                          } else {
                                            next.add(tab.id);
                                          }
                                          return next;
                                        });
                                      }}
                                    />
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate">{tab.title}</div>
                                      <div className="truncate text-[10px] text-slate-500">{tab.url}</div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </aside>
        </main>
        <div className="fixed bottom-4 left-1/2 z-[900] w-[min(1100px,calc(100%-2rem))] -translate-x-1/2">
          <div className="flex items-center justify-center rounded-full border border-slate-800 bg-slate-900/80 px-4 py-2 text-xs text-slate-200 shadow-xl backdrop-blur">
            <div className="flex items-center gap-3 overflow-visible">
              {dockSections.map((section, index) => (
                <div key={section.id} className="flex items-center gap-3">
                  {section.items.map((item) => (
                    <button
                      key={item.id}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 text-[11px] hover:border-rose-400"
                      title={item.label}
                    >
                      {item.icon}
                    </button>
                  ))}
                  {index < dockSections.length - 1 ? <div className="h-6 w-px bg-slate-700/70" /> : null}
                </div>
              ))}
            </div>
          </div>
        </div>
        {selectedCollectionIds.size > 0 || selectedWindowTabIds.size > 0 || selectedTabIds.size > 0 ? (
          <div className="fixed bottom-20 left-1/2 z-[9999] -translate-x-1/2 rounded-full border border-slate-800/80 bg-slate-900/90 px-4 py-2 text-xs text-slate-200 shadow-xl backdrop-blur">
            <div className="flex items-center gap-4">
              {selectedCollectionIds.size > 0 ? (
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">
                    {locale === "en"
                      ? `${selectedCollectionIds.size} ${
                          selectedCollectionIds.size === 1 ? "collection" : "collections"
                        } selected`
                      : `${selectedCollectionIds.size} 個集合 已選取`}
                  </span>
                  <button
                    className="flex items-center gap-2 text-slate-200 hover:text-white"
                    onClick={() => setBulkMoveOpen(true)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 9l7 -7l7 7"></path>
                      <path d="M5 15l7 7l7 -7"></path>
                    </svg>
                    {t("collection.move")}
                  </button>
                  <button
                    className="flex items-center gap-2 text-rose-300 hover:text-rose-200"
                    onClick={handleBulkDelete}
                  >
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
                <div className="h-5 w-px bg-slate-700/80" />
              ) : null}
              {selectedTabIds.size > 0 ? (
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">
                    {locale === "en"
                      ? `${selectedTabIds.size} ${selectedTabIds.size === 1 ? "tab" : "tabs"} selected`
                      : `${selectedTabIds.size} 個分頁 已選取`}
                  </span>
                  <button
                    className="flex items-center gap-2 text-slate-200 hover:text-white"
                    onClick={() => setTabMoveOpen(true)}
                  >
                    {locale === "en" ? "Move" : "移動"}
                  </button>
                  <button
                    className="flex items-center gap-2 text-slate-200 hover:text-white"
                    onClick={handleOpenSelectedTabs}
                  >
                    {t("tab.openSelected")}
                  </button>
                  <button
                    className="flex items-center gap-2 text-rose-300 hover:text-rose-200"
                    onClick={handleDeleteSelectedTabs}
                  >
                    {t("tab.delete")}
                  </button>
                </div>
              ) : null}
              {(selectedCollectionIds.size > 0 || selectedTabIds.size > 0) && selectedWindowTabIds.size > 0 ? (
                <div className="h-5 w-px bg-slate-700/80" />
              ) : null}
              {selectedWindowTabIds.size > 0 ? (
                <div className="flex items-center gap-3">
                  <span className="text-slate-400">
                    {t("right.selected")} {selectedWindowTabIds.size}
                  </span>
                  <button
                    className="flex items-center gap-2 text-slate-200 hover:text-white"
                    onClick={handleOpenSelectedWindowTabs}
                  >
                    {t("right.openSelected")}
                  </button>
                  <button
                    className="flex items-center gap-2 text-slate-200 hover:text-white"
                    onClick={handleSaveSelectedWindowTabs}
                  >
                    {t("right.saveSelected")}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
        {bulkMoveOpen ? (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={() => setBulkMoveOpen(false)}>
            <div className="modal-enter w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
              <div className="text-sm font-semibold">{t("collection.moveTitle")}</div>
              <div className="mt-3 space-y-3 text-xs">
                <label className="block">
                  <div className="mb-1 text-slate-400">{t("collection.moveWorkspace")}</div>
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
                <button className="rounded-lg border border-slate-700 px-3 py-2 text-xs" onClick={() => setBulkMoveOpen(false)}>
                  {t("tab.cancel")}
                </button>
                <button className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white" onClick={handleBulkMove}>
                  {t("tab.save")}
                </button>
              </div>
            </div>
          </div>
        ) : null}
        {dedupeOpen ? (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={() => setDedupeOpen(false)}>
            <div className="modal-enter h-[90vh] w-[90vw] overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
                <div className="text-sm font-semibold">{locale === "en" ? "Remove duplicates" : "移除重複分頁"}</div>
                <div className="flex items-center gap-2">
                  <button
                    className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:text-white"
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
                    className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:text-white"
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
                    className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:text-white"
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
                    className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-200 hover:text-white"
                    onClick={() => setDedupeKeepIds(new Set())}
                  >
                    {locale === "en" ? "Clear" : "清空"}
                  </button>
                  <button className="text-slate-400 hover:text-slate-100" onClick={() => setDedupeOpen(false)}>✕</button>
                </div>
              </div>
              <div className="h-[calc(90vh-120px)] overflow-y-auto px-6 py-4 text-xs text-slate-200 scrollbar-hide">
                <div className="mb-4 flex items-center gap-2">
                  <input
                    className="w-full rounded border border-slate-800 bg-slate-900/60 px-3 py-2 text-xs text-slate-100"
                    placeholder={locale === "en" ? "Search duplicates" : "搜尋重複分頁"}
                    value={dedupeQuery}
                    onChange={(event) => setDedupeQuery(event.target.value)}
                  />
                </div>
                {filteredDuplicateGroups.length === 0 ? (
                  <div className="text-slate-400">{locale === "en" ? "No duplicates found in this space." : "此空間沒有重複分頁。"}</div>
                ) : (
                  <div className="space-y-6">
                    {filteredDuplicateGroups.map((group) => (
                      <div key={group.url} className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
                        <div className="text-xs text-slate-400">{group.url}</div>
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
                                <div className="truncate text-[10px] text-slate-500">{item.collectionName}</div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-2 border-t border-slate-800 px-6 py-4">
                <button className="rounded-lg border border-slate-700 px-3 py-2 text-xs" onClick={() => setDedupeOpen(false)}>
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
          <div className="fixed left-1/2 top-6 z-[9999] -translate-x-1/2 rounded-full border border-slate-800 bg-slate-900/90 px-5 py-2 text-sm text-slate-200 shadow-xl backdrop-blur">
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
              <button className="text-slate-500 hover:text-slate-100" onClick={() => setMoveNotice(null)}>✕</button>
            </div>
          </div>
        ) : null}
        {tabMoveOpen ? (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={() => setTabMoveOpen(false)}>
            <div className="modal-enter w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
              <div className="text-sm font-semibold">{locale === "en" ? "Move tabs" : "移動分頁"}</div>
              <div className="mt-3 space-y-3 text-xs">
                <label className="block">
                  <div className="mb-1 text-slate-400">{locale === "en" ? "Organization" : "組織"}</div>
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
                <button className="rounded-lg border border-slate-700 px-3 py-2 text-xs" onClick={() => setTabMoveOpen(false)}>
                  {t("tab.cancel")}
                </button>
                <button className="rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white" onClick={handleMoveSelectedTabs}>
                  {t("tab.save")}
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {orgSettingsOpen ? (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={() => setOrgSettingsOpen(false)}>
            <div className="modal-enter w-full max-w-4xl rounded-2xl border border-slate-800 bg-slate-950 p-6 shadow-xl" onClick={(event) => event.stopPropagation()}>
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">{t("org.settings.title")}</div>
                <button className="text-slate-400 hover:text-slate-100" onClick={() => setOrgSettingsOpen(false)}>✕</button>
              </div>
              <div className="mt-4 flex items-center gap-2 border-b border-slate-800 pb-3 text-xs">
                <button
                  className={`rounded-full px-3 py-1 ${orgSettingsTab === "preferences" ? "bg-rose-500 text-white" : "text-slate-300 hover:text-white"}`}
                  onClick={() => setOrgSettingsTab("preferences")}
                >
                  {t("org.settings.preferences")}
                </button>
                <button
                  className={`rounded-full px-3 py-1 ${orgSettingsTab === "members" ? "bg-rose-500 text-white" : "text-slate-300 hover:text-white"}`}
                  onClick={() => setOrgSettingsTab("members")}
                >
                  {t("org.settings.members")}
                </button>
              </div>

              {orgSettingsTab === "preferences" ? (
                <div className="mt-5 grid gap-6">
                  <div className="flex items-center gap-4">
                    <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-slate-800 text-sm">
                      {orgLogoDraft ? (
                        <img src={orgLogoDraft} alt="logo" className="h-full w-full object-cover" />
                      ) : (
                        <span>{workspace?.name?.slice(0, 2).toUpperCase() ?? "OO"}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="rounded border border-slate-700 px-3 py-2 text-xs hover:bg-slate-900/60">
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
                        className="rounded border border-slate-700 px-3 py-2 text-xs hover:bg-slate-900/60"
                        onClick={() => setOrgLogoDraft(null)}
                      >
                        {t("auth.clear")}
                      </button>
                    </div>
                  </div>

                  <label className="block">
                    <div className="mb-1 text-slate-400">{t("org.settings.name")}</div>
                    <input
                      className="w-full rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                      value={orgNameDraft}
                      onChange={(event) => setOrgNameDraft(event.target.value)}
                    />
                  </label>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button
                        className="rounded border border-slate-700 px-3 py-2 text-xs hover:bg-slate-900/60"
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
                  {orgStatus ? <div className="text-xs text-slate-400">{orgStatus}</div> : null}

                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-4">
                    <div className="text-xs font-semibold text-rose-300">{t("org.settings.delete")}</div>
                    <div className="mt-2 text-xs text-slate-400">{t("org.settings.deleteHint")}</div>
                    <input
                      className="mt-3 w-full rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
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
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                    <div className="text-xs font-semibold">{t("org.link.title")}</div>
                    <div className="mt-3 flex items-center gap-2 text-xs">
                      <button
                        className={`rounded-full px-3 py-1 ${
                          linkAccess === "restricted" ? "bg-rose-500 text-white" : "text-slate-300 hover:text-white"
                        }`}
                        onClick={() => handleToggleLinkAccess("restricted")}
                      >
                        {t("org.link.restricted")}
                      </button>
                      <button
                        className={`rounded-full px-3 py-1 ${
                          linkAccess === "link" ? "bg-rose-500 text-white" : "text-slate-300 hover:text-white"
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
                        <div className="text-[11px] text-slate-400">{t("org.link.url")}</div>
                        <input
                          className="w-full rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-100"
                          value={`${effectiveSupabaseUrl}/functions/v1/share?token=${linkToken}`}
                          readOnly
                        />
                        <button
                          className="rounded border border-slate-700 px-2 py-2 text-xs"
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
                    {linkStatus ? <div className="mt-2 text-xs text-slate-400">{linkStatus}</div> : null}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold">{t("org.members.list")}</div>
                    <input
                      className="w-64 rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                      placeholder={t("org.members.search")}
                      value={memberSearch}
                      onChange={(event) => setMemberSearch(event.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                    <div className="text-xs font-semibold">{t("org.members.add")}</div>
                    {!canManageMembers ? (
                      <div className="text-xs text-rose-300">{t("org.members.noPermission")}</div>
                    ) : null}
                    <div className="text-[11px] text-slate-400">
                      {t("org.members.reward")}
                      <span className="ml-2 text-slate-200">{workspace?.inviteCount ?? 0}</span>
                      <span className="ml-1">{t("org.members.invites")}</span>
                      <span className="ml-3 text-slate-200">{workspace?.points ?? 0}</span>
                      <span className="ml-1">{t("org.members.points")}</span>
                    </div>
                    <div className="grid grid-cols-[1fr_1fr_200px_auto] gap-2">
                      <input
                        className="rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                        placeholder={t("org.members.name")}
                        value={memberName}
                        onChange={(event) => setMemberName(event.target.value)}
                      />
                      <input
                        className="rounded-md border border-slate-800 bg-slate-900/70 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500/40"
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
                    {memberStatus ? <div className="text-xs text-slate-400">{memberStatus}</div> : null}
                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900/40">
                    <div className="grid grid-cols-[1fr_1fr_200px_80px] gap-3 border-b border-slate-800 px-4 py-2 text-[11px] text-slate-500">
                      <span>{t("org.members.name")}</span>
                      <span>{t("org.members.email")}</span>
                      <span>{t("org.members.role")}</span>
                      <span></span>
                    </div>
                    <div className="max-h-64 overflow-y-auto scrollbar-hide">
                      {membersLoading ? (
                        <div className="px-4 py-4 text-xs text-slate-400">{t("app.loading")}</div>
                      ) : filteredMembers.length === 0 ? (
                        <div className="px-4 py-4 text-xs text-slate-400">{t("org.members.empty")}</div>
                      ) : (
                        filteredMembers.map((member) => (
                          <div key={member.id} className="grid grid-cols-[1fr_1fr_200px_80px] items-center gap-3 border-b border-slate-800/60 px-4 py-3 text-xs text-slate-200">
                            <span className="truncate">{member.name}</span>
                            <span className="truncate text-slate-400">{member.email}</span>
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
                              className="rounded border border-slate-700 px-2 py-1 text-[11px] text-rose-300 hover:bg-slate-900/60 disabled:opacity-40"
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
