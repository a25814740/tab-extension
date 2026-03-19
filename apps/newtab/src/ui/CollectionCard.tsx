import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@toby/shared-ui";

type Props = {
  id: string;
  name: string;
  tabCount: number;
  onOpenAll: () => void;
};

export function CollectionCard({ id, name, tabCount, onOpenAll }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <Card
      ref={setNodeRef}
      className={isDragging ? "p-4 opacity-70" : "p-4"}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div className="text-base font-semibold">{name}</div>
      <div className="mt-2 text-xs text-slate-400">{tabCount} tabs</div>
      <button
        className="mt-4 w-full rounded bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-900"
        onClick={onOpenAll}
        {...attributes}
        {...listeners}
      >
        Open All
      </button>
    </Card>
  );
}
