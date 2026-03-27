import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App";
import { appStore } from "./store/appStore";
import { defaultCache, sampleWorkspaces } from "@toby/core";
import html2canvas from "html2canvas";
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

  const spaces = active.spaces.map((space) => ({ ...space, folders: undefined }));
  const collections = active.collections.map((collection) => ({ ...collection, tabs: undefined }));
  const tabs = active.collections.flatMap((collection) => collection.tabs);
  const now = new Date().toISOString();

  appStore.setState((state) => ({
    ...state,
    workspaces: samples.map((item) => item.workspace),
    workspace: active.workspace,
    spaces,
    folders: active.spaces.flatMap((space) => space.folders ?? []),
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

const getAllowedOrigin = () => {
  let allowedOrigin = window.location.origin;
  try {
    if (document.referrer) {
      allowedOrigin = new URL(document.referrer).origin;
    }
  } catch {
    // ignore invalid referrer
  }
  return allowedOrigin;
};

const capturePreview = async () => {
  const canvas = await html2canvas(document.body, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
    allowTaint: false,
    ignoreElements: (element) => element.tagName === "IMG",
  });
  return canvas.toDataURL("image/png");
};

window.addEventListener("message", async (event) => {
  if (event.source !== window.parent) return;
  if (event.origin !== getAllowedOrigin()) return;
  const payload = event.data as { type?: string; requestId?: string };
  if (payload?.type !== "TABOARD_PREVIEW_CAPTURE" || !payload.requestId) return;
  let dataUrl = "";
  try {
    dataUrl = await capturePreview();
  } catch {
    dataUrl = "";
  }
  event.source?.postMessage(
    {
      type: "TABOARD_PREVIEW_CAPTURE_RESULT",
      requestId: payload.requestId,
      dataUrl,
    },
    event.origin
  );
});

const root = document.getElementById("root");
if (!root) {
  throw new Error("Preview root element not found.");
}

createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
