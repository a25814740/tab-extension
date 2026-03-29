export type TabSnapshot = {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
  screenshotUrl?: string | null;
  pinned: boolean;
};

export type WindowSnapshot = {
  id: number;
  title: string;
  tabs: TabSnapshot[];
};

function toTabSnapshot(tab: chrome.tabs.Tab): TabSnapshot | null {
  if (tab.id === undefined || !tab.url) {
    return null;
  }
  const snapshot: TabSnapshot = {
    id: tab.id,
    title: tab.title ?? "Untitled",
    url: tab.url,
    pinned: tab.pinned ?? false,
  };
  if (typeof tab.favIconUrl === "string") {
    snapshot.favIconUrl = tab.favIconUrl;
  }
  return snapshot;
}

export async function getActiveTab(): Promise<TabSnapshot | null> {
  if (!chrome?.tabs) {
    return null;
  }

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  return tab ? toTabSnapshot(tab) : null;
}

export async function getCurrentWindowTabs(): Promise<TabSnapshot[]> {
  if (!chrome?.tabs) {
    return [];
  }

  const tabs = await chrome.tabs.query({ currentWindow: true });
  return tabs.map((tab) => toTabSnapshot(tab)).filter((tab): tab is TabSnapshot => tab !== null);
}

export async function getAllWindowsWithTabs(): Promise<WindowSnapshot[]> {
  if (!chrome?.windows || !chrome?.tabs) {
    return [];
  }

  const windows = await chrome.windows.getAll({ populate: true });
  return windows
    .filter((window) => window.id !== undefined)
    .map((window, index) => {
      const tabs = (window.tabs ?? [])
        .map((tab) => toTabSnapshot(tab))
        .filter((tab): tab is TabSnapshot => tab !== null);
      return {
        id: window.id as number,
        title: `Window ${index + 1}`,
        tabs,
      };
    });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function canCapture(url: string) {
  return !url.startsWith("chrome://") && !url.startsWith("chrome-extension://") && !url.startsWith("edge://");
}

export async function getCurrentWindowTabsWithScreenshots(): Promise<TabSnapshot[]> {
  if (!chrome?.tabs || !chrome?.windows) {
    return [];
  }

  const currentWindow = await chrome.windows.getCurrent({ populate: true });
  const windowId = currentWindow.id;
  if (!windowId) {
    return [];
  }

  const activeTabId = currentWindow.tabs?.find((tab) => tab.active)?.id ?? null;
  const tabs = (currentWindow.tabs ?? []).filter((tab) => tab.id !== undefined && tab.url);
  const results: TabSnapshot[] = [];

  for (const tab of tabs) {
    const tabId = tab.id as number;
    let screenshotUrl: string | null = null;

    if (tab.url && canCapture(tab.url)) {
      try {
        await chrome.tabs.update(tabId, { active: true });
        await sleep(250);
        screenshotUrl = await chrome.tabs.captureVisibleTab(windowId, { format: "jpeg", quality: 60 });
      } catch {
        screenshotUrl = null;
      }
    }

    const snapshot = toTabSnapshot(tab);
    if (snapshot) {
      snapshot.screenshotUrl = screenshotUrl;
      results.push(snapshot);
    }
  }

  if (activeTabId) {
    try {
      await chrome.tabs.update(activeTabId, { active: true });
    } catch {
      // ignore restore failures
    }
  }

  return results;
}

export async function openTabs(urls: string[]) {
  if (!chrome?.tabs) {
    return;
  }

  await Promise.all(urls.map((url) => chrome.tabs.create({ url })));
}

export async function focusTab(tabId: number, windowId?: number) {
  if (!chrome?.tabs) {
    return;
  }
  try {
    await chrome.tabs.update(tabId, { active: true });
  } catch {
    // ignore
  }
  if (windowId && chrome?.windows) {
    try {
      await chrome.windows.update(windowId, { focused: true });
    } catch {
      // ignore
    }
  }
}

export async function closeTabs(tabIds: number[]) {
  if (!chrome?.tabs || tabIds.length === 0) {
    return;
  }
  try {
    await chrome.tabs.remove(tabIds);
  } catch {
    // ignore
  }
}
