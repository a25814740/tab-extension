export type TabSnapshot = {
  id: number;
  title: string;
  url: string;
  favIconUrl?: string;
  pinned: boolean;
};

export async function getActiveTab(): Promise<TabSnapshot | null> {
  if (!chrome?.tabs) {
    return null;
  }

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];
  if (!tab || tab.id === undefined || !tab.url) {
    return null;
  }

  return {
    id: tab.id,
    title: tab.title ?? "Untitled",
    url: tab.url,
    favIconUrl: tab.favIconUrl,
    pinned: tab.pinned ?? false,
  };
}

export async function getCurrentWindowTabs(): Promise<TabSnapshot[]> {
  if (!chrome?.tabs) {
    return [];
  }

  const tabs = await chrome.tabs.query({ currentWindow: true });
  return tabs
    .filter((tab) => tab.id !== undefined && tab.url)
    .map((tab) => ({
      id: tab.id as number,
      title: tab.title ?? "Untitled",
      url: tab.url as string,
      favIconUrl: tab.favIconUrl,
      pinned: tab.pinned ?? false,
    }));
}

export async function openTabs(urls: string[]) {
  if (!chrome?.tabs) {
    return;
  }

  await Promise.all(urls.map((url) => chrome.tabs.create({ url })));
}