import type { Collection, TabItem, Workspace } from "@toby/core";

export type ViewMode = "image" | "card" | "compact" | "list";
export type SortMode = "custom" | "recent";

export type MainContentHeaderData = {
  workspaceName: string;
  activeSpaceName: string;
};

export type MainContentData = {
  workspace: Workspace | null;
  collections: Collection[];
  tabsByCollection: Map<string, TabItem[]>;
  tabCountByCollection: Map<string, number>;
};

