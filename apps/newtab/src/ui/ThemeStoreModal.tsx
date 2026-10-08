import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Check, Layers3, Loader2, Paintbrush2, Palette, RefreshCw, Sparkles, Store, X } from "lucide-react";
import { useLocale } from "../i18n";
import {
  TEMPLATE_PRESETS,
  THEME_PRESETS,
  type CustomThemeDraft,
  type ThemeTokenSet,
} from "../theme/catalog";
import type { ThemeMarketplaceAsset, ThemeMarketplaceEntitlements } from "../services/themeStore";

type Props = {
  open: boolean;
  selectedThemeId: string;
  selectedTemplateId: string;
  selectedThemeMode: "preset" | "asset";
  selectedThemeAssetId: string | null;
  previewTokens: ThemeTokenSet;
  customTheme: CustomThemeDraft | null;
  marketThemes: ThemeMarketplaceAsset[];
  marketThemeEntitlements: ThemeMarketplaceEntitlements;
  marketLoading?: boolean;
  marketError?: string;
  isApplying?: boolean;
  onClose: () => void;
  onSelectPresetTheme: (themeId: string) => void | Promise<void>;
  onApplyMarketplaceTheme: (asset: ThemeMarketplaceAsset) => void | Promise<void>;
  onRequestThemePurchase: (asset: ThemeMarketplaceAsset) => void;
  onSelectTemplate: (templateId: string) => void;
  onSaveCustomTheme: (draft: CustomThemeDraft | null) => void;
  onRefreshMarketplace?: () => void | Promise<void>;
};

type TabKey = "themes" | "templates" | "custom";

export function ThemeStoreModal({
  open,
  selectedThemeId,
  selectedTemplateId,
  selectedThemeMode,
  selectedThemeAssetId,
  previewTokens,
  customTheme,
  marketThemes,
  marketThemeEntitlements,
  marketLoading = false,
  marketError = "",
  isApplying = false,
  onClose,
  onSelectPresetTheme,
  onApplyMarketplaceTheme,
  onRequestThemePurchase,
  onSelectTemplate,
  onSaveCustomTheme,
  onRefreshMarketplace,
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

  const customEnabled = useMemo(
    () => Object.values(customTheme ?? {}).some((value) => typeof value === "string" && value.trim().length > 0),
    [customTheme]
  );

  if (!open) {
    return null;
  }

  const creatorPortalUrl = "https://tab-extension-gamma.vercel.app/creator/#/";

  return (
    <div className="fixed inset-0 z-[10000] bg-black/60 p-4">
      <div className="mx-auto flex h-full w-full max-w-6xl items-center justify-center">
        <div className="relative max-h-[92vh] w-full overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-2xl">
          <button
            className="absolute right-4 top-4 z-20 rounded-full border border-zinc-200 bg-white p-2 text-zinc-500 hover:text-zinc-900"
            onClick={onClose}
            aria-label={locale === "en" ? "Close" : "關閉"}
            title={locale === "en" ? "Close" : "關閉"}
          >
            <X className="h-4 w-4" />
          </button>

          <div className="border-b border-zinc-200 bg-[radial-gradient(circle_at_top_left,_rgba(244,63,94,0.18),_transparent_38%),linear-gradient(135deg,_#111827_0%,_#0f172a_60%,_#111827_100%)] px-6 py-6 text-white">
            <div className="flex flex-wrap items-center gap-2 text-[11px]">
              <Pill icon={<Store className="h-3.5 w-3.5" />} text={locale === "en" ? "Theme Store" : "主題商店"} />
              <Pill
                icon={<Sparkles className="h-3.5 w-3.5" />}
                text={locale === "en" ? "Official + creator works" : "官方與創作者作品"}
              />
              {isApplying ? (
                <Pill icon={<Loader2 className="h-3.5 w-3.5 animate-spin" />} text={locale === "en" ? "Applying" : "套用中"} />
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">{locale === "en" ? "Style your workspace" : "替你的工作區換一套皮膚"}</h2>
                <p className="mt-2 max-w-3xl text-sm text-zinc-300">
                  {locale === "en"
                    ? "Official presets, creator marketplace themes, templates, and custom overrides all live here."
                    : "官方主題、創作者主題、模板與自訂覆寫都集中在這裡，先把外觀這條線走穩。"}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {onRefreshMarketplace ? (
                  <button
                    className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
                    onClick={() => void onRefreshMarketplace()}
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${marketLoading ? "animate-spin" : ""}`} />
                    {locale === "en" ? "Refresh" : "重新整理"}
                  </button>
                ) : null}
                <a
                  className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs text-white hover:bg-white/20"
                  href={creatorPortalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Store className="h-3.5 w-3.5" />
                  {locale === "en" ? "Creator Portal" : "創作者後台"}
                </a>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <TabButton active={tab === "themes"} onClick={() => setTab("themes")} icon={<Palette className="h-3.5 w-3.5" />}>
                {locale === "en" ? "Themes" : "主題"}
              </TabButton>
              <TabButton
                active={tab === "templates"}
                onClick={() => setTab("templates")}
                icon={<Layers3 className="h-3.5 w-3.5" />}
              >
                {locale === "en" ? "Templates" : "模板"}
              </TabButton>
              <TabButton active={tab === "custom"} onClick={() => setTab("custom")} icon={<Paintbrush2 className="h-3.5 w-3.5" />}>
                {locale === "en" ? "Custom" : "自訂"}
              </TabButton>
            </div>
          </div>

          <div className="max-h-[calc(92vh-176px)] overflow-y-auto px-6 py-6">
            {tab === "themes" ? (
              <div className="space-y-6">
                <section className="space-y-3">
                  <SectionHeading
                    title={locale === "en" ? "Official presets" : "官方預設"}
                    subtitle={locale === "en" ? "Fast, stable, and ready to apply." : "先從穩定耐用的官方預設開始。"}
                  />
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {THEME_PRESETS.map((themeItem) => {
                      const selected = selectedThemeMode === "preset" && selectedThemeId === themeItem.id;
                      return (
                        <ThemeCardShell
                          key={themeItem.id}
                          preview={themeItem.preview}
                          title={themeItem.name}
                          description={themeItem.description}
                          meta={themeItem.isOfficial ? (locale === "en" ? "Official" : "官方") : `${locale === "en" ? "By" : "作者"} ${themeItem.author}`}
                          priceLabel={themeItem.priceTwd > 0 ? `NT$ ${themeItem.priceTwd}` : locale === "en" ? "Free" : "免費"}
                          selected={selected}
                          action={
                            <button
                              className={getActionButtonClass(selected)}
                              onClick={() => {
                                void onSelectPresetTheme(themeItem.id);
                              }}
                              disabled={isApplying}
                            >
                              {selected ? <Check className="h-3.5 w-3.5" /> : <Paintbrush2 className="h-3.5 w-3.5" />}
                              {selected ? (locale === "en" ? "Applied" : "已套用") : locale === "en" ? "Apply" : "套用"}
                            </button>
                          }
                        />
                      );
                    })}
                  </div>
                </section>

                <section className="space-y-3">
                  <SectionHeading
                    title={locale === "en" ? "Creator marketplace" : "創作者市集"}
                    subtitle={
                      locale === "en"
                        ? "Public themes published from Creator Portal."
                        : "這裡只顯示公開上架的主題。付費主題會走 PAYUNi，免費主題可直接安裝與套用。"
                    }
                  />
                  {marketError ? <MessageBox tone="error">{marketError}</MessageBox> : null}
                  {!marketLoading && marketThemes.length === 0 ? (
                    <MessageBox tone="info">{locale === "en" ? "No public creator themes yet." : "目前還沒有公開的創作者主題。"}</MessageBox>
                  ) : null}
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {marketThemes.map((asset) => {
                      const isSelected = selectedThemeMode === "asset" && selectedThemeAssetId === asset.id;
                      const isInstalled = marketThemeEntitlements.installedIds.has(asset.id);
                      const isPurchased = marketThemeEntitlements.purchasedIds.has(asset.id);
                      const isActive = marketThemeEntitlements.activeAssetId === asset.id || isSelected;
                      const canApply = asset.priceTwd <= 0 || isPurchased;

                      return (
                        <ThemeCardShell
                          key={asset.id}
                          preview={asset.preview}
                          title={asset.name}
                          description={asset.description}
                          meta={`${asset.isOfficial ? (locale === "en" ? "Official" : "官方") : asset.authorName} · ${formatDate(asset.updatedAt)}`}
                          priceLabel={asset.priceTwd > 0 ? `NT$ ${asset.priceTwd}` : locale === "en" ? "Free" : "免費"}
                          selected={isSelected}
                          tags={[
                            asset.isOfficial ? (locale === "en" ? "Official" : "官方") : asset.authorName,
                            ...asset.tags.slice(0, 2),
                            isInstalled ? (locale === "en" ? "Installed" : "已安裝") : null,
                            isPurchased ? (locale === "en" ? "Purchased" : "已購買") : null,
                          ]}
                          action={
                            canApply ? (
                              <button
                                className={getActionButtonClass(isActive)}
                                onClick={() => {
                                  void onApplyMarketplaceTheme(asset);
                                }}
                                disabled={isApplying}
                              >
                                {isActive ? <Check className="h-3.5 w-3.5" /> : <Paintbrush2 className="h-3.5 w-3.5" />}
                                {isActive
                                  ? locale === "en"
                                    ? "Applied"
                                    : "已套用"
                                  : isInstalled
                                    ? locale === "en"
                                      ? "Apply"
                                      : "套用"
                                    : locale === "en"
                                      ? "Install & apply"
                                      : "安裝並套用"}
                              </button>
                            ) : (
                              <button
                                className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                                onClick={() => onRequestThemePurchase(asset)}
                              >
                                <Store className="h-3.5 w-3.5" />
                                {locale === "en" ? "Purchase" : "購買"}
                              </button>
                            )
                          }
                        />
                      );
                    })}
                  </div>
                </section>
              </div>
            ) : null}

            {tab === "templates" ? (
              <div className="space-y-3">
                <SectionHeading
                  title={locale === "en" ? "Layout templates" : "版型模板"}
                  subtitle={locale === "en" ? "Controls density and card width." : "先控制密度、欄數與卡片寬度，這條線先不碰可販售模板。"}
                />
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {TEMPLATE_PRESETS.map((templateItem) => {
                    const selected = selectedTemplateId === templateItem.id;
                    return (
                      <div key={templateItem.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-semibold text-zinc-900">{templateItem.name}</div>
                            <div className="mt-1 text-xs text-zinc-500">{templateItem.description}</div>
                            <div className="mt-2 text-[11px] text-zinc-400">
                              {templateItem.isOfficial ? (locale === "en" ? "Official" : "官方") : `${locale === "en" ? "By" : "作者"} ${templateItem.author}`}
                            </div>
                          </div>
                          <span className="rounded-full border border-zinc-200 px-2 py-1 text-[10px] text-zinc-500">
                            {templateItem.priceTwd > 0 ? `NT$ ${templateItem.priceTwd}` : locale === "en" ? "Free" : "免費"}
                          </span>
                        </div>
                        <div className="mt-3 rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-3">
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
                              <div key={index} className="h-6 rounded-xl bg-zinc-200/80" />
                            ))}
                          </div>
                        </div>
                        <button className={getActionButtonClass(selected, "mt-3")} onClick={() => onSelectTemplate(templateItem.id)}>
                          {selected ? <Check className="h-3.5 w-3.5" /> : <Layers3 className="h-3.5 w-3.5" />}
                          {selected ? (locale === "en" ? "Applied" : "已套用") : locale === "en" ? "Apply" : "套用"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {tab === "custom" ? (
              <div className="space-y-4">
                <SectionHeading
                  title={locale === "en" ? "Custom overrides" : "自訂覆寫"}
                  subtitle={
                    locale === "en"
                      ? "Supports plain color, gradient, and image backgrounds via CSS background values."
                      : "支援純色、漸層與背景圖片。這裡先用 CSS background 值走通，不額外做一套自訂編輯器。"
                  }
                />
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  <SurfaceField
                    label={locale === "en" ? "Global background" : "整體背景"}
                    value={draft.background ?? ""}
                    onChange={(value) => setDraft((prev) => ({ ...prev, background: value }))}
                  />
                  <SurfaceField
                    label={locale === "en" ? "Default panel" : "預設面板"}
                    value={draft.panel ?? ""}
                    onChange={(value) => setDraft((prev) => ({ ...prev, panel: value }))}
                  />
                  <SurfaceField
                    label={locale === "en" ? "Left panel" : "左欄背景"}
                    value={draft.leftPanelBackground ?? ""}
                    onChange={(value) => setDraft((prev) => ({ ...prev, leftPanelBackground: value }))}
                  />
                  <SurfaceField
                    label={locale === "en" ? "Main panel" : "主欄背景"}
                    value={draft.mainPanelBackground ?? ""}
                    onChange={(value) => setDraft((prev) => ({ ...prev, mainPanelBackground: value }))}
                  />
                  <SurfaceField
                    label={locale === "en" ? "Right panel" : "右欄背景"}
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
                    label={locale === "en" ? "Muted text" : "次要文字"}
                    value={draft.textMuted ?? ""}
                    onChange={(value) => setDraft((prev) => ({ ...prev, textMuted: value }))}
                  />
                  <ColorField
                    label={locale === "en" ? "Border" : "邊框"}
                    value={draft.border ?? ""}
                    onChange={(value) => setDraft((prev) => ({ ...prev, border: value }))}
                  />
                  <ColorField
                    label={locale === "en" ? "Accent" : "強調色"}
                    value={draft.accent ?? ""}
                    onChange={(value) => setDraft((prev) => ({ ...prev, accent: value }))}
                  />
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-600">
                  <div className="font-medium text-zinc-900">{locale === "en" ? "Accepted examples" : "可用範例"}</div>
                  <div className="mt-2 space-y-1">
                    <div>`#0f172a`</div>
                    <div>`linear-gradient(135deg, #0f172a 0%, #1e293b 100%)`</div>
                    <div>`url(https://...) center / cover no-repeat`</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white" onClick={() => onSaveCustomTheme(draft)}>
                    {locale === "en" ? "Apply custom theme" : "套用自訂主題"}
                  </button>
                  <button
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    onClick={() => onSaveCustomTheme(null)}
                  >
                    {locale === "en" ? "Reset custom theme" : "清除自訂覆寫"}
                  </button>
                  <span className="text-xs text-zinc-500">
                    {customEnabled
                      ? locale === "en"
                        ? "Custom overrides are active."
                        : "目前已啟用自訂覆寫。"
                      : locale === "en"
                        ? "Using the selected theme as-is."
                        : "目前直接使用選中的主題設定。"}
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function Pill({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2 py-1">
      {icon}
      {text}
    </span>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 ${
        active ? "bg-white text-zinc-900" : "border border-white/20 bg-white/10 text-white"
      }`}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}

function SectionHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div>
      <div className="text-sm font-semibold text-zinc-900">{title}</div>
      <div className="mt-1 text-xs text-zinc-500">{subtitle}</div>
    </div>
  );
}

function ThemeCardShell({
  preview,
  title,
  description,
  meta,
  priceLabel,
  selected,
  action,
  tags = [],
}: {
  preview: string;
  title: string;
  description: string;
  meta: string;
  priceLabel: string;
  selected: boolean;
  action: ReactNode;
  tags?: Array<string | null>;
}) {
  return (
    <div className={`rounded-2xl border bg-white p-3 ${selected ? "border-rose-300 shadow-md shadow-rose-100/60" : "border-zinc-200"}`}>
      <div className="h-24 rounded-2xl border border-zinc-200" style={{ background: preview }} />
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-zinc-900">{title}</div>
          <div className="mt-1 line-clamp-2 text-xs text-zinc-500">{description}</div>
          <div className="mt-2 text-[11px] text-zinc-400">{meta}</div>
          {tags.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {tags.filter(Boolean).map((tag) => (
                <span key={tag} className="rounded-full bg-zinc-100 px-2 py-1 text-[10px] text-zinc-500">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <div className="shrink-0 text-right">
          <div className="text-xs font-semibold text-zinc-700">{priceLabel}</div>
          <div className="mt-2">{action}</div>
        </div>
      </div>
    </div>
  );
}

function MessageBox({ tone, children }: { tone: "info" | "error"; children: ReactNode }) {
  return (
    <div
      className={`rounded-2xl border px-4 py-3 text-xs ${
        tone === "error" ? "border-rose-200 bg-rose-50 text-rose-700" : "border-zinc-200 bg-zinc-50 text-zinc-600"
      }`}
    >
      {children}
    </div>
  );
}

function getActionButtonClass(selected: boolean, extraClassName = "") {
  return `inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium ${
    selected ? "bg-emerald-50 text-emerald-700" : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
  } ${extraClassName}`.trim();
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--";
  }
  return date.toLocaleDateString("zh-TW", {
    month: "2-digit",
    day: "2-digit",
  });
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
          className="h-10 w-11 rounded-xl border border-zinc-200 bg-white p-1"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#0f172a"
          className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-300/40"
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
          className="h-10 w-11 rounded-xl border border-zinc-200 bg-white p-1"
        />
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="#0f172a / linear-gradient(...) / url(...) center / cover no-repeat"
          className="h-10 min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 text-xs text-zinc-700 focus:outline-none focus:ring-2 focus:ring-zinc-300/40"
        />
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
