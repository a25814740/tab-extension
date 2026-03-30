import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ui/App";
import { LocaleProvider } from "./i18n";
import { appStore } from "./store/appStore";
import { defaultCache, sampleWorkspaces } from "@toby/core";
import { setLocal } from "@toby/chrome-adapters";
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

const seedPreviewAuth = async () => {
  // Preview build uses in-memory chrome adapter mocks.
  // We seed a local auth user before App mounts so auth gate won't block iframe rendering.
  await setLocal("toby_auth_user_v1", {
    id: "preview-user",
    email: "preview@taboard.local",
    name: "Preview User",
    avatarUrl: null,
  });
};

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

const emitPreviewReady = () => {
  if (window.parent === window) return;
  window.parent.postMessage({ type: "TABOARD_PREVIEW_READY" }, getAllowedOrigin());
};

const capturePreview = async () => {
  const root = document.getElementById("root");
  const target = root ?? document.body;
  const canvas = await html2canvas(target, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
    allowTaint: false,
    ignoreElements: (element) => element.tagName === "IMG",
  });
  const isEmpty = canvas.width === 0 || canvas.height === 0;
  if (!isEmpty) {
    try {
      return canvas.toDataURL("image/png");
    } catch {
      // ignore
    }
  }
  const fallback = document.createElement("canvas");
  fallback.width = 1200;
  fallback.height = 720;
  const ctx = fallback.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, fallback.width, fallback.height);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "28px sans-serif";
    ctx.fillText("Taboard Preview", 48, 80);
    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Preview unavailable, fallback image generated.", 48, 120);
  }
  return fallback.toDataURL("image/png");
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

window.addEventListener("load", emitPreviewReady);
setTimeout(emitPreviewReady, 600);

const root = document.getElementById("root");
if (!root) {
  throw new Error("Preview root element not found.");
}

const bootstrap = async () => {
  window.__TABOARD_PREVIEW__ = true;
  seedPreviewStore();
  await seedPreviewAuth();

  createRoot(root).render(
    <React.StrictMode>
      <LocaleProvider>
        <App />
      </LocaleProvider>
    </React.StrictMode>
  );
};

void bootstrap();
