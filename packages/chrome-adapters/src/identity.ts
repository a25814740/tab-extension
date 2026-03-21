export type AuthTokenResult = {
  token: string;
  expiresAt: number;
};

export async function getAuthToken(interactive: boolean): Promise<AuthTokenResult | null> {
  if (!chrome?.identity) {
    return null;
  }

  const tokenResult = await chrome.identity.getAuthToken({ interactive });
  const token = typeof tokenResult === "string" ? tokenResult : tokenResult?.token;
  if (!token) {
    return null;
  }

  return {
    token,
    expiresAt: Date.now() + 55 * 60 * 1000,
  };
}

export function getRedirectUrl(path?: string) {
  if (!chrome?.identity) {
    return "https://extension.local/redirect";
  }
  return chrome.identity.getRedirectURL(path);
}

export async function launchWebAuthFlow(url: string, interactive = true) {
  if (!chrome?.identity) {
    return null;
  }
  return chrome.identity.launchWebAuthFlow({ url, interactive });
}
