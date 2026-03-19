import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@toby/shared-ui";

type Props = {
  id: string;
  title: string;
  url: string;
};

export function TabRow({ id, title, url }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id,
  });

  return (
    <Card
      ref={setNodeRef}
      className={isDragging ? "p-2 opacity-70" : isOver ? "p-2 ring-1 ring-slate-500" : "p-2"}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div className="flex items-center justify-between gap-2 text-left text-xs">
        <div className="flex flex-col">
          <span className="font-medium text-slate-100">{title}</span>
          <span className="text-slate-400">{url}</span>
        </div>
        <button
          className="rounded border border-slate-700 px-2 py-1 text-[10px]"
          aria-label="Drag tab"
          {...attributes}
          {...listeners}
        >
          ::
        </button>
      </div>
    </Card>
  );
}
