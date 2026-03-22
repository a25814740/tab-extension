import { useEffect, useRef, type ComponentType } from "react";
import { MoreHorizontal } from "lucide-react";

export type EntityMenuItem = {
  label: string;
  icon: ComponentType<{ className?: string | undefined }>;
  onClick?: () => void;
};

type Props = {
  type: string;
  id: string;
  items: EntityMenuItem[];
  className?: string;
  entityMenu: { type: string; id: string } | null;
  setEntityMenu: (value: { type: string; id: string } | null) => void;
};

export function EntityMenuButton({
  type,
  id,
  items,
  className = "",
  entityMenu,
  setEntityMenu,
}: Props) {
  const isOpen = entityMenu?.type === type && entityMenu?.id === id;
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    const onMouseDown = (event: MouseEvent) => {
      if (!menuRef.current || !(event.target instanceof Node)) {
        return;
      }
      if (!menuRef.current.contains(event.target)) {
        setEntityMenu(null);
      }
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [isOpen, setEntityMenu]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={(event) => {
          event.stopPropagation();
          setEntityMenu(isOpen ? null : { type, id });
        }}
        className={`rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-100 ${className}`}
        aria-label="menu"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {isOpen ? (
        <div className="absolute right-0 top-full z-40 mt-2 w-44 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
          {items.map((item) => (
            <button
              key={item.label}
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-50"
              onClick={() => {
                item.onClick?.();
                setEntityMenu(null);
              }}
            >
              <item.icon className="h-4 w-4 text-zinc-500" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
