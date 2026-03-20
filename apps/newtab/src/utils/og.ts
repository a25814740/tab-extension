export type OgMetadata = {
  title?: string;
  description?: string;
  image?: string;
};

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

export async function fetchOgMetadata(url: string, timeoutMs = 6000): Promise<OgMetadata | null> {
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
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
      undefined;
    const ogDescription =
      doc.querySelector(META_SELECTORS.ogDescription)?.getAttribute("content") ??
      doc.querySelector(META_SELECTORS.description)?.getAttribute("content") ??
      undefined;
    const ogImageRaw = doc.querySelector(META_SELECTORS.ogImage)?.getAttribute("content") ?? undefined;
    const ogImage = normalizeUrl(url, ogImageRaw) ?? undefined;
    return {
      title: ogTitle?.trim() || undefined,
      description: ogDescription?.trim() || undefined,
      image: ogImage?.trim() || undefined,
    };
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeout);
  }
}
