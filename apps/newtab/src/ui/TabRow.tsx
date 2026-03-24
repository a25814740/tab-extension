import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@toby/shared-ui";
import { useLocale } from "../i18n";
import { useEffect, useState } from "react";
import { openTabs } from "@toby/chrome-adapters";
import { createPortal } from "react-dom";
import { SelectMenu } from "./SelectMenu";
import { toSafeFaviconUrl } from "../utils/favicon";

type Props = {
  id: string;
  title: string;
  url: string;
  faviconUrl?: string;
  ogTitle?: string | null;
  ogDescription?: string | null;
  note?: string | null;
  ogImage?: string | null;
  viewMode?: "grid" | "list" | "compact" | "image";
  onDelete?: (tabId: string) => void;
  onUpdate?: (tabId: string, payload: { title: string; url: string; note: string | null }) => void;
  onMove?: (tabId: string, workspaceId: string, spaceId: string, collectionId: string) => void;
  selected?: boolean;
  onToggleSelect?: () => void;
  workspaces?: Array<{ id: string; name: string }>;
  spaces?: Array<{ id: string; workspaceId: string; name: string }>;
  collections?: Array<{ id: string; spaceId: string; workspaceId: string; name: string }>;
  currentWorkspaceId?: string | null;
  currentSpaceId?: string | null;
  currentCollectionId?: string | null;
};

export function TabRow({
  id,
  title,
  url,
  faviconUrl,
  ogTitle,
  ogDescription,
  note,
  ogImage,
  viewMode = "grid",
  onDelete,
  onUpdate,
  onMove,
  selected,
  onToggleSelect,
  workspaces = [],
  spaces = [],
  collections = [],
  currentWorkspaceId,
  currentSpaceId,
  currentCollectionId,
}: Props) {
  const { t } = useLocale();
  const [isEditing, setIsEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(title);
  const [draftDescription, setDraftDescription] = useState(note ?? ogDescription ?? "");
  const [draftUrl, setDraftUrl] = useState(url);
  const [moveWorkspaceId, setMoveWorkspaceId] = useState(currentWorkspaceId ?? "");
  const [moveSpaceId, setMoveSpaceId] = useState(currentSpaceId ?? "");
  const [moveCollectionId, setMoveCollectionId] = useState(currentCollectionId ?? "");

  const sortable = useSortable({
    id,
    data: { type: "tab", placeAfter: true },
  });
  const sortableBefore = useSortable({
    id,
    data: { type: "tab", placeAfter: false },
  });

  const isList = viewMode === "list";
  const isCompact = viewMode === "compact";
  const showImageBlock = viewMode === "image";
  const displayTitle = ogTitle ?? title;
  const displayDescription = note ?? ogDescription ?? url;
  const actionButtonBase = "text-zinc-500 transition-colors duration-150 hover:text-zinc-900";
  const actionButtonInner =
    "flex h-7 w-7 items-center justify-center rounded-full bg-zinc-100 text-[11px] text-zinc-600 shadow-sm transition-colors duration-150 hover:bg-zinc-200";
  const checkboxClass =
    "h-4 w-4 rounded border-zinc-300 bg-white text-zinc-900 focus:ring-zinc-300/40";
  const safeFaviconUrl = toSafeFaviconUrl(url, faviconUrl ?? null);

  const handleOpen = () => {
    void openTabs([url]);
  };

  const shouldIgnoreOpen = (target: EventTarget | null) => {
    if (!(target instanceof Element)) {
      return false;
    }
    return Boolean(
      target.closest("button, input, textarea, select, a, [data-prevent-open='true']")
    );
  };

  const handleDelete = () => {
    const confirmed = window.confirm(t("tab.confirmDelete"));
    if (!confirmed) {
      return;
    }
    onDelete?.(id);
  };

  const handleStartEdit = () => {
    setDraftTitle(title);
    setDraftDescription(note ?? ogDescription ?? "");
    setDraftUrl(url);
    setMoveWorkspaceId(currentWorkspaceId ?? "");
    setMoveSpaceId(currentSpaceId ?? "");
    setMoveCollectionId(currentCollectionId ?? "");
    setIsEditing(true);
  };

  const handleSave = () => {
    if (!draftTitle.trim() || !draftUrl.trim()) {
      return;
    }
    onUpdate?.(id, { title: draftTitle.trim(), url: draftUrl.trim(), note: draftDescription.trim() || null });
    if (moveWorkspaceId && moveSpaceId && moveCollectionId && onMove) {
      // Move only if user selected a target; keeps edits and move in one action.
      onMove(id, moveWorkspaceId, moveSpaceId, moveCollectionId);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  useEffect(() => {
    if (!isEditing) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsEditing(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isEditing]);

  const moveSpaces = spaces.filter((space) => space.workspaceId === moveWorkspaceId);
  const moveCollections = collections.filter((collection) => collection.spaceId === moveSpaceId);

  useEffect(() => {
    if (!moveWorkspaceId && workspaces.length > 0) {
      setMoveWorkspaceId(workspaces[0].id);
    }
  }, [moveWorkspaceId, workspaces]);

  useEffect(() => {
    if (moveSpaces.length > 0 && !moveSpaces.some((space) => space.id === moveSpaceId)) {
      setMoveSpaceId(moveSpaces[0].id);
    }
  }, [moveSpaces, moveSpaceId]);

  useEffect(() => {
    if (moveCollections.length > 0 && !moveCollections.some((collection) => collection.id === moveCollectionId)) {
      setMoveCollectionId(moveCollections[0].id);
    }
  }, [moveCollections, moveCollectionId]);

  return (
    <Card
      ref={sortable.setNodeRef}
      className={
        sortable.isDragging
          ? "rounded-2xl border border-zinc-200 bg-zinc-100 p-3 opacity-70 shadow-sm"
          : sortable.isOver
          ? "rounded-2xl border border-zinc-200 bg-zinc-100 p-3 ring-1 ring-zinc-300 shadow-sm"
          : "rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm"
      }
      style={{ transform: CSS.Transform.toString(sortable.transform), transition: sortable.transition }}
      onClick={(event) => {
        if (shouldIgnoreOpen(event.target)) {
          return;
        }
        handleOpen();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          handleOpen();
        }
      }}
      role="button"
      tabIndex={0}
    >
      {isList ? (
        <div className="absolute right-2 top-1/2 z-10 flex -translate-y-1/2 gap-2 opacity-0 transition-opacity duration-150 group-hover/tab:opacity-100 group-hover/tab:pointer-events-auto pointer-events-none">
          <button
            className={actionButtonBase}
            onClick={(event) => {
              event.stopPropagation();
              handleDelete();
            }}
            onMouseDown={(event) => event.stopPropagation()}
            aria-label={t("tab.delete")}
          >
            <span className={actionButtonInner}>✕</span>
          </button>
          <button
            className={actionButtonBase}
            onClick={(event) => {
              event.stopPropagation();
              handleStartEdit();
            }}
            onMouseDown={(event) => event.stopPropagation()}
            aria-label={t("tab.edit")}
          >
            <span className={actionButtonInner}>✎</span>
          </button>
          <button
            className={actionButtonBase}
            aria-label={t("drag.tab")}
            {...sortable.attributes}
            {...sortable.listeners}
            onClick={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            draggable
            onDragStart={(event) => {
              event.stopPropagation();
              // Custom mime type enables cross-collection drag/drop without backend calls.
              event.dataTransfer.setData("application/x-toby-saved-tab", id);
              event.dataTransfer.effectAllowed = "move";
            }}
          >
            <span className={actionButtonInner}>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icon-tabler-drag-drop">
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M19 11v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" />
                <path d="M13 13l9 3l-4 2l-2 4l-3 -9" />
                <path d="M3 3l0 .01" />
                <path d="M7 3l0 .01" />
                <path d="M11 3l0 .01" />
                <path d="M15 3l0 .01" />
                <path d="M3 7l0 .01" />
                <path d="M3 11l0 .01" />
                <path d="M3 15l0 .01" />
              </svg>
            </span>
          </button>
        </div>
      ) : (
        <>
          <div className="absolute right-0 top-0 z-10 translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity duration-150 group-hover/tab:opacity-100 group-hover/tab:pointer-events-auto pointer-events-none">
            <button
              className={actionButtonBase}
              onClick={(event) => {
                event.stopPropagation();
                handleDelete();
              }}
              onMouseDown={(event) => event.stopPropagation()}
              aria-label={t("tab.delete")}
            >
              <span className={actionButtonInner}>✕</span>
            </button>
          </div>
          <div className="absolute right-0 bottom-0 z-10 flex translate-x-[20%] translate-y-1/2 gap-2 opacity-0 transition-opacity duration-150 group-hover/tab:opacity-100 group-hover/tab:pointer-events-auto pointer-events-none">
            <button
              className={actionButtonBase}
              aria-label={t("drag.tab")}
              {...sortable.attributes}
              {...sortable.listeners}
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
              draggable
              onDragStart={(event) => {
                event.stopPropagation();
                // Custom mime type enables cross-collection drag/drop without backend calls.
                event.dataTransfer.setData("application/x-toby-saved-tab", id);
                event.dataTransfer.effectAllowed = "move";
              }}
            >
              <span className={actionButtonInner}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="icon icon-tabler icon-tabler-drag-drop">
                  <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                  <path d="M19 11v-2a2 2 0 0 0 -2 -2h-8a2 2 0 0 0 -2 2v8a2 2 0 0 0 2 2h2" />
                  <path d="M13 13l9 3l-4 2l-2 4l-3 -9" />
                  <path d="M3 3l0 .01" />
                  <path d="M7 3l0 .01" />
                  <path d="M11 3l0 .01" />
                  <path d="M15 3l0 .01" />
                  <path d="M3 7l0 .01" />
                  <path d="M3 11l0 .01" />
                  <path d="M3 15l0 .01" />
                </svg>
              </span>
            </button>
            <button
              className={actionButtonBase}
              onClick={(event) => {
                event.stopPropagation();
                handleStartEdit();
              }}
              onMouseDown={(event) => event.stopPropagation()}
              aria-label={t("tab.edit")}
            >
              <span className={actionButtonInner}>✎</span>
            </button>
          </div>
        </>
      )}
      {showImageBlock ? (
        <div className="mb-2 aspect-video w-full overflow-hidden rounded bg-zinc-100">
          {ogImage ? (
            <img src={ogImage} alt="preview" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[10px] text-zinc-500">
              {t("tab.noImage")}
            </div>
          )}
        </div>
      ) : null}
      <div className={`flex items-center justify-between gap-2 text-left ${isCompact ? "text-[10px]" : "text-xs"}`}>
        {isList ? (
          // 清單模式使用固定欄寬，避免不同長度造成排版不一致
          <div className="grid min-w-0 flex-1 grid-cols-[24px_220px_1fr] items-center gap-3">
            <div className="flex h-5 w-5 flex-none items-center justify-center overflow-hidden rounded bg-zinc-100">
              {safeFaviconUrl ? (
                <img
                  src={safeFaviconUrl}
                  alt="favicon"
                  className={`h-full w-full object-contain ${selected ? "hidden" : "group-hover/tab:hidden"}`}
                />
              ) : null}
              {/* Prevent checkbox clicks from opening the tab card. */}
              <input
                type="checkbox"
                className={`${checkboxClass} ${selected ? "block" : "hidden group-hover/tab:block"}`}
                checked={!!selected}
                onChange={(event) => {
                  event.stopPropagation();
                  onToggleSelect?.();
                }}
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                aria-label={t("tab.select")}
              />
            </div>
            <span className="truncate font-medium text-zinc-900">{displayTitle}</span>
            <span className="truncate text-zinc-500">{displayDescription}</span>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-center gap-2 py-1">
            <div className="flex h-5 w-5 flex-none items-center justify-center overflow-hidden rounded bg-zinc-100">
              {safeFaviconUrl ? (
                <img
                  src={safeFaviconUrl}
                  alt="favicon"
                  className={`h-full w-full object-contain ${selected ? "hidden" : "group-hover/tab:hidden"}`}
                />
              ) : null}
              {/* Prevent checkbox clicks from opening the tab card. */}
              <input
                type="checkbox"
                className={`${checkboxClass} ${selected ? "block" : "hidden group-hover/tab:block"}`}
                checked={!!selected}
                onChange={(event) => {
                  event.stopPropagation();
                  onToggleSelect?.();
                }}
                onClick={(event) => event.stopPropagation()}
                onMouseDown={(event) => event.stopPropagation()}
                aria-label={t("tab.select")}
              />
            </div>
              <span className="truncate font-medium text-zinc-900">{displayTitle}</span>
            </div>
            {isCompact ? null : (
              <>
                <div className="my-1 h-px w-full bg-zinc-200" />
                <span className="truncate text-zinc-500">{displayDescription}</span>
              </>
            )}
          </div>
        )}
      </div>
      {isCompact ? null : (
        <div className="mt-2 flex items-center gap-2">
          <div
            className={`h-1 flex-1 rounded ${sortableBefore.isOver ? "bg-zinc-400" : "bg-zinc-200"}`}
            ref={sortableBefore.setNodeRef}
            {...sortableBefore.attributes}
            {...sortableBefore.listeners}
          />
          <div className={`h-1 flex-1 rounded ${sortable.isOver ? "bg-zinc-400" : "bg-zinc-200"}`} />
        </div>
      )}

      {isEditing
        ? createPortal(
            <div
              className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4"
              onClick={handleCancel}
            >
              <div
                className="modal-enter w-full max-w-lg rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="text-sm font-semibold">{t("tab.editTitle")}</div>
                <div className="mt-3 space-y-3 text-xs">
                  <label className="block">
                    <div className="mb-1 text-zinc-500">{t("tab.field.title")}</div>
                    <input
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700"
                      value={draftTitle}
                      onChange={(event) => setDraftTitle(event.target.value)}
                    />
                  </label>
                  <label className="block">
                    <div className="mb-1 text-zinc-500">{t("tab.field.description")}</div>
                    <textarea
                      className="min-h-[80px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700"
                      value={draftDescription}
                      onChange={(event) => setDraftDescription(event.target.value)}
                    />
                  </label>
                  <label className="block">
                    <div className="mb-1 text-zinc-500">{t("tab.field.url")}</div>
                    <input
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-700"
                      value={draftUrl}
                      onChange={(event) => setDraftUrl(event.target.value)}
                    />
                  </label>
                  <div className="grid gap-3">
                    <label className="block">
                      <SelectMenu
                        value={moveWorkspaceId}
                        onChange={(value) => setMoveWorkspaceId(value)}
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
                        options={moveSpaces.map((space) => ({ value: space.id, label: space.name }))}
                        label={t("collection.moveSpace")}
                        searchable
                        searchPlaceholder="搜尋空間"
                      />
                    </label>
                    <label className="block">
                      <SelectMenu
                        value={moveCollectionId}
                        onChange={(value) => setMoveCollectionId(value)}
                        options={moveCollections.map((collection) => ({ value: collection.id, label: collection.name }))}
                        label={t("collection.move")}
                        searchable
                        searchPlaceholder="搜尋集合"
                      />
                    </label>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <button
                    className="rounded-xl border border-rose-200 px-3 py-2 text-xs text-rose-600"
                    onClick={handleDelete}
                  >
                    {t("tab.delete")}
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      className="rounded-xl border border-zinc-200 px-3 py-2 text-xs text-zinc-700"
                      onClick={handleCancel}
                    >
                      {t("tab.cancel")}
                    </button>
                    <button
                      className="rounded bg-rose-500 px-3 py-2 text-xs font-semibold text-white"
                      onClick={handleSave}
                    >
                      {t("tab.save")}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </Card>
  );
}
