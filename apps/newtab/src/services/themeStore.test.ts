import { describe, expect, it } from "vitest";
import { buildThemeAssetCheckoutUrl, normalizeThemeTokenSet } from "./themeStore";

describe("normalizeThemeTokenSet", () => {
  it("accepts direct token objects with optional opacity fields", () => {
    const tokens = normalizeThemeTokenSet({
      background: "#0f172a",
      panel: "#111827",
      panelMuted: "#1f2937",
      border: "#334155",
      text: "#e2e8f0",
      textMuted: "#94a3b8",
      accent: "#f43f5e",
      backgroundImageOpacity: 0.14,
      leftPanelImageOpacity: 0.22,
    });

    expect(tokens).toEqual({
      background: "#0f172a",
      panel: "#111827",
      panelMuted: "#1f2937",
      border: "#334155",
      text: "#e2e8f0",
      textMuted: "#94a3b8",
      accent: "#f43f5e",
      backgroundImageOpacity: 0.14,
      leftPanelImageOpacity: 0.22,
    });
  });

  it("rejects incomplete token objects", () => {
    expect(
      normalizeThemeTokenSet({
        background: "#0f172a",
        panel: "#111827",
      })
    ).toBeNull();
  });
});

describe("buildThemeAssetCheckoutUrl", () => {
  it("builds a signed checkout url for theme assets", () => {
    const checkoutUrl = buildThemeAssetCheckoutUrl(
      "https://example.supabase.co/",
      "access-token",
      "asset-123",
      "zh-TW"
    );

    expect(checkoutUrl).toBe(
      "https://example.supabase.co/functions/v1/payuni_checkout?kind=theme_asset&assetId=asset-123&token=access-token&locale=zh-TW"
    );
  });

  it("returns null when required values are missing", () => {
    expect(buildThemeAssetCheckoutUrl("", "token", "asset-123", "zh-TW")).toBeNull();
    expect(buildThemeAssetCheckoutUrl("https://example.supabase.co", "", "asset-123", "zh-TW")).toBeNull();
    expect(buildThemeAssetCheckoutUrl("https://example.supabase.co", "token", "", "zh-TW")).toBeNull();
  });
});
