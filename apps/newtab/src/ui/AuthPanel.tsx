import { useEffect, useMemo, useState } from "react";
import { Card, SectionTitle } from "@toby/shared-ui";
import { useLocale } from "../i18n";
import { useAuthLogic, useAuthUser } from "../auth/useAuth";
import { useAppStore } from "../store/appStore";
import { getLocal } from "@toby/chrome-adapters";
import type { Membership } from "@toby/core";

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

export function AuthMiniPanel() {
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

  return (
    <div className="w-full">
      <button
        className="flex w-full flex-col items-center justify-center gap-1 px-1 py-1 text-[10px] text-slate-200"
        onClick={() => setOpen((prev) => !prev)}
      >
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-slate-900/70">
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px]">
              {user?.name?.slice(0, 2).toUpperCase() ?? "?"}
            </div>
          )}
        </div>
        <span className="max-w-[48px] truncate">{user?.name ?? t("app.signIn")}</span>
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setOpen(false)} />
          <div className="fixed bottom-4 left-4 z-50 w-64 p-3">
            <div className="space-y-3 rounded-2xl border border-slate-800/80 bg-slate-900/95 p-4 shadow-xl backdrop-blur">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="h-12 w-12 overflow-hidden rounded-full bg-slate-800">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="avatar" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[12px]">
                      {user?.name?.slice(0, 2).toUpperCase() ?? "?"}
                    </div>
                  )}
                </div>
                <div className="text-sm font-semibold text-slate-100">
                  {user?.name ?? t("app.signIn")}
                </div>
                <div className="text-[11px] text-slate-500">{user?.email ?? "-"}</div>
                <div className="text-[11px] text-slate-500">
                  {locale === "en" ? "Plan" : "方案"}：{planLabel}
                </div>
              <div className="mt-2 w-full">
                {!user ? (
                  <button className="w-full rounded-lg border border-slate-700 px-2 py-2 text-xs hover:bg-slate-900/60" onClick={handleGoogle}>
                    {t("auth.googleSignIn")}
                  </button>
                ) : (
                    <button
                      className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-2 py-2 text-xs hover:bg-slate-900/60"
                      onClick={handleSignOut}
                    >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M10 16l4 -4l-4 -4"></path>
                      <path d="M4 12h10"></path>
                      <path d="M12 4h6v16h-6"></path>
                    </svg>
                    {t("auth.signOut")}
                  </button>
                )}
              </div>
              <div className="mt-3 w-full border-t border-slate-800/60 pt-3 text-[10px] text-slate-500">
                {lastSyncAt ? `${t("app.lastSync")} ${new Date(lastSyncAt).toLocaleTimeString()}` : ""}
                {lastSyncError ? ` • ${t("app.syncError")} (${lastSyncError})` : ""}
                {nextSyncRetryAt ? ` • ${t("app.retry")} ${new Date(nextSyncRetryAt).toLocaleTimeString()}` : ""}
                {pendingCount > 0 ? ` • ${t("app.pending")} ${pendingCount}` : ""}
              </div>
            </div>
            <div className="space-y-2">
                <button
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-slate-300 hover:bg-slate-900/60"
                  onClick={() => setFaqOpen(true)}
                >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 18h.01"></path>
                  <path d="M12 15a3 3 0 1 0 -3 -3"></path>
                  <path d="M19.4 15a7 7 0 1 0 -14.8 0"></path>
                </svg>
                {t("rail.faq")}
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-slate-300 hover:bg-slate-900/60"
                onClick={() => setUpdatesOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 5a2 2 0 1 1 4 0a7 7 0 0 1 4 6v3a4 4 0 0 0 2 3h-16a4 4 0 0 0 2 -3v-3a7 7 0 0 1 4 -6"></path>
                  <path d="M9 17v1a3 3 0 0 0 6 0v-1"></path>
                </svg>
                {t("rail.updates")}
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs text-slate-300 hover:bg-slate-900/60"
                onClick={() => setLangOpen(true)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 5h7"></path>
                  <path d="M9 3v2c0 4.418 -2.239 8 -5 8"></path>
                  <path d="M5 9c0 4.418 2.239 8 5 8"></path>
                  <path d="M15 3v2"></path>
                  <path d="M19 3v2"></path>
                  <path d="M15 9c0 1.657 1.343 3 3 3"></path>
                  <path d="M18 12c0 1.657 -1.343 3 -3 3"></path>
                </svg>
                {t("app.language")}
              </button>
            </div>
            </div>
          </div>
        </>
      ) : null}

      {faqOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={() => setFaqOpen(false)}>
          <div className="modal-enter w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="text-sm font-semibold">{t("rail.faq")}</div>
            <div className="mt-3 text-xs text-slate-400">FAQ 內容可放這裡。</div>
            <div className="mt-4 flex justify-end">
              <button className="rounded-lg border border-slate-700 px-3 py-2 text-xs" onClick={() => setFaqOpen(false)}>
                {t("tab.cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {updatesOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={() => setUpdatesOpen(false)}>
          <div className="modal-enter w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="text-sm font-semibold">{t("rail.updates")}</div>
            <div className="mt-3 text-xs text-slate-400">更新通知可放這裡。</div>
            <div className="mt-4 flex justify-end">
              <button className="rounded-lg border border-slate-700 px-3 py-2 text-xs" onClick={() => setUpdatesOpen(false)}>
                {t("tab.cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {langOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4" onClick={() => setLangOpen(false)}>
          <div className="modal-enter w-full max-w-md rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <div className="text-sm font-semibold">{t("app.language")}</div>
            <div className="mt-4 grid grid-cols-1 gap-2 text-xs">
              <button
                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${locale === "zh-TW" ? "border-rose-400 text-white" : "border-slate-700 text-slate-300"} hover:bg-slate-900/60`}
                onClick={() => setLocale("zh-TW")}
              >
                <span>🇹🇼 繁體中文</span>
                {locale === "zh-TW" ? "✓" : ""}
              </button>
              <button
                className={`flex items-center justify-between rounded-lg border px-3 py-2 ${locale === "en" ? "border-rose-400 text-white" : "border-slate-700 text-slate-300"} hover:bg-slate-900/60`}
                onClick={() => setLocale("en")}
              >
                <span>🇺🇸 English</span>
                {locale === "en" ? "✓" : ""}
              </button>
            </div>
            <div className="mt-4 flex justify-end">
              <button className="rounded-lg border border-slate-700 px-3 py-2 text-xs" onClick={() => setLangOpen(false)}>
                {t("tab.cancel")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
