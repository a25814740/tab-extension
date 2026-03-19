import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@toby/shared-ui";

type Props = {
  id: string;
  title: string;
  url: string;
};

export function TabRow({ id, title, url }: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  return (
    <Card
      ref={setNodeRef}
      className={isDragging ? "p-2 opacity-70" : "p-2"}
      style={{ transform: CSS.Transform.toString(transform), transition }}
    >
      <div className="flex flex-col text-left text-xs" {...attributes} {...listeners}>
        <span className="font-medium text-slate-100">{title}</span>
        <span className="text-slate-400">{url}</span>
      </div>
    </Card>
  );
}
