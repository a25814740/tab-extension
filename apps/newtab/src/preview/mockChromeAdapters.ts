export type TabSnapshot = {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
  screenshotUrl?: string | null;
  pinned: boolean;
  active?: boolean;
  lastAccessed?: number;
};

export type WindowSnapshot = {
  id: number;
  title: string;
  tabs: TabSnapshot[];
};

const localStore = new Map<string, unknown>();
const syncStore = new Map<string, unknown>();

const previewWindows: WindowSnapshot[] = [
  {
    id: 1,
    title: "Window 1",
    tabs: [
      {
        id: 11,
        title: "Design System",
        url: "https://example.com/design",
        pinned: false,
        active: true,
        lastAccessed: 3000,
      },
      {
        id: 12,
        title: "Product Metrics",
        url: "https://example.com/metrics",
        pinned: false,
      },
    ],
  },
  {
    id: 2,
    title: "Window 2",
    tabs: [
      {
        id: 21,
        title: "Release Notes",
        url: "https://example.com/release",
        pinned: false,
        lastAccessed: 2000,
      },
      {
        id: 22,
        title: "Design System",
        url: "https://example.com/design/",
        pinned: false,
        lastAccessed: 1000,
      },
    ],
  },
];

export async function getActiveTab(): Promise<TabSnapshot | null> {
  return previewWindows[0]?.tabs[0] ?? null;
}

export async function getCurrentWindowTabs(): Promise<TabSnapshot[]> {
  return previewWindows[0]?.tabs ?? [];
}

export async function getAllWindowsWithTabs(): Promise<WindowSnapshot[]> {
  return previewWindows;
}

export async function getCurrentWindowTabsWithScreenshots(): Promise<TabSnapshot[]> {
  return previewWindows[0]?.tabs ?? [];
}

export async function openTabs(_urls: string[]) {
  void _urls;
  return;
}

export async function focusTab(_tabId: number, _windowId?: number) {
  void _tabId;
  void _windowId;
  return;
}

export async function closeTabs(tabIds: number[]) {
  const ids = new Set(tabIds);
  previewWindows.forEach((win) => {
    win.tabs = win.tabs.filter((tab) => !ids.has(tab.id));
  });
}

export async function getLocal<T>(key: string, fallback: T): Promise<T> {
  if (!localStore.has(key)) {
    return fallback;
  }
  return localStore.get(key) as T;
}

export async function setLocal<T>(key: string, value: T) {
  localStore.set(key, value as unknown);
}

export async function getSync<T>(key: string, fallback: T): Promise<T> {
  if (!syncStore.has(key)) {
    return fallback;
  }
  return syncStore.get(key) as T;
}

export async function setSync<T>(key: string, value: T) {
  syncStore.set(key, value as unknown);
}

export type AuthTokenResult = {
  token: string;
  expiresAt: number;
};

export async function getAuthToken(_interactive: boolean): Promise<AuthTokenResult | null> {
  void _interactive;
  return null;
}

export function getRedirectUrl(path?: string) {
  const suffix = path ? `/${path}` : "";
  return `${window.location.origin}${suffix}`;
}

export async function launchWebAuthFlow(_url: string, _interactive = true) {
  void _url;
  void _interactive;
  return null;
}

export async function openSidePanel() {
  return;
}
