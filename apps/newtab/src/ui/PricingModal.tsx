import { useMemo, useState } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { useLocale } from "../i18n";

export type PricingPlanId = "personal_yearly" | "team" | "enterprise";

type Tier = {
  id: PricingPlanId;
  name: string;
  description: string;
  priceMain: string;
  priceSuffix: {
    strike?: string;
    text: string;
  };
  highlight?: boolean;
  cta: string;
  note?: string;
  noteStrike?: boolean;
  features: string[];
};

type FeatureRow = {
  label: string;
  personal: boolean | string;
  team: boolean | string;
  enterprise: boolean | string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelectPlan: (planId: PricingPlanId) => void;
};

export function PricingModal({ open, onClose, onSelectPlan }: Props) {
  const { locale } = useLocale();
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");

  const personalStrike = billing === "yearly" ? "99" : "29";

  const tiers = useMemo<Tier[]>(
    () => [
      {
        id: "personal_yearly",
        name: locale === "en" ? "Personal" : "個人版",
        description:
          locale === "en"
            ? "Built for long-term solo usage. Includes a full 60-day trial."
            : "適合個人長期使用，低價格擴散的主力方案，直接內含 60 天試用。",
        priceMain: locale === "en" ? "NT$ 0" : "NT$ 0",
        priceSuffix:
          locale === "en"
            ? {
                strike: personalStrike,
                text: "/ month (60-day trial)",
              }
            : {
                strike: personalStrike,
                text: "/ 月（60天試用）",
              },
        highlight: true,
        cta: locale === "en" ? "Upgrade this plan" : "升級此方案",
        note: locale === "en" ? "Original NT$49/mo" : "原價 NT$49/月",
        noteStrike: true,
        features: [
          locale === "en" ? "60-day full trial included" : "內含 60 天免費試用",
          locale === "en" ? "Solo usage with unlimited spaces/collections" : "單人使用，不限集合與空間數量",
          locale === "en" ? "Google Drive sync" : "Google Drive 同步",
          locale === "en" ? "Priority updates" : "優先更新",
          locale === "en" ? "Local-first and low-cost architecture" : "本地優先，低成本維持長期使用",
        ],
      },
      {
        id: "team",
        name: locale === "en" ? "Team" : "團隊版",
        description:
          locale === "en"
            ? "Great for studios and small collaborative teams."
            : "適合小型團隊、工作室、接案團隊與內部共享知識空間。",
        priceMain: locale === "en" ? "NT$ 129" : "NT$ 129",
        priceSuffix: { text: locale === "en" ? "/ month" : "/ 月" },
        cta: locale === "en" ? "Start team plan" : "開始團隊方案",
        note: locale === "en" ? "Original NT$149/mo" : "原價 NT$149/月",
        noteStrike: true,
        features: [
          locale === "en" ? "Shared workspaces" : "共享 Workspace",
          locale === "en" ? "Multi-member collaboration" : "多人協作與角色權限",
          locale === "en" ? "Data on managed backend" : "資料改存自家後端，不再以個人 Drive 為主",
          locale === "en" ? "Admin console and invite controls" : "管理員後台、邀請管理、基本活動紀錄",
          locale === "en" ? "Centralized billing" : "集中計費",
        ],
      },
      {
        id: "enterprise",
        name: locale === "en" ? "Enterprise" : "企業版",
        description:
          locale === "en"
            ? "For orgs requiring policy control, audit, and onboarding support."
            : "需要團隊協作、權限控管、安全稽核與導入支援的組織。",
        priceMain: locale === "en" ? "Custom" : "客製",
        priceSuffix: { text: locale === "en" ? "quote" : "報價" },
        cta: locale === "en" ? "Contact us" : "聯絡我們",
        note: locale === "en" ? "Starts at NT$6,000/year" : "NT$6,000 / 年起",
        features: [
          locale === "en" ? "Enterprise permission policies" : "企業級權限與管理規則",
          locale === "en" ? "SSO and audit logs" : "SSO / 稽核記錄",
          locale === "en" ? "Centralized billing and procurement support" : "集中計費、帳務與採購支援",
          locale === "en" ? "Backup and account lifecycle controls" : "資料備份策略、匯出限制與成員停權流程",
          locale === "en" ? "Dedicated onboarding support" : "專屬支援與導入協助",
        ],
      },
    ],
    [locale, personalStrike]
  );

  const comparisonRows = useMemo<FeatureRow[]>(
    () => [
      {
        label: locale === "en" ? "Target users" : "適合對象",
        personal: locale === "en" ? "Heavy solo users" : "單人重度使用者",
        team: locale === "en" ? "Small teams / studios" : "小型團隊 / 工作室",
        enterprise: locale === "en" ? "Mid-to-large orgs" : "中大型企業 / 部門",
      },
      {
        label: locale === "en" ? "Monthly price" : "月付價格",
        personal:
          locale === "en"
            ? "NT$ 0 (trial) / then renewal pricing"
            : "NT$ 0（60天試用）/ 試用後續約價",
        team: locale === "en" ? "NT$129 / month" : "NT$129 / 月",
        enterprise: locale === "en" ? "Custom quote" : "客製報價",
      },
      {
        label: locale === "en" ? "Yearly price" : "年付價格",
        personal: locale === "en" ? "NT$99 / year" : "NT$99 / 年",
        team: locale === "en" ? "Team billing package" : "依團隊方案計價",
        enterprise: locale === "en" ? "Custom quote" : "客製報價",
      },
      {
        label: locale === "en" ? "New tab dashboard" : "新分頁頁面",
        personal: true,
        team: true,
        enterprise: true,
      },
      {
        label: locale === "en" ? "Side panel management" : "側邊欄管理",
        personal: true,
        team: true,
        enterprise: true,
      },
      {
        label: locale === "en" ? "Nested folders and drag sort" : "拖拉排序 / 多層資料夾",
        personal: true,
        team: true,
        enterprise: true,
      },
      {
        label: locale === "en" ? "Basic search" : "基本搜尋",
        personal: true,
        team: true,
        enterprise: true,
      },
      {
        label: locale === "en" ? "Google Drive sync" : "Google Drive 同步",
        personal: true,
        team: locale === "en" ? "Controlled backup/import only" : "受控備份 / 匯入來源",
        enterprise: locale === "en" ? "Enterprise controlled backup" : "企業受控備份",
      },
      {
        label: locale === "en" ? "Shared workspace" : "共享 Workspace",
        personal: false,
        team: true,
        enterprise: true,
      },
      {
        label: locale === "en" ? "Multi-member editing" : "多人編輯",
        personal: false,
        team: true,
        enterprise: true,
      },
      {
        label: locale === "en" ? "Role permissions" : "角色權限",
        personal: false,
        team: locale === "en" ? "Basic" : "基本",
        enterprise: locale === "en" ? "Advanced" : "進階",
      },
      {
        label: locale === "en" ? "Admin console" : "管理員後台",
        personal: false,
        team: true,
        enterprise: true,
      },
      {
        label: locale === "en" ? "Audit logs" : "活動紀錄",
        personal: false,
        team: locale === "en" ? "Basic" : "基本",
        enterprise: locale === "en" ? "Advanced audit" : "進階稽核",
      },
      {
        label: locale === "en" ? "SSO" : "SSO / 企業登入",
        personal: false,
        team: false,
        enterprise: true,
      },
      {
        label: locale === "en" ? "Dedicated support" : "專屬支援 / 導入",
        personal: false,
        team: locale === "en" ? "Priority support" : "優先支援",
        enterprise: true,
      },
    ],
    [locale]
  );

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black/55 p-6">
      <div className="mx-auto w-full max-w-7xl rounded-[32px] bg-black/10 p-4 md:p-6">
        <div className="relative overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-2xl">
          <button
            className="absolute right-4 top-4 z-10 rounded-full border border-zinc-200 bg-white p-2 text-zinc-500 hover:text-zinc-700"
            onClick={onClose}
            aria-label={locale === "en" ? "Close" : "關閉"}
          >
            <X className="h-4 w-4" />
          </button>

          <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 px-6 py-10 text-white">
            <div className="mx-auto max-w-3xl text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
                <Sparkles className="h-4 w-4 text-rose-200" />
                {locale === "en" ? "Upgrade your workspace" : "升級你的工作台"}
              </div>
              <h2 className="text-3xl font-semibold">
                {locale === "en" ? "Pricing that grows with your workflow" : "隨需求成長的方案"}
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-300">
                {locale === "en"
                  ? "Choose the plan that matches your stage. Personal stays low-cost with Drive sync; team and enterprise unlock managed collaboration."
                  : "選擇最適合你的方案。個人版維持低價與 Google Drive 同步；團隊與企業版解鎖共享、協作、權限與集中管理。"}
              </p>
              <div className="mt-6 inline-flex items-center gap-1 rounded-full bg-white/10 p-1 text-xs">
                <button
                  className={`rounded-full px-4 py-2 font-semibold ${
                    billing === "monthly" ? "bg-white text-slate-900" : "text-slate-300"
                  }`}
                  onClick={() => setBilling("monthly")}
                >
                  {locale === "en" ? "Monthly" : "月付"}
                </button>
                <button
                  className={`rounded-full px-4 py-2 font-semibold ${
                    billing === "yearly" ? "bg-white text-slate-900" : "text-slate-300"
                  }`}
                  onClick={() => setBilling("yearly")}
                >
                  {locale === "en" ? "Yearly (discount)" : "年付（優惠）"}
                </button>
              </div>
            </div>
          </section>

          <section className="grid gap-6 px-6 py-8 lg:grid-cols-3">
            {tiers.map((tier) => (
              <article
                key={tier.id}
                className={`relative rounded-3xl border p-6 shadow-sm ${
                  tier.highlight ? "border-rose-200 bg-rose-50/70" : "border-zinc-200 bg-white"
                }`}
              >
                {tier.highlight ? (
                  <div className="absolute -top-3 left-6 rounded-full bg-rose-500 px-3 py-1 text-[10px] font-semibold text-white">
                    {locale === "en" ? "Recommended" : "推薦"}
                  </div>
                ) : null}
                <div className="text-base font-semibold text-zinc-900">{tier.name}</div>
                <p className="mt-1 min-h-10 text-xs text-zinc-500">{tier.description}</p>
                <div className="mt-5 flex items-end gap-2">
                  <span className="text-3xl font-semibold text-zinc-900">{tier.priceMain}</span>
                  <span className="text-xs text-zinc-500">
                    {tier.priceSuffix.strike ? (
                      <span className="mr-1 line-through text-zinc-400">{tier.priceSuffix.strike}</span>
                    ) : null}
                    <span>{tier.priceSuffix.text}</span>
                  </span>
                </div>
                {tier.note ? (
                  <div className={`mt-2 text-[11px] text-zinc-400 ${tier.noteStrike ? "line-through" : ""}`}>
                    {tier.note}
                  </div>
                ) : null}
                <button
                  className={`mt-5 inline-flex min-h-[42px] w-full items-center justify-center rounded-xl px-4 py-2 text-xs font-semibold ${
                    tier.highlight
                      ? "bg-rose-500 text-white hover:bg-rose-600"
                      : "border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
                  }`}
                  onClick={() => onSelectPlan(tier.id)}
                >
                  {tier.cta}
                </button>
                <ul className="mt-5 grid gap-2 text-xs text-zinc-600">
                  {tier.features.map((feature) => (
                    <li key={feature} className="grid grid-cols-[16px_1fr] items-start gap-2">
                      <Check className="mt-[1px] h-4 w-4 text-emerald-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </section>

          <section className="border-t border-zinc-200 px-6 pb-10 pt-6">
            <div className="text-sm font-semibold text-zinc-900">
              {locale === "en" ? "Feature comparison" : "功能比較"}
            </div>
            <div className="mt-4 overflow-x-auto rounded-3xl border border-zinc-200">
              <table className="min-w-[920px] w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 text-zinc-500">
                    <th className="border-b border-zinc-200 px-4 py-3 text-left font-semibold">
                      {locale === "en" ? "Item" : "項目"}
                    </th>
                    <th className="border-b border-zinc-200 px-4 py-3 text-center font-semibold">
                      {locale === "en" ? "Personal" : "個人"}
                    </th>
                    <th className="border-b border-zinc-200 px-4 py-3 text-center font-semibold">
                      {locale === "en" ? "Team" : "團隊"}
                    </th>
                    <th className="border-b border-zinc-200 px-4 py-3 text-center font-semibold">
                      {locale === "en" ? "Enterprise" : "企業"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row) => (
                    <tr key={row.label} className="border-t border-zinc-200 text-zinc-600">
                      <th className="px-4 py-3 text-left font-medium text-zinc-900">{row.label}</th>
                      <td className="px-4 py-3 text-center">{renderCell(row.personal)}</td>
                      <td className="px-4 py-3 text-center">{renderCell(row.team)}</td>
                      <td className="px-4 py-3 text-center">{renderCell(row.enterprise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-[11px] text-zinc-400">
              {locale === "en"
                ? "Payments are handled by PAYUNi. Checkout is enabled when API credentials are configured."
                : "付款走統一金流（PAYUNi）。提供 API 後即可啟用結帳流程。"}
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-sm font-semibold text-zinc-900">
                  {locale === "en" ? "Personal plan principle" : "個人版設計原則"}
                </div>
                <p className="mt-2 text-xs text-zinc-600">
                  {locale === "en"
                    ? "Keep personal pricing low by staying local-first and using the member's own cloud storage path."
                    : "維持低價格的關鍵，是把個人版定位成單人整理工具：資料主存於本地與使用者自己的 Google Drive。"}
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                <div className="text-sm font-semibold text-zinc-900">
                  {locale === "en" ? "Team/enterprise principle" : "團隊 / 企業版設計原則"}
                </div>
                <p className="mt-2 text-xs text-zinc-600">
                  {locale === "en"
                    ? "Once collaboration, role permissions, and audit are required, workspace data should move to managed backend infrastructure."
                    : "進入共享 Workspace、多人編輯、角色權限與活動紀錄後，主資料應轉移到自家後端。"}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function renderCell(value: boolean | string) {
  if (typeof value === "string") {
    return <span className="text-zinc-700">{value}</span>;
  }
  if (value) {
    return <Check className="mx-auto h-4 w-4 text-emerald-500" />;
  }
  return <span className="text-zinc-300">—</span>;
}
