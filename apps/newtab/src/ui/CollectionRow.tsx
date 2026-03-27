import { FolderTree } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import type { EntityMenuItem } from "./EntityMenuButton";
import { EntityMenuButton } from "./EntityMenuButton";

type Props = {
  id: string;
  name: string;
  tabCount: number;
  updatedAt?: string;
  entityMenu: { type: string; id: string } | null;
  setEntityMenu: (value: { type: string; id: string } | null) => void;
  menuItems: EntityMenuItem[];
  onSelect?: () => void;
};

export function CollectionRow({
  id,
  name,
  tabCount,
  updatedAt,
  entityMenu,
  setEntityMenu,
  menuItems,
  onSelect,
}: Props) {
  const drop = useDroppable({
    id: `collection-drop-${id}`,
    data: { targetId: id, type: "collection" },
  });
  return (
    <button
      ref={drop.setNodeRef}
      className={`flex w-full items-center gap-4 rounded-[22px] border border-zinc-200 bg-zinc-50 px-4 py-4 text-left transition hover:bg-zinc-100 ${
        drop.isOver ? "ring-1 ring-zinc-300" : ""
      }`}
      onClick={onSelect}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-zinc-500 shadow-sm">
        <FolderTree className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-zinc-900">{name}</div>
        <div className="mt-1 truncate text-xs text-zinc-500">
          {tabCount} 頁{updatedAt ? ` · 更新於 ${updatedAt}` : ""}
        </div>
      </div>
      <EntityMenuButton type="collection-row" id={id} entityMenu={entityMenu} setEntityMenu={setEntityMenu} items={menuItems} />
    </button>
  );
}
