import { nanoid } from "nanoid";
import type { Collection, Folder, Space, TabItem, Workspace } from "../domain/models";

export type SampleWorkspace = {
  workspace: Workspace;
  spaces: Array<Space & { folders: Folder[] }>;
  collections: Array<Collection & { tabs: TabItem[] }>;
};

export function sampleWorkspace(): SampleWorkspace {
  const workspaceId = nanoid();
  const workspace: Workspace = {
    id: workspaceId,
    ownerId: nanoid(),
    name: "Main Workspace",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const spaces: Array<Space & { folders: Folder[] }> = [
    {
      id: nanoid(),
      workspaceId,
      name: "Work",
      position: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      folders: [
        {
          id: nanoid(),
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
      id: nanoid(),
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
      id: nanoid(),
      workspaceId,
      spaceId: spaces[0].id,
      folderId: spaces[0].folders[0].id,
      name: "AI Research",
      note: "Weekly review",
      color: "#FCA5A5",
      position: 1,
      createdBy: workspace.ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
      tabs: [
        {
          id: nanoid(),
          collectionId: "",
          title: "OpenAI Docs",
          url: "https://platform.openai.com/docs",
          faviconUrl: null,
          note: null,
          position: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: nanoid(),
          collectionId: "",
          title: "Chrome Extensions",
          url: "https://developer.chrome.com/docs/extensions",
          faviconUrl: null,
          note: null,
          position: 2,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    },
    {
      id: nanoid(),
      workspaceId,
      spaceId: spaces[1].id,
      folderId: null,
      name: "Weekend",
      note: null,
      color: "#93C5FD",
      position: 2,
      createdBy: workspace.ownerId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      archivedAt: null,
      tabs: [
        {
          id: nanoid(),
          collectionId: "",
          title: "Travel Ideas",
          url: "https://example.com/travel",
          faviconUrl: null,
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