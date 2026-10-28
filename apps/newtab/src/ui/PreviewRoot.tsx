import React, { useMemo } from "react";
import { appStore } from "../store/appStore";
import { DEFAULT_THEME_PRESET_ID, resolveThemePreset, type CustomThemeDraft, type ThemeTokenSet } from "../theme/catalog";

export type PreviewTokenSet = ThemeTokenSet;

export const applyPreviewTokens = (tokens: PreviewTokenSet | null) => {
  const root = document.documentElement;
  if (!tokens) return;
  root.style.setProperty("--preview-bg", tokens.background);
  root.style.setProperty("--preview-panel", tokens.panel);
  root.style.setProperty("--preview-panel-muted", tokens.panelMuted || tokens.panel);
  root.style.setProperty("--preview-border", tokens.border);
  root.style.setProperty("--preview-text", tokens.text);
  root.style.setProperty("--preview-text-muted", tokens.textMuted);
  root.style.setProperty("--preview-accent", tokens.accent);
  if (tokens.leftPanelBackground) root.style.setProperty("--preview-left", tokens.leftPanelBackground);
  if (tokens.mainPanelBackground) root.style.setProperty("--preview-main", tokens.mainPanelBackground);
  if (tokens.rightPanelBackground) root.style.setProperty("--preview-right", tokens.rightPanelBackground);
};

const buildMockSnapshot = () => {
  const now = new Date().toISOString();
  return {
    workspace: { 
      id: "preview", 
      name: "Preview Workspace",
      ownerId: "preview-owner",
      logoUrl: null,
      inviteCount: 0,
      points: 0,
      createdAt: now,
      updatedAt: now
    },
    spaces: [
      { id: "s1", name: "Personal", workspaceId: "preview", position: 1000, createdAt: now, updatedAt: now },
      { id: "s2", name: "Work", workspaceId: "preview", position: 2000, createdAt: now, updatedAt: now },
    ],
    collections: [
      {
        id: "c1",
        name: "AI Research",
        spaceId: "s1",
        workspaceId: "preview",
        folderId: null,
        note: null,
        color: null,
        createdBy: "preview-owner",
        archivedAt: null,
        starred: false,
        position: 1000,
        createdAt: now,
        updatedAt: now,
        tabs: [
          { id: "t1", title: "OpenAI Docs", url: "https://platform.openai.com/docs", collectionId: "c1", position: 1000, createdAt: now, updatedAt: now, faviconUrl: null, note: null },
          { id: "t2", title: "Chrome Extensions", url: "https://developer.chrome.com/docs/extensions", collectionId: "c1", position: 2000, createdAt: now, updatedAt: now, faviconUrl: null, note: null },
        ],
      },
      {
        id: "c2",
        name: "Weekend",
        spaceId: "s1",
        workspaceId: "preview",
        folderId: null,
        note: null,
        color: null,
        createdBy: "preview-owner",
        archivedAt: null,
        starred: false,
        position: 2000,
        createdAt: now,
        updatedAt: now,
        tabs: [
          { id: "t3", title: "Travel Ideas", url: "https://example.com/travel", collectionId: "c2", position: 1000, createdAt: now, updatedAt: now, faviconUrl: null, note: null },
          { id: "t4", title: "Coffee Beans", url: "https://example.com/coffee", collectionId: "c2", position: 2000, createdAt: now, updatedAt: now, faviconUrl: null, note: null },
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
    const preset = resolveThemePreset(input?.themePresetId || DEFAULT_THEME_PRESET_ID);
    const tokens = preset.tokens.dark;
    return {
      ...tokens,
      ...input?.customTheme,
    } as PreviewTokenSet;
  }, [input?.themePresetId, input?.customTheme]);
};

export const hydrateMockStore = () => {
  const snapshot = buildMockSnapshot();
  appStore.setState((state) => {
    return {
      ...state,
      workspace: snapshot.workspace,
      workspaces: [snapshot.workspace],
      spaces: snapshot.spaces,
      collections: snapshot.collections.map((collection) => ({
        id: collection.id,
        name: collection.name,
        spaceId: collection.spaceId,
        workspaceId: collection.workspaceId,
        folderId: collection.folderId,
        note: collection.note,
        color: collection.color,
        createdBy: collection.createdBy,
        archivedAt: collection.archivedAt,
        position: collection.position,
        createdAt: collection.createdAt,
        updatedAt: collection.updatedAt,
        starred: collection.starred,
      })),
      tabs: snapshot.collections.flatMap((c) => c.tabs),
    };
  });
};

export const PreviewRoot: React.FC = () => {
  const themePreset = resolveThemePreset(DEFAULT_THEME_PRESET_ID);
  return (
    <div style={{ padding: 24, color: themePreset.tokens.dark.text }}>
      <div className="text-sm">這裡會嵌入前台 React UI</div>
    </div>
  );
};
