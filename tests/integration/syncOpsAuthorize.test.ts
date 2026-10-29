import { describe, expect, it } from "vitest";
import {
  authorizeOp,
  SyncAuthorizationError,
  type AuthorizationStore,
  type PendingOp,
  type SyncEntity,
} from "../../supabase/functions/sync_ops/authorize";

const OWNER = "user-owner";
const EDITOR = "user-editor";
const VIEWER = "user-viewer";
const STRANGER = "user-stranger";

// Two workspaces: ws-a (owned by OWNER, with an editor and a viewer) and ws-b (owned by STRANGER).
function createStore(): AuthorizationStore {
  const owners: Record<string, string> = { "ws-a": OWNER, "ws-b": STRANGER };
  const members: Record<string, Record<string, string>> = {
    "ws-a": { [EDITOR]: "editor", [VIEWER]: "viewer" },
  };
  const rows: Record<SyncEntity, Record<string, string>> = {
    space: { "space-a": "ws-a", "space-b": "ws-b" },
    folder: { "folder-a": "ws-a", "folder-b": "ws-b" },
    collection: { "col-a": "ws-a", "col-b": "ws-b" },
    tab: { "tab-a": "ws-a", "tab-b": "ws-b" },
  };
  return {
    async getWorkspaceOwnerId(workspaceId) {
      return owners[workspaceId] ?? null;
    },
    async getMemberRole(workspaceId, userId) {
      return members[workspaceId]?.[userId] ?? null;
    },
    async getRowWorkspaceId(entity, id) {
      return rows[entity][id] ?? null;
    },
  };
}

function op(type: PendingOp["type"], entity: SyncEntity, payload: Record<string, unknown>): PendingOp {
  return { id: `op-${type}-${entity}`, type, entity, payload };
}

const store = createStore();

describe("sync_ops authorizeOp", () => {
  it("allows the owner and editors to write their workspace", async () => {
    await expect(authorizeOp(store, op("create", "space", { id: "s1", workspace_id: "ws-a" }), OWNER)).resolves.toBe(
      "ws-a"
    );
    await expect(authorizeOp(store, op("update", "tab", { id: "tab-a", title: "x" }), EDITOR)).resolves.toBe("ws-a");
    await expect(authorizeOp(store, op("delete", "collection", { id: "col-a" }), EDITOR)).resolves.toBe("ws-a");
    await expect(
      authorizeOp(store, op("create", "tab", { id: "t1", collection_id: "col-a", url: "https://a" }), OWNER)
    ).resolves.toBe("ws-a");
  });

  it("rejects users outside the workspace", async () => {
    await expect(authorizeOp(store, op("delete", "tab", { id: "tab-a" }), STRANGER)).rejects.toBeInstanceOf(
      SyncAuthorizationError
    );
    await expect(
      authorizeOp(store, op("create", "space", { id: "s1", workspace_id: "ws-a" }), STRANGER)
    ).rejects.toThrow("Forbidden");
    await expect(
      authorizeOp(store, op("create", "tab", { id: "t1", collection_id: "col-a" }), STRANGER)
    ).rejects.toThrow("Forbidden");
  });

  it("rejects viewers", async () => {
    await expect(authorizeOp(store, op("update", "collection", { id: "col-a", name: "x" }), VIEWER)).rejects.toThrow(
      "Forbidden"
    );
  });

  it("rejects unknown workspaces and missing rows", async () => {
    await expect(
      authorizeOp(store, op("create", "space", { id: "s1", workspace_id: "ws-missing" }), OWNER)
    ).rejects.toThrow("Forbidden");
    await expect(authorizeOp(store, op("create", "space", { id: "s1" }), OWNER)).rejects.toThrow(
      "Missing workspace_id"
    );
    await expect(authorizeOp(store, op("delete", "tab", { id: "tab-missing" }), OWNER)).rejects.toThrow("not found");
    await expect(authorizeOp(store, op("delete", "tab", {}), OWNER)).rejects.toThrow("Missing id");
  });

  it("rejects parent references into another workspace", async () => {
    await expect(
      authorizeOp(store, op("create", "collection", { id: "c1", workspace_id: "ws-a", space_id: "space-b" }), OWNER)
    ).rejects.toThrow("space_id does not belong to workspace");
    await expect(
      authorizeOp(
        store,
        op("create", "folder", { id: "f1", workspace_id: "ws-a", space_id: "space-a", parent_folder_id: "folder-b" }),
        OWNER
      )
    ).rejects.toThrow("parent_folder_id does not belong to workspace");
    await expect(
      authorizeOp(store, op("update", "tab", { id: "tab-a", collection_id: "col-b" }), OWNER)
    ).rejects.toThrow("collection_id does not belong to workspace");
    await expect(
      authorizeOp(store, op("update", "collection", { id: "col-a", folder_id: "folder-b" }), OWNER)
    ).rejects.toThrow("folder_id does not belong to workspace");
  });

  it("allows parent references in the same workspace and clearing optional parents", async () => {
    await expect(
      authorizeOp(
        store,
        op("create", "collection", { id: "c1", workspace_id: "ws-a", space_id: "space-a", folder_id: "folder-a" }),
        EDITOR
      )
    ).resolves.toBe("ws-a");
    await expect(
      authorizeOp(store, op("update", "collection", { id: "col-a", folder_id: null }), EDITOR)
    ).resolves.toBe("ws-a");
  });

  it("requires the parent space/collection on create", async () => {
    await expect(
      authorizeOp(store, op("create", "collection", { id: "c1", workspace_id: "ws-a" }), OWNER)
    ).rejects.toThrow("Missing space_id");
    await expect(authorizeOp(store, op("create", "tab", { id: "t1" }), OWNER)).rejects.toThrow("Missing id");
  });

  it("rejects moving a row to another workspace", async () => {
    await expect(
      authorizeOp(store, op("update", "space", { id: "space-a", workspace_id: "ws-b" }), OWNER)
    ).rejects.toThrow("across workspaces");
    await expect(
      authorizeOp(store, op("update", "space", { id: "space-a", workspace_id: "ws-a", name: "x" }), OWNER)
    ).resolves.toBe("ws-a");
  });

  it("checks every row of a reorder", async () => {
    await expect(
      authorizeOp(store, op("update", "tab", { order: [{ id: "tab-a", position: 0 }] }), EDITOR)
    ).resolves.toBe("ws-a");
    await expect(
      authorizeOp(
        store,
        op("update", "tab", {
          order: [
            { id: "tab-a", position: 0 },
            { id: "tab-b", position: 1 },
          ],
        }),
        OWNER
      )
    ).rejects.toThrow("multiple workspaces");
    await expect(
      authorizeOp(store, op("update", "tab", { order: [{ id: "tab-b", position: 0 }] }), OWNER)
    ).rejects.toThrow("Forbidden");
  });

  it("rejects malformed ops", async () => {
    await expect(authorizeOp(store, { id: "x" } as unknown as PendingOp, OWNER)).rejects.toThrow("Invalid op");
    await expect(
      authorizeOp(store, op("create", "workspace" as SyncEntity, { workspace_id: "ws-a" }), OWNER)
    ).rejects.toThrow("Unknown entity");
  });
});
