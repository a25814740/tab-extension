import { useEffect } from "react";
import { useStore } from "zustand";
import { createAppStore, localSnapshotSchema, toSnapshot } from "@toby/core";
import { getLocal, setLocal } from "@toby/chrome-adapters";

const LOCAL_SNAPSHOT_KEY = "toby_snapshot_v1";

export const appStore = createAppStore();

export const useAppStore = <T,>(selector: (state: ReturnType<typeof appStore.getState>) => T) =>
  useStore(appStore, selector);

export function useLocalCacheSync() {
  useEffect(() => {
    let isMounted = true;

    // Hydrate from chrome.storage.local once on mount.
    void (async () => {
      const snapshot = await getLocal(LOCAL_SNAPSHOT_KEY, null);
      const parsed = localSnapshotSchema.safeParse(snapshot);
      if (isMounted && parsed.success) {
        appStore.getState().hydrate(parsed.data);
      }
    })();

    // Persist on changes with a small debounce.
    let timeout: number | undefined;
    const unsubscribe = appStore.subscribe((state) => {
      if (timeout) {
        window.clearTimeout(timeout);
      }
      timeout = window.setTimeout(() => {
        void setLocal(LOCAL_SNAPSHOT_KEY, toSnapshot(state));
      }, 250);
    });

    return () => {
      isMounted = false;
      unsubscribe();
      if (timeout) {
        window.clearTimeout(timeout);
      }
    };
  }, []);
}
