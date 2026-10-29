function toGoogleFaviconUrl(target: URL) {
  return `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(target.origin)}`;
}

const RESERVED_EXAMPLE_DOMAINS = ["example.com", "example.net", "example.org"];
const RESERVED_TLDS = [".test", ".example", ".invalid", ".localhost"];

// RFC 2606 / 6761 names never have a real favicon, so the Google service
// answers 404 for them; let callers fall back to the default icon instead.
function isReservedHost(hostname: string) {
  const host = hostname.toLowerCase();
  if (host === "localhost" || RESERVED_TLDS.some((tld) => host.endsWith(tld))) {
    return true;
  }
  return RESERVED_EXAMPLE_DOMAINS.some((domain) => host === domain || host.endsWith(`.${domain}`));
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
  if (page && !isReservedHost(page.hostname)) {
    // Always proxy through Google favicon service to avoid extension CORS/CORP noise.
    return toGoogleFaviconUrl(page);
  }

  if (rawFaviconUrl) {
    try {
      const parsed = new URL(rawFaviconUrl);
      if (parsed.protocol === "data:" || parsed.protocol === "chrome:" || parsed.protocol === "chrome-extension:") {
        return rawFaviconUrl;
      }
      if ((parsed.protocol === "http:" || parsed.protocol === "https:") && !isReservedHost(parsed.hostname)) {
        return toGoogleFaviconUrl(parsed);
      }
    } catch {
      return null;
    }
  }

  return null;
}
