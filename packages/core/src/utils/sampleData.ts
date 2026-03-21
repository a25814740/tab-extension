import type { Collection, Folder, Space, TabItem, Workspace } from "../domain/models";

export type SampleWorkspace = {
  workspace: Workspace;
  spaces: Array<Space & { folders: Folder[] }>;
  collections: Array<Collection & { tabs: TabItem[] }>;
};

type WorkspaceSeed = {
  name: string;
  spaces: Array<{
    name: string;
    position: number;
    folders?: Array<{ name: string; position: number }>;
  }>;
  collections: Array<{
    spaceIndex: number;
    folderIndex?: number | null;
    name: string;
    color: string;
    note?: string | null;
    position: number;
    tabs: Array<{ title: string; url: string }>;
  }>;
};

const sampleSeeds: WorkspaceSeed[] = [
  {
    name: "Main Workspace",
    spaces: [
      { name: "Work", position: 1, folders: [{ name: "Research", position: 1 }] },
      { name: "Personal", position: 2 },
    ],
    collections: [
      {
        spaceIndex: 0,
        folderIndex: 0,
        name: "AI Research",
        note: "Weekly review",
        color: "#FCA5A5",
        position: 1,
        tabs: [
          { title: "OpenAI Docs", url: "https://platform.openai.com/docs" },
          { title: "Chrome Extensions", url: "https://developer.chrome.com/docs/extensions" },
        ],
      },
      {
        spaceIndex: 1,
        name: "Weekend",
        color: "#93C5FD",
        position: 2,
        tabs: [{ title: "Travel Ideas", url: "https://example.com/travel" }],
      },
    ],
  },
  {
    name: "Studio Ops",
    spaces: [
      { name: "Design", position: 1, folders: [{ name: "Inspiration", position: 1 }] },
      { name: "Shipping", position: 2 },
    ],
    collections: [
      {
        spaceIndex: 0,
        folderIndex: 0,
        name: "UI Patterns",
        note: null,
        color: "#FDE68A",
        position: 1,
        tabs: [
          { title: "Typography", url: "https://fonts.google.com" },
          { title: "Layout References", url: "https://example.com/layout" },
        ],
      },
      {
        spaceIndex: 1,
        name: "Launch Checklist",
        note: null,
        color: "#A7F3D0",
        position: 2,
        tabs: [{ title: "Release Guide", url: "https://example.com/release" }],
      },
    ],
  },
  {
    name: "Side Projects",
    spaces: [
      { name: "Ideas", position: 1 },
      { name: "Experiments", position: 2 },
      { name: "Archive", position: 3 },
    ],
    collections: [
      {
        spaceIndex: 0,
        name: "SaaS Concepts",
        note: null,
        color: "#C7D2FE",
        position: 1,
        tabs: [
          { title: "Landing Inspiration", url: "https://example.com/landing" },
          { title: "Market Notes", url: "https://example.com/market" },
        ],
      },
      {
        spaceIndex: 1,
        name: "Prototype Labs",
        note: null,
        color: "#FDBA74",
        position: 2,
        tabs: [{ title: "API Sandbox", url: "https://example.com/api" }],
      },
    ],
  },
];

const createTab = (title: string, url: string, position: number, createdAt: string): TabItem => ({
  id: crypto.randomUUID(),
  collectionId: "",
  title,
  url,
  faviconUrl: null,
  ogTitle: null,
  ogDescription: null,
  ogImage: null,
  screenshotUrl: null,
  note: null,
  position,
  createdAt,
  updatedAt: createdAt,
});

export function sampleWorkspaces(): SampleWorkspace[] {
  const now = new Date().toISOString();

  return sampleSeeds.map((seed) => {
    const workspaceId = crypto.randomUUID();
    const ownerId = crypto.randomUUID();
    const workspace: Workspace = {
      id: workspaceId,
      ownerId,
      name: seed.name,
      logoUrl: null,
      inviteCount: 0,
      points: 0,
      createdAt: now,
      updatedAt: now,
    };

    const spaces: Array<Space & { folders: Folder[] }> = seed.spaces.map((spaceSeed, index) => {
      const spaceId = crypto.randomUUID();
      const folders =
        spaceSeed.folders?.map((folderSeed) => ({
          id: crypto.randomUUID(),
          workspaceId,
          spaceId,
          parentFolderId: null,
          name: folderSeed.name,
          position: folderSeed.position,
          createdAt: now,
          updatedAt: now,
        })) ?? [];
      return {
        id: spaceId,
        workspaceId,
        name: spaceSeed.name,
        position: spaceSeed.position ?? index + 1,
        createdAt: now,
        updatedAt: now,
        folders,
      };
    });

    const collections: Array<Collection & { tabs: TabItem[] }> = seed.collections.map((collectionSeed) => {
      const space = spaces[collectionSeed.spaceIndex];
      const folder =
        typeof collectionSeed.folderIndex === "number"
          ? space?.folders[collectionSeed.folderIndex] ?? null
          : null;
      const tabs = collectionSeed.tabs.map((tab, index) => createTab(tab.title, tab.url, index + 1, now));
      const collection: Collection & { tabs: TabItem[] } = {
        id: crypto.randomUUID(),
        workspaceId,
        spaceId: space?.id ?? spaces[0].id,
        folderId: folder?.id ?? null,
        name: collectionSeed.name,
        note: collectionSeed.note ?? null,
        color: collectionSeed.color,
        starred: false,
        position: collectionSeed.position,
        createdBy: ownerId,
        createdAt: now,
        updatedAt: now,
        archivedAt: null,
        tabs,
      };
      collection.tabs = collection.tabs.map((tab) => ({ ...tab, collectionId: collection.id }));
      return collection;
    });

    return { workspace, spaces, collections };
  });
}

export function sampleWorkspace(): SampleWorkspace {
  return sampleWorkspaces()[0];
}
