import type { Collection, Folder, Space, TabItem, Workspace } from "../domain/models";

export type SampleWorkspace = {
  workspace: Workspace;
  spaces: Array<Space & { folders: Folder[] }>;
  collections: Array<Collection & { tabs: TabItem[] }>;
};

export function sampleWorkspace(): SampleWorkspace {
  const workspaceId = crypto.randomUUID();
  const workspace: Workspace = {
    id: workspaceId,
    ownerId: crypto.randomUUID(),
    name: "Main Workspace",
    logoUrl: null,
    inviteCount: 0,
    points: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const spaces: Array<Space & { folders: Folder[] }> = [
    {
      id: crypto.randomUUID(),
      workspaceId,
      name: "Work",
      position: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      folders: [
        {
          id: crypto.randomUUID(),
          workspaceId,
          spaceId: "",
          parentFolderId: null,
          name: "Research",
          position: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    },
    {
      id: crypto.randomUUID(),
      workspaceId,
      name: "Personal",
      position: 2,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      folders: [],
    },
  ];

  spaces[0].folders = spaces[0].folders.map((folder) => ({
    ...folder,
    spaceId: spaces[0].id,
  }));

  const collections: Array<Collection & { tabs: TabItem[] }> = [
    {
      id: crypto.randomUUID(),
      workspaceId,
      spaceId: spaces[0].id,
      folderId: spaces[0].folders[0].id,
      name: "AI Research",
      note: "Weekly review",
      color: "#FCA5A5",
      starred: false,
      position: 1,
      createdBy: workspace.ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
      tabs: [
        {
          id: crypto.randomUUID(),
          collectionId: "",
          title: "OpenAI Docs",
          url: "https://platform.openai.com/docs",
          faviconUrl: null,
          ogTitle: null,
          ogDescription: null,
          ogImage: null,
          screenshotUrl: null,
          note: null,
          position: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: crypto.randomUUID(),
          collectionId: "",
          title: "Chrome Extensions",
          url: "https://developer.chrome.com/docs/extensions",
          faviconUrl: null,
          ogTitle: null,
          ogDescription: null,
          ogImage: null,
          screenshotUrl: null,
          note: null,
          position: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    },
    {
      id: crypto.randomUUID(),
      workspaceId,
      spaceId: spaces[1].id,
      folderId: null,
      name: "Weekend",
      note: null,
      color: "#93C5FD",
      starred: false,
      position: 2,
      createdBy: workspace.ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
      tabs: [
        {
          id: crypto.randomUUID(),
          collectionId: "",
          title: "Travel Ideas",
          url: "https://example.com/travel",
          faviconUrl: null,
          ogTitle: null,
          ogDescription: null,
          ogImage: null,
          screenshotUrl: null,
          note: null,
          position: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    },
  ];

  collections.forEach((collection) => {
    collection.tabs = collection.tabs.map((tab) => ({
      ...tab,
      collectionId: collection.id,
    }));
  });

  return { workspace, spaces, collections };
}
