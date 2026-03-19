import { useMemo } from "react";
import type { Folder, Space } from "@toby/core";
import { Card } from "@toby/shared-ui";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";

type TreeItem = {
  id: string;
  name: string;
  depth: number;
  type: "space" | "folder";
};

type Props = {
  spaces: Space[];
  folders: Folder[];
  onSelectSpace: (spaceId: string) => void;
};

export function Tree({ spaces, folders, onSelectSpace }: Props) {
  const items = useMemo(() => buildTree(spaces, folders), [spaces, folders]);

  return (
    <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
      <div className="space-y-2">
        {items.map((item) => (
          <TreeRow key={item.id} item={item} onSelectSpace={onSelectSpace} />
        ))}
      </div>
    </SortableContext>
  );
}

function TreeRow({
  item,
  onSelectSpace,
}: {
  item: TreeItem;
  onSelectSpace: (spaceId: string) => void;
}) {
  if (item.type === "space") {
    return <SortableSpaceRow item={item} onSelectSpace={onSelectSpace} />;
  }

  return <SortableFolderRow item={item} />;
}

function SortableSpaceRow({
  item,
  onSelectSpace,
}: {
  item: TreeItem;
  onSelectSpace: (spaceId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  return (
    <Card
      className={isDragging ? "p-3 opacity-70" : "p-3"}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <button
        className="flex w-full items-center gap-2 text-left text-sm"
        onClick={() => onSelectSpace(item.id)}
        {...attributes}
        {...listeners}
      >
        <span style={{ paddingLeft: `${item.depth * 12}px` }}>{item.name}</span>
      </button>
    </Card>
  );
}

function SortableFolderRow({ item }: { item: TreeItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  return (
    <Card
      className={isDragging ? "p-3 opacity-70" : "p-3"}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div className="flex w-full items-center gap-2 text-left text-sm" {...attributes} {...listeners}>
        <span style={{ paddingLeft: `${item.depth * 12}px` }}>{item.name}</span>
      </div>
    </Card>
  );
}

function buildTree(spaces: Space[], folders: Folder[]): TreeItem[] {
  const items: TreeItem[] = [];

  const foldersBySpace = new Map<string, Folder[]>();
  folders.forEach((folder) => {
    const list = foldersBySpace.get(folder.spaceId) ?? [];
    list.push(folder);
    foldersBySpace.set(folder.spaceId, list);
  });

  spaces
    .slice()
    .sort((a, b) => a.position - b.position)
    .forEach((space) => {
      items.push({ id: space.id, name: space.name, depth: 0, type: "space" });
      const spaceFolders = foldersBySpace.get(space.id) ?? [];
      items.push(...walkFolders(spaceFolders, null, 1));
    });

  return items;
}

function walkFolders(folders: Folder[], parentId: string | null, depth: number): TreeItem[] {
  return folders
    .filter((folder) => folder.parentFolderId === parentId)
    .sort((a, b) => a.position - b.position)
    .flatMap((folder) => [
      { id: folder.id, name: folder.name, depth, type: "folder" as const },
      ...walkFolders(folders, folder.id, depth + 1),
    ]);
}
