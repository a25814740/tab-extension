import type { ReactNode } from "react";
import { toSafeFaviconUrl } from "../utils/favicon";

export type DockIconButtonProps = {
  label: string;
  icon?: ReactNode;
  text?: string | undefined;
  url?: string | undefined;
  faviconUrl?: string | null | undefined;
  compact?: boolean;
  onClick?: () => void;
  onRemove?: (() => void) | undefined;
};

export function DockIconButton({
  label,
  icon,
  text,
  url,
  faviconUrl,
  compact = false,
  onClick,
  onRemove,
}: DockIconButtonProps) {
  const safeFaviconUrl = toSafeFaviconUrl(url, faviconUrl ?? null);
  return (
    <button
      className={`group relative z-10 flex items-center justify-center rounded-[20px] border border-zinc-200/80 bg-white/90 shadow-sm transition-all duration-200 hover:z-30 hover:-translate-y-1 hover:scale-105 hover:shadow-md ${
        compact ? "h-11 w-11" : "h-14 w-14"
      }`}
      onClick={onClick}
      onContextMenu={(event) => {
        if (!onRemove) {
          return;
        }
        event.preventDefault();
        onRemove();
      }}
      aria-label={label}
      title={label}
    >
      {onRemove ? (
        <div
          className="absolute -right-1 -top-1 z-20 hidden h-5 w-5 items-center justify-center rounded-full border border-zinc-200 bg-white text-[11px] text-zinc-500 shadow-sm group-hover:flex"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onRemove();
          }}
          role="button"
          aria-label="移除"
          title={`移除 ${label}`}
        >
          ×
        </div>
      ) : null}
      {safeFaviconUrl ? (
        <img src={safeFaviconUrl} alt={label} className="h-5 w-5 object-contain" />
      ) : icon ? (
        <span className="text-zinc-700">{icon}</span>
      ) : (
        <span className={`${compact ? "text-[11px]" : "text-sm"} font-semibold text-zinc-700`}>
          {text}
        </span>
      )}
      <div className="pointer-events-none absolute bottom-full left-1/2 z-[10001] mb-3 -translate-x-1/2 whitespace-nowrap rounded-xl bg-zinc-900 px-2.5 py-1 text-[11px] text-white opacity-0 shadow-xl transition-opacity duration-150 group-hover:opacity-100">
        {label}
      </div>
    </button>
  );
}
