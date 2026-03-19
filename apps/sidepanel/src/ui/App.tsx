import { Card, SectionTitle } from "@toby/shared-ui";
import { sampleWorkspace } from "@toby/core";

export function App() {
  const workspace = sampleWorkspace();
  const recentCollections = workspace.collections.slice(0, 3);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <header className="border-b border-slate-800 px-4 py-3">
        <h1 className="text-base font-semibold">Quick Actions</h1>
      </header>
      <main className="space-y-4 px-4 py-4">
        <div className="space-y-2">
          <button className="w-full rounded bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-900">
            Save Active Tab
          </button>
          <button className="w-full rounded border border-slate-700 px-3 py-2 text-sm">
            Save Current Window
          </button>
        </div>
        <div>
          <SectionTitle title="Recent Collections" />
          <div className="mt-2 space-y-2">
            {recentCollections.map((collection) => (
              <Card key={collection.id} className="p-3">
                <div className="text-sm font-medium">{collection.name}</div>
                <div className="text-xs text-slate-400">
                  {collection.tabs.length} tabs
                </div>
              </Card>
            ))}
          </div>
        </div>
        <div>
          <SectionTitle title="Quick Search" />
          <input
            className="mt-2 w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
            placeholder="Search tabs, collections, folders"
          />
        </div>
      </main>
    </div>
  );
}