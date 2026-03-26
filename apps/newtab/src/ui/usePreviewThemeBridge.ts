import { useEffect, useState } from "react";
import type { ThemeTokenSet } from "../theme/catalog";

export type PreviewThemeBridge = {
  previewEnabled: boolean;
  previewTokens: Partial<ThemeTokenSet> | null;
  previewTheme: "light" | "dark" | null;
};

export function usePreviewThemeBridge(): PreviewThemeBridge {
  const previewEnabled =
    typeof window !== "undefined" &&
    (window as { __TABOARD_PREVIEW__?: boolean }).__TABOARD_PREVIEW__ === true;
  const [previewTokens, setPreviewTokens] = useState<Partial<ThemeTokenSet> | null>(null);
  const [previewTheme, setPreviewTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    if (!previewEnabled) {
      return;
    }
    const handler = (event: MessageEvent) => {
      let allowedOrigin = window.location.origin;
      try {
        if (document.referrer) {
          allowedOrigin = new URL(document.referrer).origin;
        }
      } catch {
        // ignore invalid referrer
      }
      if (event.origin !== allowedOrigin) {
        return;
      }
      if (event.source !== window.parent) {
        return;
      }
      const payload = event.data as
        | {
            type?: string;
            tokens?: Partial<ThemeTokenSet> | null;
            theme?: "light" | "dark";
          }
        | undefined;
      if (payload?.type !== "TABOARD_PREVIEW_TOKENS") {
        return;
      }
      setPreviewTokens(payload.tokens ?? null);
      if (payload.theme === "light" || payload.theme === "dark") {
        setPreviewTheme(payload.theme);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, [previewEnabled]);

  return { previewEnabled, previewTokens, previewTheme };
}
