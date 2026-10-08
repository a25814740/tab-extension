import React, { useMemo } from "react";
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

const buildMockSnapshot = () => ({
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
  ],
});

export type PreviewThemeInput = {
  themePresetId?: string;
  customTheme?: CustomThemeDraft | null;
};

export const usePreviewThemeTokens = (input?: PreviewThemeInput) => {
  return useMemo(() => {
    const preset = resolveThemePreset(input?.themePresetId || DEFAULT_THEME_PRESET_ID);
    const base = preset.tokens.dark;
    const customTheme = input?.customTheme ?? null;
    return {
      background: customTheme?.background ?? base.background,
      panel: customTheme?.panel ?? base.panel,
      panelMuted: customTheme?.panelMuted ?? base.panelMuted,
      border: customTheme?.border ?? base.border,
      shadow: "0 24px 80px rgba(15, 23, 42, 0.22)",
      text: customTheme?.text ?? base.text,
      textMuted: customTheme?.textMuted ?? base.textMuted,
      accent: customTheme?.accent ?? base.accent,
      leftPanelBackground: customTheme?.leftPanelBackground ?? base.leftPanelBackground,
      mainPanelBackground: customTheme?.mainPanelBackground ?? base.mainPanelBackground,
      rightPanelBackground: customTheme?.rightPanelBackground ?? base.rightPanelBackground,
    } as PreviewTokenSet;
  }, [input?.customTheme, input?.themePresetId]);
};

export const hydrateMockStore = () => buildMockSnapshot();

export const PreviewRoot: React.FC = () => {
  const themePreset = resolveThemePreset(DEFAULT_THEME_PRESET_ID);
  const modeTokens = themePreset.tokens.dark;
  return (
    <div style={{ minHeight: "100vh", padding: 24, background: modeTokens.background, color: modeTokens.text }}>
      <div className="text-sm">Preview helper ready.</div>
    </div>
  );
};
