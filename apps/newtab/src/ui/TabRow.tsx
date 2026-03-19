import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@toby/shared-ui";

type Props = {
  id: string;
  title: string;
  url: string;
};

export function TabRow({ id, title, url }: Props) {
  const sortable = useSortable({
    id,
    data: { type: "tab", placeAfter: true },
  });
  const sortableBefore = useSortable({
    id,
    data: { type: "tab", placeAfter: false },
  });

  return (
    <Card
      ref={sortable.setNodeRef}
      className={
        sortable.isDragging ? "p-2 opacity-70" : sortable.isOver ? "p-2 ring-1 ring-slate-500" : "p-2"
      }
      style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }}
    >
      <div className="flex items-center justify-between gap-2 text-left text-xs">
        <div className="flex flex-col">
          <span className="font-medium text-slate-100">{title}</span>
          <span className="text-slate-400">{url}</span>
        </div>
        <button
          className="rounded border border-slate-700 px-2 py-1 text-[10px]"
          aria-label="Drag tab"
          {...sortable.attributes}
          {...sortable.listeners}
        >
          ::
        </button>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <div
          className={`h-1 flex-1 rounded ${sortableBefore.isOver ? "bg-slate-400" : "bg-slate-800"}`}
          ref={sortableBefore.setNodeRef}
          {...sortableBefore.attributes}
          {...sortableBefore.listeners}
        />
        <div className={`h-1 flex-1 rounded ${sortable.isOver ? "bg-slate-400" : "bg-slate-800"}`} />
      </div>
    </Card>
  );
}
