export type TabInput = {
  title: string;
  url: string;
};

export type GroupSuggestion = {
  name: string;
  reason: string;
  confidence: number;
  urls: string[];
};

const DOMAIN_BUCKETS: Record<string, string> = {
  "github.com": "GitHub",
  "developer.chrome.com": "Chrome Docs",
  "youtube.com": "YouTube",
  "docs.google.com": "Google Docs",
};

export function suggestGroups(tabs: TabInput[]): GroupSuggestion[] {
  const grouped: Record<string, GroupSuggestion> = {};

  for (const tab of tabs) {
    const domain = safeDomain(tab.url);
    const bucket = DOMAIN_BUCKETS[domain] ?? "General";

    if (!grouped[bucket]) {
      grouped[bucket] = {
        name: bucket,
        reason: "Rule-based domain grouping",
        confidence: 0.6,
        urls: [],
      };
    }

    grouped[bucket].urls.push(tab.url);
  }

  return Object.values(grouped);
}

function safeDomain(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return "unknown";
  }
}

export type AiSummary = {
  summary: string;
  confidence: number;
};

export type AiProvider = {
  summarize: (tabs: TabInput[]) => Promise<AiSummary>;
  group: (tabs: TabInput[]) => Promise<GroupSuggestion[]>;
};

export function createRuleBasedProvider(): AiProvider {
  return {
    async summarize(tabs) {
      if (tabs.length === 0) {
        return { summary: "No tabs", confidence: 0.1 };
      }
      const top = tabs[0];
      return {
        summary: `Mainly about ${safeDomain(top.url)} and related links`,
        confidence: 0.4,
      };
    },
    async group(tabs) {
      return suggestGroups(tabs);
    },
  };
}
