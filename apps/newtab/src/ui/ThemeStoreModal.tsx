import { useEffect, useMemo, useState } from "react";
import { Check, Layers3, Loader2, Paintbrush2, Palette, Sparkles, Store, X } from "lucide-react";
import { useLocale } from "../i18n";
import {
  TEMPLATE_PRESETS,
  THEME_PRESETS,
  type CustomThemeDraft,
  type ThemeTokenSet,
} from "../theme/catalog";

type Props = {
  open: boolean;
  selectedThemeId: string;
  selectedTemplateId: string;
  previewTokens: ThemeTokenSet;
  customTheme: CustomThemeDraft | null;
  isApplying?: boolean;
  onClose: () => void;
  onSelectTheme: (themeId: string) => void | Promise<void>;
  onSelectTemplate: (templateId: string) => void;
  onSaveCustomTheme: (draft: CustomThemeDraft | null) => void;
};

type TabKey = "themes" | "templates";

export function ThemeStoreModal({
  open,
  selectedThemeId,
  selectedTemplateId,
  previewTokens,
  customTheme,
  isApplying = false,
  onClose,
  onSelectTheme,
  onSelectTemplate,
  onSaveCustomTheme,
}: Props) {
  const { locale } = useLocale();
  const [tab, setTab] = useState<TabKey>("themes");
  const [draft, setDraft] = useState<CustomThemeDraft>({});

  useEffect(() => {
    if (!open) {
      return;
    }
    setDraft(customTheme ?? previewTokens);
  }, [customTheme, open, previewTokens]);

const customIsEnabled = useMemo(
    () =>
      Boolean(
        customTheme &&
          Object.values(customTheme).some((value) => typeof value === "string" && value.trim().length > 0)
      ),
    [customTheme]
  );

  if (!open) {
    return null;
  }

  const title = locale === "en" ? "Theme Store" : "主題商店";
  const creatorPortalUrl = "https://tab-extension-gamma.vercel.app/creator/";

  return (
    <div className="fixed inset-0 z-[10000] bg-black/55 p-4">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-center">
        <div className="modal-enter relative max-h-[92vh] w-full overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-2xl">
          <button
            className="absolute right-4 top-4 z-20 rounded-full border border-zinc-200 bg-white p-2 text-zinc-500 hover:text-zinc-700"
            onClick={onClose}
            aria-label={locale === "en" ? "Close" : "關閉"}
            title={locale === "en" ? "Close" : "關閉"}
          >
            <X className="h-4 w-4" />
          </button>

          <div className="border-b border-zinc-200 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-800 px-6 py-6 text-white">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-1">
                <Store className="h-3.5 w-3.5" />
                {title}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-1">
                <Sparkles className="h-3.5 w-3.5" />
                {locale === "en" ? "Creator economy ready" : "可上架分潤"}
              </span>
            </div>
            <h2 className="mt-3 text-2xl font-semibold">{locale === "en" ? "Style your dashboard" : "自訂你的儀錶板風格"}</h2>
            <p className="mt-2 max-w-3xl text-sm text-zinc-300">
              {locale === "en"
                ? "Choose a visual theme and a layout template. Community creators can publish paid packs in future releases."
                : "可分別選擇主題與模板。後續可接上創作者上架與分潤機制。"}
            </p>
            <div className="mt-3">
              <a
                className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
                href={creatorPortalUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Store className="h-3.5 w-3.5" />
                {locale === "en" ? "Creator Portal" : "創作者上架"}
              </a>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <button
                className={`rounded-full px-3 py-1.5 ${
                  tab === "themes" ? "bg-white text-zinc-900" : "border border-white/20 bg-white/10 text-white"
                }`}
                onClick={() => setTab("themes")}
              >
                <span className="inline-flex items-center gap-1">
                  <Palette className="h-3.5 w-3.5" />
                  {locale === "en" ? "Themes" : "主題"}
                </span>
              </button>
              <button
                className={`rounded-full px-3 py-1.5 ${
                  tab === "templates" ? "bg-white text-zinc-900" : "border border-white/20 bg-white/10 text-white"
                }`}
                onClick={() => setTab("templates")}
              >
                <span className="inline-flex items-center gap-1">
                  <Layers3 className="h-3.5 w-3.5" />
                  {locale === "en" ? "Templates" : "模板"}
                </span>
              </button>
            </div>
            {isApplying ? (
              <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] text-white">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {locale === "en" ? "Applying theme..." : "套用主題中..."}
              </div>
            ) : null}
          </div>

          <div className="max-h-[calc(92vh-160px)] overflow-y-auto px-6 py-6">
            {tab === "themes" ? (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {THEME_PRESETS.map((themeItem) => {
                    const selected = selectedThemeId === themeItem.id;
                    return (
                      <div key={themeItem.id} className="rounded-2xl border border-zinc-200 bg-white p-3">
                        <div
                          className="h-24 rounded-xl border border-zinc-200"
                          style={{ background: themeItem.preview }}
                        />
                        <div className="mt-3 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-zinc-900">{themeItem.name}</div>
                            <div className="mt-1 text-xs text-zinc-500">{themeItem.description}</div>
                            <div className="mt-2 text-[11px] text-zinc-400">
                              {themeItem.isOfficial
                                ? locale === "en"
                                  ? "Official"
                                  : "官方"
                                : locale === "en"
                                  ? `By ${themeItem.author}`
                                  : `作者 ${themeItem.author}`}
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <div className="text-xs font-semibold text-zinc-700">
                              {themeItem.priceTwd > 0 ? `NT$ ${themeItem.priceTwd}` : locale === "en" ? "Free" : "免費"}
                            </div>
                            <button
                              className={`mt-2 inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs ${
                                selected
                                  ? "bg-emerald-50 text-emerald-700"
                                  : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                              }`}
                              onClick={() => {
                                void onSelectTheme(themeItem.id);
                              }}
                              disabled={isApplying}
                            >
                              {selected ? <Check className="h-3.5 w-3.5" /> : <Paintbrush2 className="h-3.5 w-3.5" />}
                              {selected ? (locale === "en" ? "Applied" : "已套用") : locale === "en" ? "Apply" : "套用"}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                    <Palette className="h-4 w-4 text-zinc-600" />
                    {locale === "en" ? "Custom theme surfaces" : "自訂主題樣式"}
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {locale === "en"
                      ? "Supports color, gradient, and image background (url(...)) for each panel."
                      : "支援顏色、漸層、背景圖片（url(...)），可分別設定左側、主內容、右側面板。"}
                  </p>
                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                    <SurfaceField
                      label={locale === "en" ? "Global background" : "整體背景"}
                      value={draft.background ?? ""}
                      onChange={(value) => setDraft((prev) => ({ ...prev, background: value }))}
                    />
                    <SurfaceField
                      label={locale === "en" ? "Default panel fallback" : "通用面板背景（回退）"}
                      value={draft.panel ?? ""}
                      onChange={(value) => setDraft((prev) => ({ ...prev, panel: value }))}
                    />
                    <SurfaceField
                      label={locale === "en" ? "Left panel" : "左側面板"}
                      value={draft.leftPanelBackground ?? ""}
                      onChange={(value) => setDraft((prev) => ({ ...prev, leftPanelBackground: value }))}
                    />
                    <SurfaceField
                      label={locale === "en" ? "Main panel" : "主內容面板"}
                      value={draft.mainPanelBackground ?? ""}
                      onChange={(value) => setDraft((prev) => ({ ...prev, mainPanelBackground: value }))}
                    />
                    <SurfaceField
                      label={locale === "en" ? "Right panel" : "右側面板"}
                      value={draft.rightPanelBackground ?? ""}
                      onChange={(value) => setDraft((prev) => ({ ...prev, rightPanelBackground: value }))}
                    />
                    <SurfaceField
                      label={locale === "en" ? "Dock background" : "Dock 背景"}
                      value={draft.panelMuted ?? ""}
                      onChange={(value) => setDraft((prev) => ({ ...prev, panelMuted: value }))}
                    />
                    <ColorField
                      label={locale === "en" ? "Text" : "文字"}
                      value={draft.text ?? ""}
                      onChange={(value) => setDraft((prev) => ({ ...prev, text: value }))}
                    />
                    <ColorField
                      label={locale === "en" ? "Sub text" : "次文字"}
                      value={draft.textMuted ?? ""}
                      onChange={(value) => setDraft((prev) => ({ ...prev, textMuted: value }))}
                    />
                    <ColorField
                      label={locale === "en" ? "Accent" : "強調色"}
                      value={draft.accent ?? ""}
                      onChange={(value) => setDraft((prev) => ({ ...prev, accent: value }))}
                    />
                  </div>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button
                      className="rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white"
                      onClick={() => onSaveCustomTheme(draft)}
                    >
                      {locale === "en" ? "Apply custom theme" : "套用自訂主題"}
                    </button>
                    <button
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-600 hover:bg-zinc-100"
                      onClick={() => onSaveCustomTheme(null)}
                    >
                      {locale === "en" ? "Reset custom" : "清除自訂"}
                    </button>
                    <span className="text-xs text-zinc-500">
                      {customIsEnabled
                        ? locale === "en"
                          ? "Custom style is active."
                          : "目前啟用自訂樣式。"
                        : locale === "en"
                          ? "Using preset style."
                          : "目前使用預設樣式。"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {TEMPLATE_PRESETS.map((templateItem) => {
                  const selected = selectedTemplateId === templateItem.id;
                  return (
                    <div key={templateItem.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-semibold text-zinc-900">{templateItem.name}</div>
                          <div className="mt-1 text-xs text-zinc-500">{templateItem.description}</div>
                          <div className="mt-2 text-[11px] text-zinc-400">
                            {templateItem.isOfficial
                              ? locale === "en"
                                ? "Official"
                                : "官方"
                              : locale === "en"
                                ? `By ${templateItem.author}`
                                : `作者 ${templateItem.author}`}
                          </div>
                        </div>
                        <span className="rounded-full border border-zinc-200 px-2 py-1 text-[10px] text-zinc-500">
                          {templateItem.priceTwd > 0 ? `NT$ ${templateItem.priceTwd}` : locale === "en" ? "Free" : "免費"}
                        </span>
                      </div>
                      <div className="mt-3 rounded-xl border border-dashed border-zinc-200 bg-zinc-50 p-3">
                        <div
                          className="grid gap-2"
                          style={{
                            gridTemplateColumns:
                              templateItem.density === "focused"
                                ? "repeat(2,minmax(0,1fr))"
                                : templateItem.density === "compact"
                                  ? "repeat(4,minmax(0,1fr))"
                                  : "repeat(3,minmax(0,1fr))",
                          }}
                        >
                          {Array.from({ length: templateItem.density === "focused" ? 4 : 8 }).map((_, index) => (
                            <div key={index} className="h-6 rounded-md bg-zinc-200/80" />
                          ))}
                        </div>
                      </div>
                      <button
                        className={`mt-3 inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs ${
                          selected
                            ? "bg-emerald-50 text-emerald-700"
                            : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                        }`}
                        onClick={() => onSelectTemplate(templateItem.id)}
                      >
                        {selected ? <Check className="h-3.5 w-3.5" /> : <Layers3 className="h-3.5 w-3.5" />}
                        {selected ? (locale === "en" ? "Applied" : "已套用") : locale === "en" ? "Apply" : "套用"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] text-zinc-500">{label}</div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={toColorValue(value)}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-10 rounded-lg border border-zinc-200 bg-white p-1"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#0f172a"
          className="h-9 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-300/40"
        />
      </div>
    </label>
  );
}

function SurfaceField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <div className="mb-1 text-[11px] text-zinc-500">{label}</div>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={toColorValue(value)}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 w-10 rounded-lg border border-zinc-200 bg-white p-1"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#0f172a / linear-gradient(...) / url(...) center / cover no-repeat"
          className="h-9 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-300/40"
        />
      </div>
      <div className="mt-1 text-[10px] text-zinc-400">
        #hex、linear-gradient(...)、url(...) 都可直接輸入
      </div>
    </label>
  );
}

function toColorValue(value: string) {
  const color = value.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(color)) {
    return color;
  }
  if (/^#[0-9a-fA-F]{3}$/.test(color)) {
    const [r, g, b] = color.slice(1).split("");
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  return "#0f172a";
}
