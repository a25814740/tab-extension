import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App";
import { appStore } from "./store/appStore";
import { defaultCache, sampleWorkspaces } from "@toby/core";
import "./styles.css";

declare global {
  interface Window {
    __TABOARD_PREVIEW__?: boolean;
  }
}

const seedPreviewStore = () => {
  const samples = sampleWorkspaces();
  const active = samples[0];
  if (!active) {
    return;
  }

  const spaces = active.spaces.map(({ folders, ...space }) => space);
  const folders = active.spaces.flatMap((space) => space.folders ?? []);
  const collections = active.collections.map(({ tabs, ...collection }) => collection);
  const tabs = active.collections.flatMap((collection) => collection.tabs);
  const now = new Date().toISOString();

  appStore.setState((state) => ({
    ...state,
    workspaces: samples.map((item) => item.workspace),
    workspace: active.workspace,
    spaces,
    folders,
    collections,
    tabs,
    cache: {
      ...defaultCache,
      ui: {
        ...defaultCache.ui,
        theme: "dark",
        viewMode: "grid",
        sortMode: "custom",
      },
      selectedWorkspaceId: active.workspace.id,
      selectedSpaceId: spaces[0]?.id ?? null,
      selectedCollectionId: collections[0]?.id ?? null,
      dock: {
        pinned: [
          {
            id: "dock-google",
            type: "tab",
            title: "Google",
            url: "https://www.google.com",
            collectionId: null,
            faviconUrl: null,
            createdAt: now,
          },
          {
            id: "dock-gmail",
            type: "tab",
            title: "Gmail",
            url: "https://mail.google.com",
            collectionId: null,
            faviconUrl: null,
            createdAt: now,
          },
          {
            id: "dock-drive",
            type: "tab",
            title: "Google Drive",
            url: "https://drive.google.com",
            collectionId: null,
            faviconUrl: null,
            createdAt: now,
          },
          {
            id: "dock-gemini",
            type: "tab",
            title: "Gemini",
            url: "https://gemini.google.com",
            collectionId: null,
            faviconUrl: null,
            createdAt: now,
          },
        ],
      },
    },
  }));
};

window.__TABOARD_PREVIEW__ = true;
seedPreviewStore();

const root = document.getElementById("root");
if (!root) {
  throw new Error("Preview root element not found.");
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
