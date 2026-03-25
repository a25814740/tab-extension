import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { Card } from "@toby/shared-ui";
import { useLocale } from "../i18n";
import { SelectMenu } from "./SelectMenu";
import { useDroppable } from "@dnd-kit/core";

type Props = {
  id: string;
  name: string;
  tabCount: number;
  onOpenAll: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onEditTitle: (name: string) => void;
  onToggleStar: () => void;
  onSortAZ: () => void;
  onMove: (workspaceId: string, spaceId: string) => void;
  onExport: () => void;
  onInvite?: () => void;
  onDelete: () => void;
  onDropWindowTab?: (tabId: number) => void;
  onDropSavedTab?: (tabId: string) => void;
  onDragEnterDropZone?: () => void;
  onDragLeaveDropZone?: () => void;
  isDropTarget?: boolean;
  starred?: boolean | null;
  selected?: boolean;
  onToggleSelect?: () => void;
  workspaces: Array<{ id: string; name: string }>;
  spaces: Array<{ id: string; workspaceId: string; name: string }>;
  activeWorkspaceId: string | null;
  spaceId: string;
  summary?: string;
  children?: ReactNode;
  isActive?: boolean;
  onSelect?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
};

export function CollectionCard({
  id,
  name,
  tabCount,
  onOpenAll,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
  onEditTitle,
  onToggleStar,
  onSortAZ,
  onMove,
  onExport,
  onInvite,
  onDelete,
  onDropWindowTab,
  onDropSavedTab,
  onDragEnterDropZone,
  onDragLeaveDropZone,
  isDropTarget,
  starred,
  isActive,
  selected: isSelected,
  onToggleSelect,
  workspaces,
  spaces,
  activeWorkspaceId,
  spaceId,
  summary,
  children,
  onSelect,
  collapsed,
  onToggleCollapse,
}: Props) {
  const { t } = useLocale();
  const drop = useDroppable({
    id: `collection-drop-${id}`,
    data: { targetId: id, type: "collection" },
  });
  const [menuOpen, setMenuOpen] = useState(false);
  const [moveOpen, setMoveOpen] = useState(false);
  const [moveWorkspaceId, setMoveWorkspaceId] = useState(activeWorkspaceId ?? "");
  const [moveSpaceId, setMoveSpaceId] = useState(spaceId);
  const checkboxClass =
    "h-4 w-4 rounded border-zinc-300 bg-white text-zinc-900 focus:ring-zinc-300/40";
  const menuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (!menuRef.current || !(event.target instanceof Node)) {
        return;
      }
      if (!menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handler);
    return () => window.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (activeWorkspaceId) {
      setMoveWorkspaceId(activeWorkspaceId);
    } else if (workspaces[0]) {
      setMoveWorkspaceId(workspaces[0].id);
    }
    setMoveSpaceId(spaceId);
  }, [activeWorkspaceId, spaceId, workspaces]);

  const availableSpaces = spaces.filter((space) => space.workspaceId === moveWorkspaceId);

  return (
    <Card
      ref={drop.setNodeRef}
      className={
        isActive
          ? "group relative w-full rounded-[24px] border border-zinc-200 bg-zinc-50 p-4 shadow-sm"
          : isDropTarget || drop.isOver
          ? "group relative w-full rounded-[24px] border border-zinc-200 bg-zinc-100 p-4 ring-1 ring-zinc-300 shadow-sm"
          : "group relative w-full rounded-[24px] border border-zinc-200 bg-zinc-50 p-4 shadow-sm hover:bg-zinc-100"
      }
      onDragOver={(event) => {
        if (onDropWindowTab || onDropSavedTab) {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          onDragEnterDropZone?.();
        }
      }}
      onDragEnter={() => onDragEnterDropZone?.()}
      onDragLeave={() => onDragLeaveDropZone?.()}
      onDrop={(event) => {
        if (!onDropWindowTab && !onDropSavedTab) {
          return;
        }
        event.preventDefault();
        const savedRaw = event.dataTransfer.getData("application/x-toby-saved-tab");
        if (savedRaw && onDropSavedTab) {
          onDropSavedTab(savedRaw);
          return;
        }
        const windowRaw =
          event.dataTransfer.getData("application/x-toby-window-tab") ||
          event.dataTransfer.getData("application/x-toby-tab") ||
          event.dataTransfer.getData("text/plain");
        const tabId = Number(windowRaw);
        if (Number.isFinite(tabId) && onDropWindowTab) {
          onDropWindowTab(tabId);
        }
      }}
    >
      <div className="border-b border-zinc-200 pb-4">
        {isDropTarget ? (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
            <div className="rounded-full bg-zinc-900/90 px-4 py-2 text-xs text-white shadow-lg">
              {t("drag.dropToAdd")}
            </div>
          </div>
        ) : null}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              className={`${checkboxClass} ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
              checked={!!isSelected}
              onChange={(event) => {
                event.stopPropagation();
                onToggleSelect?.();
              }}
              aria-label={t("collection.select")}
            />
            <button
              className="text-left text-base font-semibold"
              onClick={() => {
                onToggleCollapse?.();
                onSelect?.();
              }}
            >
              {name}
              {starred ? " *" : ""}
            </button>
            <button
              className="text-zinc-400 hover:text-zinc-600"
              onClick={onToggleCollapse}
              aria-label={collapsed ? t("toolbar.expand") : t("toolbar.collapse")}
            >
              {collapsed ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 15l6 -6l6 6"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M6 9l6 6l6 -6"></path>
                </svg>
              )}
            </button>
          </div>
          <div className="flex items-center gap-2 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <button
              className="text-zinc-500 hover:text-zinc-700"
              onClick={onOpenAll}
              aria-label={t("collection.openTabs")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="icon icon-tabler icons-tabler-outline icon-tabler-external-link"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M12 6h-6a2 2 0 0 0 -2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2 -2v-6" />
                <path d="M11 13l9 -9" />
                <path d="M15 4h5v5" />
              </svg>
            </button>
            {canMoveUp ? (
              <button
                className="text-zinc-500 hover:text-zinc-700"
                onClick={onMoveUp}
                aria-label={t("collection.moveUp")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="icon icon-tabler icons-tabler-outline icon-tabler-arrow-autofit-up"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M12 4h-6a2 2 0 0 0 -2 2v12a2 2 0 0 0 2 2h8" />
                  <path d="M18 20v-17" />
                  <path d="M15 6l3 -3l3 3" />
                </svg>
              </button>
            ) : null}
            {canMoveDown ? (
              <button
                className="text-zinc-500 hover:text-zinc-700"
                onClick={onMoveDown}
                aria-label={t("collection.moveDown")}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="icon icon-tabler icons-tabler-outline icon-tabler-arrow-autofit-down"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M12 20h-6a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h8" />
                  <path d="M18 4v17" />
                  <path d="M15 18l3 3l3 -3" />
                </svg>
              </button>
            ) : null}
            <div className="relative" ref={menuRef}>
              <button className="text-zinc-500 hover:text-zinc-700" onClick={() => setMenuOpen((prev) => !prev)} aria-label={t("collection.more")}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="icon icon-tabler icons-tabler-outline icon-tabler-settings"
                >
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M10.325 4.317c.426 -1.756 2.924 -1.756 3.35 0a1.724 1.724 0 0 0 2.573 1.066c1.543 -.94 3.31 .826 2.37 2.37a1.724 1.724 0 0 0 1.065 2.572c1.756 .426 1.756 2.924 0 3.35a1.724 1.724 0 0 0 -1.066 2.573c.94 1.543 -.826 3.31 -2.37 2.37a1.724 1.724 0 0 0 -2.572 1.065c-.426 1.756 -2.924 1.756 -3.35 0a1.724 1.724 0 0 0 -2.573 -1.066c-1.543 .94 -3.31 -.826 -2.37 -2.37a1.724 1.724 0 0 0 -1.065 -2.572c-1.756 -.426 -1.756 -2.924 0 -3.35a1.724 1.724 0 0 0 1.066 -2.573c-.94 -1.543 .826 -3.31 2.37 -2.37c1 .608 2.296 .07 2.572 -1.065" />
                  <path d="M9 12a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
                </svg>
              </button>
              {menuOpen ? (
                <div className="absolute right-0 top-6 z-20 w-48 rounded-2xl border border-zinc-200 bg-white p-2 text-xs text-zinc-700 shadow-xl">
                  <button
                    className="w-full rounded-xl px-2 py-2 text-left hover:bg-zinc-50"
                    onClick={() => {
                      const next = window.prompt(t("collection.editTitlePrompt"), name);
                      if (next && next.trim()) {
                        onEditTitle(next.trim());
                      }
                      setMenuOpen(false);
                    }}
                  >
                    {t("collection.editTitle")}
                  </button>
                  <button
                    className="w-full rounded-xl px-2 py-2 text-left hover:bg-zinc-50"
                    onClick={() => {
                      onToggleStar();
                      setMenuOpen(false);
                    }}
                  >
                    {t("collection.star")}
                  </button>
                  <button
                    className="w-full rounded-xl px-2 py-2 text-left hover:bg-zinc-50"
                    onClick={() => {
                      onSortAZ();
                      setMenuOpen(false);
                    }}
                  >
                    {t("collection.sortAZ")}
                  </button>
                  <button
                    className="w-full rounded-xl px-2 py-2 text-left hover:bg-zinc-50"
                    onClick={() => {
                      setMoveOpen(true);
                      setMenuOpen(false);
                    }}
                  >
                    {t("collection.move")}
                  </button>
                  <button
                    className="w-full rounded-xl px-2 py-2 text-left hover:bg-zinc-50"
                    onClick={() => {
                      onExport();
                      setMenuOpen(false);
                    }}
                  >
                    {t("collection.export")}
                  </button>
                  <button
                    className="w-full rounded-xl px-2 py-2 text-left hover:bg-zinc-50"
                    onClick={() => {
                      onInvite?.();
                      setMenuOpen(false);
                    }}
                  >
                    {t("sidebar.invite")}
                  </button>
                  <button
                    className="w-full rounded-xl px-2 py-2 text-left text-rose-500 hover:bg-zinc-50"
                    onClick={() => {
                      const confirmed = window.confirm(t("collection.confirmDelete"));
                      if (confirmed) {
                        onDelete();
                      }
                      setMenuOpen(false);
                    }}
                  >
                    {t("collection.delete")}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
        <div className="mt-2 ml-7 text-xs text-zinc-500">
          {tabCount} {t("collection.tabs")}
        </div>
        {summary ? <div className="mt-2 ml-7 text-xs text-zinc-500">{summary}</div> : null}
        {collapsed ? null : children}
      </div>
      {moveOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl">
            <div className="text-sm font-semibold">{t("collection.moveTitle")}</div>
            <div className="mt-3 space-y-3 text-xs">
              <label className="block">
                <SelectMenu
                  value={moveWorkspaceId}
                  onChange={(value) => {
                    setMoveWorkspaceId(value);
                    const nextSpace = spaces.find((space) => space.workspaceId === value);
                    setMoveSpaceId(nextSpace?.id ?? "");
                  }}
                  options={workspaces.map((workspace) => ({ value: workspace.id, label: workspace.name }))}
                  label={t("collection.moveWorkspace")}
                  searchable
                  searchPlaceholder="搜尋組織"
                />
              </label>
              <label className="block">
                <SelectMenu
                  value={moveSpaceId}
                  onChange={(value) => setMoveSpaceId(value)}
                  options={availableSpaces.map((space) => ({ value: space.id, label: space.name }))}
                  label={t("collection.moveSpace")}
                  searchable
                  searchPlaceholder="搜尋空間"
                />
              </label>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                className="rounded-xl border border-zinc-200 px-3 py-2 text-xs text-zinc-700"
                onClick={() => setMoveOpen(false)}
              >
                {t("tab.cancel")}
              </button>
              <button
                className="rounded bg-rose-500 px-3 py-2 text-xs font-semibold text-white"
                onClick={() => {
                  if (moveWorkspaceId && moveSpaceId) {
                    onMove(moveWorkspaceId, moveSpaceId);
                  }
                  setMoveOpen(false);
                }}
              >
                {t("tab.save")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
