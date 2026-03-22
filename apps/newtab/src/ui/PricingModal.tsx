import { useMemo, useState } from "react";
import { Check, X, Sparkles } from "lucide-react";
import { useLocale } from "../i18n";

type Tier = {
  id: "trial" | "personal_yearly" | "pro_monthly" | "enterprise";
  name: string;
  description: string;
  price: string;
  priceSuffix: string;
  highlight?: boolean;
  cta: string;
  note?: string;
  features: string[];
};

type FeatureRow = {
  label: string;
  trial: boolean | string;
  personal_yearly: boolean | string;
  pro_monthly: boolean | string;
  enterprise: boolean | string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSelectPlan: (planId: Tier["id"]) => void;
};

export function PricingModal({ open, onClose, onSelectPlan }: Props) {
  const { locale } = useLocale();
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");

  const tiers = useMemo<Tier[]>(
    () => [
      {
        id: "trial",
        name: locale === "en" ? "Trial" : "試用",
        description: locale === "en" ? "Full access for 60 days." : "完整功能 60 天",
        price: locale === "en" ? "$0" : "NT$0",
        priceSuffix: locale === "en" ? "/60 days" : "/60 天",
        cta: locale === "en" ? "Current plan" : "目前方案",
        note: locale === "en" ? "Auto-upgrade after trial" : "試用到期後需升級",
        features: [
          locale === "en" ? "Workspace + collections" : "組織 / 空間 / 集合",
          locale === "en" ? "Tab save & restore" : "分頁保存與還原",
          locale === "en" ? "Basic sync" : "基本同步",
        ],
      },
      {
        id: "personal_yearly",
        name: locale === "en" ? "Personal" : "個人年費",
        description: locale === "en" ? "Best value for solo users." : "適合個人長期使用",
        price: locale === "en" ? "$99" : "NT$99",
        priceSuffix: locale === "en" ? "/year" : "/年",
        highlight: true,
        cta: locale === "en" ? "Upgrade" : "升級此方案",
        note: locale === "en" ? "Billed yearly" : "年度訂閱",
        features: [
          locale === "en" ? "Everything in Trial" : "含試用所有功能",
          locale === "en" ? "Unlimited collections" : "不限集合數量",
          locale === "en" ? "Drive appData sync" : "Google Drive 同步",
          locale === "en" ? "Priority updates" : "優先更新",
        ],
      },
      {
        id: "enterprise",
        name: locale === "en" ? "Enterprise" : "企業 / 團隊",
        description: locale === "en" ? "Scale with your team." : "需要團隊協作與控管",
        price: locale === "en" ? "Custom" : "客製",
        priceSuffix: locale === "en" ? "pricing" : "報價",
        cta: locale === "en" ? "Contact us" : "聯絡我們",
        note: locale === "en" ? "Team & admin controls" : "團隊與管理功能",
        features: [
          locale === "en" ? "Team workspaces" : "團隊工作空間",
          locale === "en" ? "Admin roles" : "管理者權限",
          locale === "en" ? "SSO & audit logs" : "SSO / 稽核記錄",
          locale === "en" ? "Dedicated support" : "專屬支援",
        ],
      },
    ],
    [locale]
  );

  const comparisonRows = useMemo<FeatureRow[]>(
    () => [
      {
        label: locale === "en" ? "Collections" : "集合數量",
        trial: "20",
        personal_yearly: locale === "en" ? "Unlimited" : "不限",
        pro_monthly: locale === "en" ? "Unlimited" : "不限",
        enterprise: locale === "en" ? "Unlimited" : "不限",
      },
      {
        label: locale === "en" ? "Spaces" : "空間數量",
        trial: "3",
        personal_yearly: locale === "en" ? "Unlimited" : "不限",
        pro_monthly: locale === "en" ? "Unlimited" : "不限",
        enterprise: locale === "en" ? "Unlimited" : "不限",
      },
      {
        label: locale === "en" ? "Drive sync" : "Google Drive 同步",
        trial: false,
        personal_yearly: true,
        pro_monthly: true,
        enterprise: true,
      },
      {
        label: locale === "en" ? "Share links" : "分享連結",
        trial: false,
        personal_yearly: false,
        pro_monthly: true,
        enterprise: true,
      },
      {
        label: locale === "en" ? "Team workspace" : "團隊空間",
        trial: false,
        personal_yearly: false,
        pro_monthly: false,
        enterprise: true,
      },
      {
        label: locale === "en" ? "Priority support" : "優先支援",
        trial: false,
        personal_yearly: true,
        pro_monthly: true,
        enterprise: true,
      },
    ],
    [locale]
  );

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center overflow-y-auto bg-black/60 p-6">
      <div
        className="fixed inset-0"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-6xl overflow-hidden rounded-[28px] border border-zinc-200 bg-white shadow-2xl">
        <div className="absolute right-4 top-4">
          <button
            className="rounded-full border border-zinc-200 bg-white p-2 text-zinc-500 hover:text-zinc-700"
            onClick={onClose}
            aria-label={locale === "en" ? "Close" : "關閉"}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 px-6 py-10 text-white">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs">
              <Sparkles className="h-4 w-4 text-rose-200" />
              {locale === "en" ? "Upgrade your workspace" : "升級你的工作台"}
            </div>
            <h2 className="text-3xl font-semibold">
              {locale === "en" ? "Pricing that grows with you" : "隨需求成長的方案"}
            </h2>
            <p className="mt-3 text-sm text-slate-300">
              {locale === "en"
                ? "Choose a plan that fits your workflow. Trial is limited, paid plans unlock full sync."
                : "選擇最適合你的方案。試用有限制，付費方案解鎖完整同步。"}
            </p>
            <div className="mt-6 inline-flex rounded-full bg-white/10 p-1 text-xs">
              <button
                className={`rounded-full px-4 py-2 ${billing === "monthly" ? "bg-white text-slate-900" : "text-slate-300"}`}
                onClick={() => setBilling("monthly")}
              >
                {locale === "en" ? "Monthly" : "月付"}
              </button>
              <button
                className={`rounded-full px-4 py-2 ${billing === "yearly" ? "bg-white text-slate-900" : "text-slate-300"}`}
                onClick={() => setBilling("yearly")}
              >
                {locale === "en" ? "Yearly" : "年付"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6 px-6 py-8 lg:grid-cols-3">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative flex flex-col rounded-2xl border ${
                tier.highlight ? "border-rose-200 bg-rose-50/40" : "border-zinc-200 bg-white"
              } p-6 shadow-sm`}
            >
              {tier.highlight ? (
                <div className="absolute -top-3 left-6 rounded-full bg-rose-500 px-3 py-1 text-[10px] font-semibold text-white">
                  {locale === "en" ? "Recommended" : "推薦"}
                </div>
              ) : null}
              <div className="text-sm font-semibold text-zinc-900">{tier.name}</div>
              <div className="mt-1 text-xs text-zinc-500">{tier.description}</div>
              <div className="mt-5 flex items-end gap-2 text-zinc-900">
                <span className="text-3xl font-semibold">{tier.price}</span>
                <span className="text-xs text-zinc-400">{tier.priceSuffix}</span>
              </div>
              {tier.note ? <div className="mt-1 text-[11px] text-zinc-400">{tier.note}</div> : null}
              <button
                className={`mt-5 rounded-xl px-4 py-2 text-xs font-semibold ${
                  tier.highlight
                    ? "bg-rose-500 text-white hover:bg-rose-600"
                    : "border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                }`}
                onClick={() => onSelectPlan(tier.id)}
                disabled={tier.id === "trial"}
              >
                {tier.cta}
              </button>
              <ul className="mt-5 space-y-2 text-xs text-zinc-600">
                {tier.features.map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-200 px-6 pb-10 pt-6">
          <div className="text-sm font-semibold text-zinc-900">
            {locale === "en" ? "Feature comparison" : "功能比較"}
          </div>
          <div className="mt-4 overflow-x-auto">
            <div className="min-w-[720px] rounded-2xl border border-zinc-200">
              <div className="grid grid-cols-[1.6fr_repeat(3,1fr)] bg-zinc-50 px-4 py-3 text-xs font-semibold text-zinc-500">
                <div>{locale === "en" ? "Features" : "項目"}</div>
                <div className="text-center">{locale === "en" ? "Trial" : "試用"}</div>
                <div className="text-center">{locale === "en" ? "Personal" : "個人"}</div>
                <div className="text-center">{locale === "en" ? "Enterprise" : "企業"}</div>
              </div>
              {comparisonRows.map((row) => (
                <div
                  key={row.label}
                  className="grid grid-cols-[1.6fr_repeat(3,1fr)] items-center gap-2 border-t border-zinc-200 px-4 py-3 text-xs text-zinc-600"
                >
                  <div>{row.label}</div>
                  <div className="flex justify-center">
                    {renderCell(row.trial)}
                  </div>
                  <div className="flex justify-center">
                    {renderCell(row.personal_yearly)}
                  </div>
                  <div className="flex justify-center">
                    {renderCell(row.enterprise)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 text-[11px] text-zinc-400">
            {locale === "en"
              ? "Payment handled by PAYUNi. Provide API settings to enable checkout."
              : "付款走統一金流（PAYUNi）。提供 API 後即可啟用結帳流程。"}
          </div>
        </div>
      </div>
    </div>
  );
}

function renderCell(value: boolean | string) {
  if (typeof value === "string") {
    return <span className="text-xs text-zinc-700">{value}</span>;
  }
  if (value) {
    return <Check className="h-4 w-4 text-emerald-500" />;
  }
  return <span className="text-zinc-300">—</span>;
}
