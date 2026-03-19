import { useState } from "react";
import { Card, SectionTitle } from "@toby/shared-ui";
import { getCurrentWindowTabs } from "@toby/chrome-adapters";
import { createRuleBasedProvider } from "@toby/ai";

export function AiPanel() {
  const [status, setStatus] = useState("Idle");
  const [groups, setGroups] = useState<Array<{ name: string; count: number }>>([]);

  const handleOrganize = async () => {
    setStatus("Analyzing...");
    const tabs = await getCurrentWindowTabs();
    const provider = createRuleBasedProvider();
    const suggestions = await provider.group(tabs.map((tab) => ({ title: tab.title, url: tab.url })));
    setGroups(
      suggestions.map((suggestion) => ({
        name: suggestion.name,
        count: suggestion.urls.length,
      }))
    );
    setStatus("Ready");
  };

  return (
    <Card className="p-3">
      <SectionTitle title="AI Organize" />
      <div className="mt-2 space-y-2 text-xs">
        <button className="w-full rounded border border-slate-700 px-2 py-1" onClick={handleOrganize}>
          Suggest Groups
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
