export type ParsedTokens = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export const hasAuthHashToken = (hash: string) => hash.includes("access_token=");

export const normalizeHashPayload = (hash: string) => {
  const rawHash = hash.replace(/^#/, "");
  if (!rawHash) return "";
  let raw = rawHash.startsWith("/") ? rawHash.slice(1) : rawHash;
  const tokenStart = raw.indexOf("access_token=");
  if (tokenStart > 0) {
    raw = raw.slice(tokenStart);
  }
  return raw;
};

export const parseHashTokens = (hash: string): ParsedTokens | null => {
  const normalized = normalizeHashPayload(hash);
  if (!normalized) return null;
  const params = new URLSearchParams(normalized);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) return null;
  const expiresIn = Number(params.get("expires_in") || 0);
  return { accessToken, refreshToken, expiresIn };
};

export const normalizeCreatorEntryHash = (hash: string) => {
  if (!hash) return "#/";
  if (hash === "#/" || hash.startsWith("#/design") || hash.startsWith("#/preview") || hash.startsWith("#/assets") || hash.startsWith("#/revenue")) {
    return hash;
  }
  // Supabase OAuth callback may return "#/access_token=..."
  if (hash.startsWith("#/access_token=")) {
    return `#${hash.slice(2)}`;
  }
  return hash;
};
