import { useEffect, useMemo, useState } from "react";
import { Card, SectionTitle } from "@toby/shared-ui";
import { useLocale } from "../i18n";
import { useAuthLogic, useAuthUser } from "../auth/useAuth";
import { useAppStore } from "../store/appStore";
import { getLocal } from "@toby/chrome-adapters";
import type { Membership } from "@toby/core";
import {
  Bell,
  Check,
  ChevronRight,
  HelpCircle,
  Languages,
  LogIn,
  LogOut,
  Monitor,
  Moon,
  Palette,
  RefreshCw,
  Sun,
} from "lucide-react";

export function AuthPanel() {
  const { t } = useLocale();
  const { status, handleSave, handleGoogle, handleSignOut, handleClearConfig } = useAuthLogic();

  return (
    <Card className="p-4">
      <SectionTitle title={t("auth.title")} />
      <div className="mt-3 space-y-2 text-xs">
        <div className="flex flex-wrap gap-2 pt-2">
          <button className="rounded border border-slate-700 px-2 py-1" onClick={handleSave}>
            {t("auth.saveConfig")}
          </button>
          <button className="rounded border border-slate-700 px-2 py-1" onClick={handleGoogle}>
            {t("auth.googleSignIn")}
          </button>
          <button className="rounded border border-slate-700 px-2 py-1" onClick={handleSignOut}>
            {t("auth.signOut")}
          </button>
          <button className="rounded border border-slate-700 px-2 py-1" onClick={handleClearConfig}>
            {t("auth.clear")}
          </button>
        </div>
        <div className="text-slate-400">{status}</div>
      </div>
    </Card>
  );
}

type AuthMiniPanelProps = {
  collapsed?: boolean;
  onSync?: () => void;
  onUpgrade?: () => void;
  themeMode?: "light" | "dark" | "system";
  effectiveTheme?: "light" | "dark";
  onSetThemeMode?: (mode: "light" | "dark" | "system") => void;
  onOpenThemeStore?: () => void;
};

export function AuthMiniPanel({
  collapsed = false,
  onSync,
  onUpgrade,
  themeMode = "system",
  effectiveTheme = "light",
  onSetThemeMode,
  onOpenThemeStore,
}: AuthMiniPanelProps) {
  const { t, locale, setLocale } = useLocale();
  const user = useAuthUser();
  const { handleGoogle, handleSignOut } = useAuthLogic();
  const lastSyncAt = useAppStore((state) => state.cache.lastSyncAt);
  const lastSyncError = useAppStore((state) => state.cache.lastSyncError);
  const nextSyncRetryAt = useAppStore((state) => state.cache.nextSyncRetryAt);
  const pendingCount = useAppStore((state) => state.cache.pendingOps.length);
  const [open, setOpen] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);
  const [updatesOpen, setUpdatesOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [themeModeOpen, setThemeModeOpen] = useState(false);
  const [membership, setMembership] = useState<Membership | null>(null);

  useEffect(() => {
    let isMounted = true;
    const MEMBERSHIP_KEY = "toby_membership_v1";
    void (async () => {
      const stored = await getLocal<Membership | null>(MEMBERSHIP_KEY, null);
      if (isMounted) {
        setMembership(stored);
      }
    })();
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== "local" || !changes[MEMBERSHIP_KEY]) {
        return;
      }
      setMembership((changes[MEMBERSHIP_KEY].newValue as Membership | null) ?? null);
    };
    if (chrome?.storage?.onChanged) {
      chrome.storage.onChanged.addListener(onChanged);
    }
    return () => {
      isMounted = false;
      if (chrome?.storage?.onChanged) {
        chrome.storage.onChanged.removeListener(onChanged);
      }
    };
  }, []);

  const planLabel = useMemo(() => {
    if (!membership?.planType) {
      return locale === "en" ? "-" : "—";
    }
    const labels: Record<string, string> = {
      trial: locale === "en" ? "Trial" : "試用",
      personal_yearly: locale === "en" ? "Personal (Yearly)" : "個人年費",
      pro_monthly: locale === "en" ? "Pro (Monthly)" : "進階月付",
      team: locale === "en" ? "Team" : "團隊",
      enterprise: locale === "en" ? "Enterprise" : "企業",
    };
    return labels[membership.planType] ?? membership.planType;
  }, [locale, membership?.planType]);
  const themeLabel = useMemo(() => {
    if (themeMode === "system") {
      return locale === "en" ? "System" : "跟隨系統";
    }
    if (themeMode === "dark") {
      return locale === "en" ? "Dark" : "深色";
    }
    return locale === "en" ? "Light" : "淺色";
  }, [locale, themeMode]);
  const statusLine = useMemo(() => {
    const parts: string[] = [];
    if (lastSyncAt) {
      parts.push(`${t("app.lastSync")} ${new Date(lastSyncAt).toLocaleTimeString()}`);
    }
    if (lastSyncError) {
      parts.push(`${t("app.syncError")} (${lastSyncError})`);
    }
    if (nextSyncRetryAt) {
      parts.push(`${t("app.retry")} ${new Date(nextSyncRetryAt).toLocaleTimeString()}`);
    }
    if (pendingCount > 0) {
      parts.push(`${t("app.pending")} ${pendingCount}`);
    }
    return parts.join(" • ");
  }, [lastSyncAt, lastSyncError, nextSyncRetryAt, pendingCount, t]);
  const applyThemeMode = (mode: "light" | "dark" | "system") => {
    onSetThemeMode?.(mode);
    setThemeModeOpen(false);
  };

  return (
    <div className="w-full">
      <button
        className={`flex w-full items-center rounded-2xl border border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200 ${
          collapsed ? "justify-center px-2 py-2" : "justify-between gap-3 px-3 py-2"
        }`}
        onClick={() => setOpen((prev) => !prev)}
        aria-label={locale === "en" ? "Open account menu" : "開啟帳號選單"}
        title={locale === "en" ? "Open account menu" : "開啟帳號選單"}
      >
        {!collapsed ? (
          <div className="min-w-0 text-[12px] font-semibold tracking-[0.2em] text-zinc-700">TABOARD</div>
        ) : null}
        <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-white">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-500">
              {user?.name?.slice(0, 2).toUpperCase() ?? "?"}
            </div>
          )}
        </div>
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)} />
          <div className="fixed bottom-5 left-5 z-50 w-72">
            <div className="mb-2 rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
              <div className="grid grid-cols-1 gap-2">
                <button
                  className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-40"
                  onClick={() => {
                    onUpgrade?.();
                    setOpen(false);
                  }}
                  disabled={!onUpgrade}
                >
                  {locale === "en" ? "Upgrade plan" : "升級方案"}
                </button>
              </div>
            </div>
            <div className="rounded-3xl border border-zinc-200 bg-white p-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 overflow-hidden rounded-full border border-zinc-200 bg-zinc-100">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[12px] text-zinc-500">
                      {user?.name?.slice(0, 2).toUpperCase() ?? "?"}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-zinc-900">
                    {user?.name ?? t("app.signIn")}
                  </div>
                  <div className="truncate text-[11px] text-zinc-500">{user?.email ?? "-"}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-500">
                <span>{locale === "en" ? "Plan" : "方案"}</span>
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600">{planLabel}</span>
              </div>
              <div className="mt-3">
                {!user ? (
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50"
                    onClick={handleGoogle}
                  >
                    <LogIn className="h-4 w-4" />
                    {t("auth.googleSignIn")}
                  </button>
                ) : (
                  <button
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-xs text-zinc-700 hover:bg-zinc-50"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                    {t("auth.signOut")}
                  </button>
                )}
              </div>
              <div className="mt-3 border-t border-zinc-200 pt-3">
                <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                  <button
                    type="button"
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 text-zinc-500 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => onSync?.()}
                    disabled={!onSync}
                    aria-label={t("app.syncNow")}
                    title={t("app.syncNow")}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                  <span className="min-w-0 flex-1 text-right" title={statusLine || "-"}>
                    {statusLine || "-"}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-2 space-y-1 rounded-2xl border border-zinc-200 bg-white p-2 shadow-lg">
              <button
                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-xs text-zinc-600 hover:bg-zinc-100"
                onClick={() => setFaqOpen(true)}
              >
                <HelpCircle className="h-4 w-4 text-zinc-500" />
                {t("rail.faq")}
                <ChevronRight className="ml-auto h-4 w-4 text-zinc-400" />
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-xs text-zinc-600 hover:bg-zinc-100"
                onClick={() => setUpdatesOpen(true)}
              >
                <Bell className="h-4 w-4 text-zinc-500" />
                {t("rail.updates")}
                <ChevronRight className="ml-auto h-4 w-4 text-zinc-400" />
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-xs text-zinc-600 hover:bg-zinc-100"
                onClick={() => setLangOpen(true)}
              >
                <Languages className="h-4 w-4 text-zinc-500" />
                {t("app.language")}
                <ChevronRight className="ml-auto h-4 w-4 text-zinc-400" />
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-xs text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => setThemeModeOpen((prev) => !prev)}
                aria-label={locale === "en" ? "Theme mode" : "主題模式"}
                title={locale === "en" ? "Theme mode" : "主題模式"}
              >
                {effectiveTheme === "dark" ? (
                  <Sun className="h-4 w-4 text-zinc-500" />
                ) : (
                  <Moon className="h-4 w-4 text-zinc-500" />
                )}
                <span>{locale === "en" ? `Theme: ${themeLabel}` : `主題：${themeLabel}`}</span>
                <ChevronRight className="ml-auto h-4 w-4 text-zinc-400" />
              </button>
              {themeModeOpen ? (
                <div className="mx-2 rounded-xl border border-zinc-200 bg-zinc-50 p-2">
                  <button
                    className={`flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs ${
                      themeMode === "light" ? "bg-white text-zinc-900" : "text-zinc-600 hover:bg-white"
                    }`}
                    onClick={() => applyThemeMode("light")}
                  >
                    <span className="inline-flex items-center gap-1">
                      <Sun className="h-3.5 w-3.5" />
                      {locale === "en" ? "Light" : "淺色"}
                    </span>
                    {themeMode === "light" ? <Check className="h-3.5 w-3.5" /> : null}
                  </button>
                  <button
                    className={`mt-1 flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs ${
                      themeMode === "dark" ? "bg-white text-zinc-900" : "text-zinc-600 hover:bg-white"
                    }`}
                    onClick={() => applyThemeMode("dark")}
                  >
                    <span className="inline-flex items-center gap-1">
                      <Moon className="h-3.5 w-3.5" />
                      {locale === "en" ? "Dark" : "深色"}
                    </span>
                    {themeMode === "dark" ? <Check className="h-3.5 w-3.5" /> : null}
                  </button>
                  <button
                    className={`mt-1 flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs ${
                      themeMode === "system" ? "bg-white text-zinc-900" : "text-zinc-600 hover:bg-white"
                    }`}
                    onClick={() => applyThemeMode("system")}
                  >
                    <span className="inline-flex items-center gap-1">
                      <Monitor className="h-3.5 w-3.5" />
                      {locale === "en" ? "System" : "跟隨系統"}
                    </span>
                    {themeMode === "system" ? <Check className="h-3.5 w-3.5" /> : null}
                  </button>
                </div>
              ) : null}
              <button
                className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left text-xs text-zinc-600 hover:bg-zinc-100 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => {
                  onOpenThemeStore?.();
                  setOpen(false);
                }}
                disabled={!onOpenThemeStore}
                aria-label={locale === "en" ? "Theme store" : "主題商店"}
                title={locale === "en" ? "Theme store" : "主題商店"}
              >
                <Palette className="h-4 w-4 text-zinc-500" />
                <span>{locale === "en" ? "Theme store" : "主題商店"}</span>
                <ChevronRight className="ml-auto h-4 w-4 text-zinc-400" />
              </button>
            </div>
          </div>
        </>
      ) : null}

      {faqOpen ? (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setFaqOpen(false)}
        >
          <div
            className="modal-enter w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <HelpCircle className="h-4 w-4 text-zinc-500" />
              {t("rail.faq")}
            </div>
            <div className="mt-3 text-xs text-zinc-500">FAQ 內容可放這裡。</div>
            <div className="mt-4 flex justify-end">
              <button
                className="rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-600"
                onClick={() => setFaqOpen(false)}
              >
                {t("tab.cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {updatesOpen ? (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setUpdatesOpen(false)}
        >
          <div
            className="modal-enter w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <Bell className="h-4 w-4 text-zinc-500" />
              {t("rail.updates")}
            </div>
            <div className="mt-3 text-xs text-zinc-500">更新通知可放這裡。</div>
            <div className="mt-4 flex justify-end">
              <button
                className="rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-600"
                onClick={() => setUpdatesOpen(false)}
              >
                {t("tab.cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {langOpen ? (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4"
          onClick={() => setLangOpen(false)}
        >
          <div
            className="modal-enter w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
              <Languages className="h-4 w-4 text-zinc-500" />
              {t("app.language")}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-2 text-xs">
              <button
                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                  locale === "zh-TW" ? "border-zinc-900 text-zinc-900" : "border-zinc-200 text-zinc-600"
                } hover:bg-zinc-50`}
                onClick={() => setLocale("zh-TW")}
              >
                <span>繁體中文</span>
                {locale === "zh-TW" ? <Check className="h-4 w-4 text-zinc-900" /> : null}
              </button>
              <button
                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
                  locale === "en" ? "border-zinc-900 text-zinc-900" : "border-zinc-200 text-zinc-600"
                } hover:bg-zinc-50`}
                onClick={() => setLocale("en")}
              >
                <span>English</span>
                {locale === "en" ? <Check className="h-4 w-4 text-zinc-900" /> : null}
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                className="rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-600"
                onClick={() => setLangOpen(false)}
              >
                {t("tab.cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
