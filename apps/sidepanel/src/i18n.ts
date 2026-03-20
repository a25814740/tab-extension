import { createContext, createElement, useCallback, useEffect, useMemo, useState, useContext } from "react";
import { getSync, setSync } from "@toby/chrome-adapters";

export type Locale = "zh-TW" | "en";

// Keep keys stable across apps so the same locale storage works everywhere.
const MESSAGES = {
  en: {
    "side.title": "Quick Actions",
    "side.lastSync": "Last sync",
    "side.syncPending": "Sync pending",
    "side.error": "Error",
    "side.retry": "Retry",
    "side.pending": "Pending",
    "side.windowPrefix": "Window",
    "side.saveToNewCollection": "Save to new collection",
    "side.saveActiveTab": "Save Active Tab",
    "side.saveCurrentWindow": "Save all tabs in current window",
    "side.saveTarget": "Save Target",
    "side.organization": "Organization",
    "side.space": "Space",
    "side.collection": "Collection",
    "side.recentCollections": "Recent Collections",
    "side.quickSearch": "Quick Search",
    "side.searchPlaceholder": "Search tabs, collections, folders",
    "side.openAll": "Open All",
    "side.tabs": "tabs",
    "ai.title": "AI Organize",
    "ai.suggestGroups": "Suggest Groups",
    "ai.status.idle": "Idle",
    "ai.status.analyzing": "Analyzing...",
    "ai.status.ready": "Ready",
  },
  "zh-TW": {
    "side.title": "快速操作",
    "side.lastSync": "最後同步",
    "side.syncPending": "等待同步",
    "side.error": "錯誤",
    "side.retry": "重試",
    "side.pending": "待同步",
    "side.windowPrefix": "視窗",
    "side.saveToNewCollection": "存成新集合",
    "side.saveActiveTab": "儲存目前分頁",
    "side.saveCurrentWindow": "儲存目前視窗所有分頁",
    "side.saveTarget": "保存目標",
    "side.organization": "組織",
    "side.space": "空間",
    "side.collection": "集合",
    "side.recentCollections": "最近集合",
    "side.quickSearch": "快速搜尋",
    "side.searchPlaceholder": "搜尋分頁、集合、資料夾",
    "side.openAll": "全部開啟",
    "side.tabs": "分頁",
    "ai.title": "AI 整理",
    "ai.suggestGroups": "建議分組",
    "ai.status.idle": "待命",
    "ai.status.analyzing": "分析中...",
    "ai.status.ready": "完成",
  },
} as const;

export type MessageKey = keyof typeof MESSAGES.en;

const LOCALE_KEY = "toby_locale_v1";
const DEFAULT_LOCALE: Locale = "zh-TW";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (next: Locale) => Promise<void>;
  t: (key: MessageKey) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    void (async () => {
      const stored = await getSync<Locale | null>(LOCALE_KEY, null);
      if (stored === "zh-TW" || stored === "en") {
        setLocaleState(stored);
      }
    })();
  }, []);

  const setLocale = useCallback(async (next: Locale) => {
    setLocaleState(next);
    await setSync(LOCALE_KEY, next);
  }, []);

  const t = useCallback(
    (key: MessageKey) => MESSAGES[locale]?.[key] ?? MESSAGES.en[key] ?? key,
    [locale]
  );

  const value = useMemo(
    () => ({
      locale,
      setLocale,
      t,
    }),
    [locale, setLocale, t]
  );

  return createElement(LocaleContext.Provider, { value }, children);
}

export function useLocale() {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }
  return context;
}
