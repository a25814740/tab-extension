export type DuplicateCandidateTab = {
  id: number;
  url: string;
  active?: boolean;
  pinned?: boolean;
  lastAccessed?: number;
};

export type DuplicateTabGroup<T extends DuplicateCandidateTab> = {
  key: string;
  keep: T;
  /** Older copies that are safe to close (never pinned, never the kept tab). */
  close: T[];
  tabs: T[];
};

/**
 * Normalizes a URL for duplicate matching: lowercases scheme/host, drops a
 * trailing slash and an empty "#". Query and hash are kept so different SPA
 * views (e.g. mail #inbox vs #sent) are not treated as duplicates.
 */
export function normalizeTabUrl(raw: string): string {
  try {
    const url = new URL(raw);
    let pathname = url.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.replace(/\/+$/, "");
    }
    const hash = url.hash === "#" ? "" : url.hash;
    return `${url.protocol}//${url.host.toLowerCase()}${pathname}${url.search}${hash}`;
  } catch {
    return raw.trim();
  }
}

function rankForKeeping(tab: DuplicateCandidateTab) {
  return [tab.active ? 1 : 0, tab.pinned ? 1 : 0, tab.lastAccessed ?? 0, tab.id] as const;
}

function compareKeepPriority(a: DuplicateCandidateTab, b: DuplicateCandidateTab) {
  const ra = rankForKeeping(a);
  const rb = rankForKeeping(b);
  for (let i = 0; i < ra.length; i += 1) {
    if (ra[i] !== rb[i]) {
      return rb[i] - ra[i];
    }
  }
  return 0;
}

/**
 * Groups tabs that point at the same page. In each group the tab to keep is the
 * active one, else a pinned one, else the most recently used (falling back to
 * the newest tab id). Pinned tabs are never offered for closing.
 */
export function findDuplicateTabGroups<T extends DuplicateCandidateTab>(tabs: T[]): DuplicateTabGroup<T>[] {
  const byKey = new Map<string, T[]>();
  for (const tab of tabs) {
    if (!tab.url) {
      continue;
    }
    const key = normalizeTabUrl(tab.url);
    const list = byKey.get(key);
    if (list) {
      list.push(tab);
    } else {
      byKey.set(key, [tab]);
    }
  }

  const groups: DuplicateTabGroup<T>[] = [];
  byKey.forEach((list, key) => {
    if (list.length < 2) {
      return;
    }
    const sorted = [...list].sort(compareKeepPriority);
    const keep = sorted[0] as T;
    const close = sorted.slice(1).filter((tab) => !tab.pinned && !tab.active);
    groups.push({ key, keep, close, tabs: sorted });
  });
  return groups;
}
