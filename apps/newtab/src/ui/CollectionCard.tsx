import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@toby/shared-ui";

type Props = {
  id: string;
  name: string;
  tabCount: number;
  onOpenAll: () => void;
  children?: React.ReactNode;
};

export function CollectionCard({ id, name, tabCount, onOpenAll, children }: Props) {
  const sortable = useSortable({
    id,
    data: {
      type: "collection",
      placeAfter: true,
    },
  });
  const sortableBefore = useSortable({
    id,
    data: {
      type: "collection",
      placeAfter: false,
    },
  });

  return (
    <Card
      ref={sortable.setNodeRef}
      className={
        sortable.isDragging ? "p-4 opacity-70" : sortable.isOver ? "p-4 ring-1 ring-slate-500" : "p-4"
      }
      style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }}
    >
      <div className="text-base font-semibold">{name}</div>
      <div className="mt-2 text-xs text-slate-400">{tabCount} tabs</div>
      {children}
      <div className="mt-3 flex items-center gap-2">
        <div
          className={`h-1 flex-1 rounded ${sortableBefore.isOver ? "bg-slate-400" : "bg-slate-800"}`}
          ref={sortableBefore.setNodeRef}
          {...sortableBefore.attributes}
          {...sortableBefore.listeners}
        />
        <div
          className={`h-1 flex-1 rounded ${sortable.isOver ? "bg-slate-400" : "bg-slate-800"}`}
        />
      </div>
      <div className="mt-4 flex items-center gap-2">
        <button
          className="flex-1 rounded bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900"
          onClick={onOpenAll}
        >
          Open All
        </button>
        <button
          className="rounded border border-slate-700 px-2 py-2 text-xs"
          aria-label="Drag collection"
          {...sortable.attributes}
          {...sortable.listeners}
        >
          ::
        </button>
      </div>
    </Card>
  );
}
