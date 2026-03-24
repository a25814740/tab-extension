export type OgMetadata = {
  title?: string;
  description?: string;
  image?: string;
};

const BLOCKED_OG_HOSTS = new Set(["chromewebstore.google.com", "chrome.google.com"]);

const META_SELECTORS = {
  ogTitle: 'meta[property="og:title"]',
  ogDescription: 'meta[property="og:description"]',
  ogImage: 'meta[property="og:image"]',
  title: "title",
  description: 'meta[name="description"]',
};

function normalizeUrl(baseUrl: string, value?: string | null) {
  if (!value) {
    return null;
  }
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return value;
  }
}

export function canFetchOgMetadata(url: string) {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return false;
  }
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    if (BLOCKED_OG_HOSTS.has(hostname)) {
      return false;
    }
    if (hostname === "example.com" || hostname.endsWith(".example.com")) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function fetchOgMetadata(url: string, timeoutMs = 6000): Promise<OgMetadata | null> {
  if (!canFetchOgMetadata(url)) {
    return null;
  }

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      method: "GET",
      credentials: "omit",
      signal: controller.signal,
    });
    if (!response.ok) {
      return null;
    }
    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, "text/html");
    const ogTitle =
      doc.querySelector(META_SELECTORS.ogTitle)?.getAttribute("content") ??
      doc.querySelector(META_SELECTORS.title)?.textContent ??
      null;
    const ogDescription =
      doc.querySelector(META_SELECTORS.ogDescription)?.getAttribute("content") ??
      doc.querySelector(META_SELECTORS.description)?.getAttribute("content") ??
      null;
    const ogImageRaw = doc.querySelector(META_SELECTORS.ogImage)?.getAttribute("content") ?? null;
    const ogImage = normalizeUrl(url, ogImageRaw);
    const metadata: OgMetadata = {};
    const trimmedTitle = ogTitle?.trim() || "";
    const trimmedDescription = ogDescription?.trim() || "";
    const trimmedImage = ogImage?.trim() || "";
    if (trimmedTitle) {
      metadata.title = trimmedTitle;
    }
    if (trimmedDescription) {
      metadata.description = trimmedDescription;
    }
    if (trimmedImage) {
      metadata.image = trimmedImage;
    }
    return metadata;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}
