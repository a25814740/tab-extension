import React, { useMemo } from "react";
import { appStore } from "../store/appStore";
import { DEFAULT_THEME_PRESET_ID, resolveThemePreset, type CustomThemeDraft } from "../theme/catalog";

export type PreviewTokenSet = {
  background: string;
  panel: string;
  panelMuted?: string;
  border: string;
  shadow: string;
  text: string;
  textMuted: string;
  accent: string;
  leftPanelBackground?: string;
  mainPanelBackground?: string;
  rightPanelBackground?: string;
  backgroundImageOpacity?: number;
  leftPanelImageOpacity?: number;
  mainPanelImageOpacity?: number;
  rightPanelImageOpacity?: number;
  dockImageOpacity?: number;
};

export const applyPreviewTokens = (tokens: PreviewTokenSet | null) => {
  const root = document.documentElement;
  if (!tokens) return;
  root.style.setProperty("--preview-bg", tokens.background);
  root.style.setProperty("--preview-panel", tokens.panel);
  root.style.setProperty("--preview-panel-muted", tokens.panelMuted || tokens.panel);
  root.style.setProperty("--preview-border", tokens.border);
  root.style.setProperty("--preview-shadow", tokens.shadow);
  root.style.setProperty("--preview-text", tokens.text);
  root.style.setProperty("--preview-text-muted", tokens.textMuted);
  root.style.setProperty("--preview-accent", tokens.accent);
  if (tokens.leftPanelBackground) root.style.setProperty("--preview-left", tokens.leftPanelBackground);
  if (tokens.mainPanelBackground) root.style.setProperty("--preview-main", tokens.mainPanelBackground);
  if (tokens.rightPanelBackground) root.style.setProperty("--preview-right", tokens.rightPanelBackground);
};

const buildMockSnapshot = () => {
  return {
    workspace: { id: "preview", name: "Preview Workspace" },
    spaces: [
      { id: "s1", name: "Personal" },
      { id: "s2", name: "Work" },
    ],
    collections: [
      {
        id: "c1",
        name: "AI Research",
        spaceId: "s1",
        position: 1000,
        tabs: [
          { id: "t1", title: "OpenAI Docs", url: "https://platform.openai.com/docs" },
          { id: "t2", title: "Chrome Extensions", url: "https://developer.chrome.com/docs/extensions" },
        ],
      },
      {
        id: "c2",
        name: "Weekend",
        spaceId: "s1",
        position: 2000,
        tabs: [
          { id: "t3", title: "Travel Ideas", url: "https://example.com/travel" },
          { id: "t4", title: "Coffee Beans", url: "https://example.com/coffee" },
        ],
      },
    ],
  };
};

export type PreviewThemeInput = {
  themePresetId?: string;
  customTheme?: CustomThemeDraft | null;
};

export const usePreviewThemeTokens = (input?: PreviewThemeInput) => {
  return useMemo(() => {
    const preset = resolveThemePreset(input?.themePresetId || DEFAULT_THEME_PRESET_ID, input?.customTheme || null);
    return {
      background: preset.tokens.background,
      panel: preset.tokens.panel,
      panelMuted: preset.tokens.panelMuted,
      border: preset.tokens.border,
      shadow: preset.tokens.shadow,
      text: preset.tokens.text,
      textMuted: preset.tokens.textMuted,
      accent: preset.tokens.accent,
      leftPanelBackground: preset.tokens.leftPanelBackground,
      mainPanelBackground: preset.tokens.mainPanelBackground,
      rightPanelBackground: preset.tokens.rightPanelBackground,
    } as PreviewTokenSet;
  }, [input?.themePresetId, input?.customTheme]);
};

export const hydrateMockStore = () => {
  const snapshot = buildMockSnapshot();
  appStore.setState((state) => {
    return {
      ...state,
      workspace: snapshot.workspace,
      spaces: snapshot.spaces,
      collections: snapshot.collections.map((collection) => ({
        ...collection,
        tabs: collection.tabs,
      })),
    } as any;
  });
};

export const PreviewRoot: React.FC = () => {
  const themePreset = resolveThemePreset(DEFAULT_THEME_PRESET_ID, null);
  return (
    <div style={{ padding: 24, color: themePreset.tokens.text }}>
      <div className="text-sm">這裡會嵌入前台 React UI</div>
    </div>
  );
};
