import { useState } from "react";
import { Card, SectionTitle } from "@toby/shared-ui";
import { getCurrentWindowTabsWithScreenshots } from "@toby/chrome-adapters";
import { createRuleBasedProvider } from "@toby/ai";
import { useLocale } from "../i18n";

export function AiPanel() {
  const { t } = useLocale();
  const [status, setStatus] = useState(t("ai.status.idle"));
  const [groups, setGroups] = useState<Array<{ name: string; count: number }>>([]);

  const handleOrganize = async () => {
    setStatus(t("ai.status.analyzing"));
    const tabs = await getCurrentWindowTabsWithScreenshots();
    const provider = createRuleBasedProvider();
    const suggestions = await provider.group(tabs.map((tab) => ({ title: tab.title, url: tab.url })));
    setGroups(
      suggestions.map((suggestion) => ({
        name: suggestion.name,
        count: suggestion.urls.length,
      }))
    );
    setStatus(t("ai.status.ready"));
  };

  return (
    <Card className="p-3">
      <SectionTitle title={t("ai.title")} />
      <div className="mt-2 space-y-2 text-xs">
        <button className="w-full rounded border border-slate-700 px-2 py-1" onClick={handleOrganize}>
          {t("ai.suggestGroups")}
        </button>
        <div className="text-slate-400">{status}</div>
        <ul className="space-y-1">
          {groups.map((group) => (
            <li key={group.name} className="flex items-center justify-between">
              <span>{group.name}</span>
              <span className="text-slate-400">{group.count}</span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
