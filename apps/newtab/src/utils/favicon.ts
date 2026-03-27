function toGoogleFaviconUrl(target: URL) {
  return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(target.origin)}`;
}

function parseHttpUrl(value: string | null | undefined): URL | null {
  if (!value) {
    return null;
  }
  try {
    const parsed = new URL(value);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

export function toSafeFaviconUrl(pageUrl?: string | null, rawFaviconUrl?: string | null): string | null {
  const page = parseHttpUrl(pageUrl);
  if (page) {
    // Always proxy through Google favicon service to avoid extension CORS/CORP noise.
    return toGoogleFaviconUrl(page);
  }

  if (rawFaviconUrl) {
    try {
      const parsed = new URL(rawFaviconUrl);
      if (parsed.protocol === "data:" || parsed.protocol === "chrome:" || parsed.protocol === "chrome-extension:") {
        return rawFaviconUrl;
      }
      if (parsed.protocol === "http:" || parsed.protocol === "https:") {
        return toGoogleFaviconUrl(parsed);
      }
    } catch {
      return null;
    }
  }

  return null;
}
