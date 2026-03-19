import { useEffect, useMemo } from "react";
import type { Folder, Space } from "@toby/core";
import { Card } from "@toby/shared-ui";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type TreeItem = {
  id: string;
  name: string;
  depth: number;
  type: "space" | "folder";
  hasChildren?: boolean;
};

type Props = {
  spaces: Space[];
  folders: Folder[];
  onSelectSpace: (spaceId: string) => void;
  expandedFolderIds: string[];
  onToggleFolder: (folderId: string) => void;
  onExpandFolder: (folderId: string) => void;
  overId: string | null;
};

export function Tree({
  spaces,
  folders,
  onSelectSpace,
  expandedFolderIds,
  onToggleFolder,
  onExpandFolder,
  overId,
}: Props) {
  const items = useMemo(
    () => buildTree(spaces, folders, new Set(expandedFolderIds)),
    [spaces, folders, expandedFolderIds]
  );

  useEffect(() => {
    if (!overId) {
      return;
    }
    const isFolder = folders.some((folder) => folder.id === overId);
    if (!isFolder) {
      return;
    }

    const timer = window.setTimeout(() => onExpandFolder(overId), 500);
    return () => window.clearTimeout(timer);
  }, [folders, onExpandFolder, overId]);

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <TreeRow
          key={item.id}
          item={item}
          onSelectSpace={onSelectSpace}
          onToggleFolder={onToggleFolder}
          isExpanded={expandedFolderIds.includes(item.id)}
          overId={overId}
        />
      ))}
    </div>
  );
}

function TreeRow({
  item,
  onSelectSpace,
  onToggleFolder,
  isExpanded,
  overId,
}: {
  item: TreeItem;
  onSelectSpace: (spaceId: string) => void;
  onToggleFolder: (folderId: string) => void;
  isExpanded: boolean;
  overId: string | null;
}) {
  if (item.type === "space") {
    return <SortableSpaceRow item={item} onSelectSpace={onSelectSpace} overId={overId} />;
  }

  return (
    <SortableFolderRow
      item={item}
      isExpanded={isExpanded}
      onToggleFolder={onToggleFolder}
      overId={overId}
    />
  );
}

function SortableSpaceRow({
  item,
  onSelectSpace,
  overId,
}: {
  item: TreeItem;
  onSelectSpace: (spaceId: string) => void;
  overId: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: item.id,
  });

  return (
    <Card
      className={isDragging ? "p-3 opacity-70" : isOver || overId === item.id ? "p-3 ring-1 ring-slate-500" : "p-3"}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div className="flex w-full items-center justify-between gap-2 text-left text-sm">
        <button className="flex-1 text-left" onClick={() => onSelectSpace(item.id)}>
          <span style={{ paddingLeft: `${item.depth * 12}px` }}>{item.name}</span>
        </button>
        <button
          className="rounded border border-slate-700 px-2 py-1 text-xs"
          aria-label="Drag space"
          {...attributes}
          {...listeners}
        >
          ::
        </button>
      </div>
    </Card>
  );
}

function SortableFolderRow({
  item,
  isExpanded,
  onToggleFolder,
  overId,
}: {
  item: TreeItem;
  isExpanded: boolean;
  onToggleFolder: (folderId: string) => void;
  overId: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id: item.id,
  });

  return (
    <Card
      className={isDragging ? "p-3 opacity-70" : isOver || overId === item.id ? "p-3 ring-1 ring-slate-500" : "p-3"}
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <div className="flex w-full items-center justify-between gap-2 text-left text-sm">
        <div className="flex items-center gap-2" style={{ paddingLeft: `${item.depth * 12}px` }}>
          {item.hasChildren ? (
            <button
              className="rounded border border-slate-700 px-1 text-xs"
              onClick={() => onToggleFolder(item.id)}
              aria-label={isExpanded ? "Collapse folder" : "Expand folder"}
            >
              {isExpanded ? "▾" : "▸"}
            </button>
          ) : (
            <span className="inline-block w-4" />
          )}
          <span>{item.name}</span>
        </div>
        <button
          className="rounded border border-slate-700 px-2 py-1 text-xs"
          aria-label="Drag folder"
          {...attributes}
          {...listeners}
        >
          ::
        </button>
      </div>
    </Card>
  );
}

function buildTree(spaces: Space[], folders: Folder[], expanded: Set<string>): TreeItem[] {
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
      items.push(...walkFolders(spaceFolders, null, 1, expanded));
    });

  return items;
}

function walkFolders(
  folders: Folder[],
  parentId: string | null,
  depth: number,
  expanded: Set<string>
): TreeItem[] {
  return folders
    .filter((folder) => folder.parentFolderId === parentId)
    .sort((a, b) => a.position - b.position)
    .flatMap((folder) => {
      const children = folders.filter((item) => item.parentFolderId === folder.id);
      const node: TreeItem = {
        id: folder.id,
        name: folder.name,
        depth,
        type: "folder",
        hasChildren: children.length > 0,
      };
      if (!expanded.has(folder.id)) {
        return [node];
      }
      return [node, ...walkFolders(folders, folder.id, depth + 1, expanded)];
    });
}
