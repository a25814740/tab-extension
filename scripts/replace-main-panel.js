const fs = require("fs");

const p = "apps/newtab/src/ui/App.tsx";
let s = fs.readFileSync(p, "utf8");

const startRe =
  /\n\s*<div\r?\n\s*className="flex flex-col flex-1 overflow-hidden rounded-\[28px\] border border-zinc-200 shadow-md"\r?\n\s*style=\{mainPanelThemeStyle\}\r?\n\s*>\r?\n/;
const startMatch = s.match(startRe);
if (!startMatch || typeof startMatch.index !== "number") {
  console.error("start not found");
  process.exit(1);
}

const start = startMatch.index + startMatch[0].length;

const endRe = /\r?\n\r?\n\r?\n\s*<div className="relative z-20">/g;
endRe.lastIndex = start;
const endMatch = endRe.exec(s);
if (!endMatch || typeof endMatch.index !== "number") {
  console.error("end not found");
  process.exit(1);
}
const end = endMatch.index;

const replacement =
  [
    "            <MainContentPanel",
    "              locale={locale}",
    "              workspace={workspace}",
    "              activeSpaceName={activeSpaceName}",
    "              mainPanelThemeStyle={mainPanelThemeStyle}",
    "              viewMode={viewMode as any}",
    "              sortMode={sortMode as any}",
    "              themeApplying={themeApplying}",
    "              blankCollectionDropActive={blankCollectionDropActive}",
    "              sortedCollections={sortedCollections as any}",
    "              tabsByCollection={tabsByCollection as any}",
    "              tabCountByCollection={tabCountByCollection as any}",
    "              entityMenu={entityMenu as any}",
    "              setEntityMenu={setEntityMenu as any}",
    "              selectedCollectionId={selectedCollectionId}",
    "              setSelectedCollectionId={setSelectedCollectionId}",
    "              searchOpen={searchOpen}",
    "              setSearchOpen={setSearchOpen}",
    "              searchQuery={searchQuery}",
    "              setSearchQuery={setSearchQuery}",
    "              createCollectionMenuOpen={createCollectionMenuOpen}",
    "              setCreateCollectionMenuOpen={setCreateCollectionMenuOpen}",
    "              onAddCollectionAction={handleAddCollectionAction as any}",
    "              onEditCollectionTitle={handleEditCollectionTitle}",
    "              onDeleteCollection={deleteCollection}",
    "              onOpenCollectionInvite={handleOpenCollectionInvite}",
    "              onDropRawToBlank={handleDropRawToBlank}",
    "              onSortChange={setSortMode as any}",
    "              onViewModeChange={setViewMode as any}",
    "              onToggleCollapseAll={() => setAllCollapsed((prev) => !prev)}",
    "              collapseAllLabel={allCollapsed ? \"全部展開\" : \"全部收起\"}",
    "              collectionBlankAreaDrop={collectionBlankAreaDrop as any}",
    "              setBlankCollectionDropActive={setBlankCollectionDropActive}",
    "              t={t}",
    "            />",
  ].join("\n") + "\n";

// Keep the opening <div ...> wrapper in App.tsx, but replace its body with the panel component.
// We replace from after the opening tag (start) to before the dock toggle block (end).
s = s.slice(0, start) + replacement + s.slice(end);

fs.writeFileSync(p, s, "utf8");
console.log("Replaced main content panel chunk in App.tsx");
