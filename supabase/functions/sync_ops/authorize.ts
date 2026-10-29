// Workspace authorization for sync_ops. Kept free of Deno/URL imports so it can be unit-tested with vitest.

export type SyncEntity = "space" | "folder" | "collection" | "tab";

export type PendingOp = {
  id: string;
  type: "create" | "update" | "delete";
  entity: SyncEntity;
  payload: Record<string, unknown>;
};

export type ParentEntity = "space" | "folder" | "collection";

export interface AuthorizationStore {
  /** Owner of the workspace, or null when the workspace does not exist. */
  getWorkspaceOwnerId(workspaceId: string): Promise<string | null>;
  /** Role of the user in workspace_members, or null when not a member. */
  getMemberRole(workspaceId: string, userId: string): Promise<string | null>;
  /** workspace_id of an existing row (tabs resolve through their collection), or null when missing. */
  getRowWorkspaceId(entity: SyncEntity, id: string): Promise<string | null>;
}

export const WRITE_ROLES = ["owner", "admin", "editor"] as const;

export class SyncAuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SyncAuthorizationError";
  }
}

// Reference columns that point at another row, and which entity they point at.
const PARENT_REFS: Record<SyncEntity, Array<[column: string, camel: string, parent: ParentEntity]>> = {
  space: [],
  folder: [
    ["space_id", "spaceId", "space"],
    ["parent_folder_id", "parentFolderId", "folder"],
  ],
  collection: [
    ["space_id", "spaceId", "space"],
    ["folder_id", "folderId", "folder"],
  ],
  tab: [["collection_id", "collectionId", "collection"]],
};

function readRef(payload: Record<string, unknown>, column: string, camel: string): string | null | undefined {
  const value = column in payload ? payload[column] : payload[camel];
  if (value === undefined || value === null) {
    return value as null | undefined;
  }
  if (typeof value !== "string" || value.length === 0) {
    throw new SyncAuthorizationError(`Invalid ${column}`);
  }
  return value;
}

function hasRef(payload: Record<string, unknown>, column: string, camel: string) {
  return column in payload || camel in payload;
}

async function canWrite(store: AuthorizationStore, workspaceId: string, userId: string) {
  const ownerId = await store.getWorkspaceOwnerId(workspaceId);
  if (!ownerId) {
    return false;
  }
  if (ownerId === userId) {
    return true;
  }
  const role = await store.getMemberRole(workspaceId, userId);
  return role !== null && (WRITE_ROLES as readonly string[]).includes(role);
}

async function requireRowWorkspace(store: AuthorizationStore, entity: SyncEntity, id: unknown) {
  if (typeof id !== "string" || id.length === 0) {
    throw new SyncAuthorizationError(`Missing id for ${entity}`);
  }
  const workspaceId = await store.getRowWorkspaceId(entity, id);
  if (!workspaceId) {
    throw new SyncAuthorizationError(`${entity} ${id} not found`);
  }
  return workspaceId;
}

/** Every parent reference in the payload must point at a row in the same workspace. */
async function checkParentRefs(
  store: AuthorizationStore,
  op: PendingOp,
  workspaceId: string,
  required: boolean
) {
  for (const [column, camel, parent] of PARENT_REFS[op.entity]) {
    if (!hasRef(op.payload, column, camel)) {
      // On create, a tab must name its collection; folders/collections must name their space.
      if (required && (column === "space_id" || column === "collection_id")) {
        throw new SyncAuthorizationError(`Missing ${column}`);
      }
      continue;
    }
    const refId = readRef(op.payload, column, camel);
    if (refId === null || refId === undefined) {
      if (column === "space_id" || column === "collection_id") {
        throw new SyncAuthorizationError(`Missing ${column}`);
      }
      continue;
    }
    const refWorkspaceId = await store.getRowWorkspaceId(parent, refId);
    if (refWorkspaceId !== workspaceId) {
      throw new SyncAuthorizationError(`${column} does not belong to workspace`);
    }
  }
}

/**
 * Resolves the workspace an op touches and verifies the user may write to it.
 * Returns the workspace id (used for the audit log). Throws SyncAuthorizationError otherwise.
 */
export async function authorizeOp(store: AuthorizationStore, op: PendingOp, userId: string): Promise<string> {
  if (!op || typeof op !== "object" || !op.payload || typeof op.payload !== "object") {
    throw new SyncAuthorizationError("Invalid op");
  }
  if (!(op.entity in PARENT_REFS)) {
    throw new SyncAuthorizationError("Unknown entity");
  }

  let workspaceId: string;

  if (op.type === "create") {
    if (op.entity === "tab") {
      const collectionId = readRef(op.payload, "collection_id", "collectionId");
      workspaceId = await requireRowWorkspace(store, "collection", collectionId);
    } else {
      const declared = readRef(op.payload, "workspace_id", "workspaceId");
      if (!declared) {
        throw new SyncAuthorizationError("Missing workspace_id");
      }
      workspaceId = declared;
    }
    if (!(await canWrite(store, workspaceId, userId))) {
      throw new SyncAuthorizationError("Forbidden");
    }
    await checkParentRefs(store, op, workspaceId, true);
    return workspaceId;
  }

  if (op.type === "update" && Array.isArray(op.payload.order)) {
    const items = op.payload.order as Array<{ id?: unknown }>;
    if (items.length === 0) {
      throw new SyncAuthorizationError("Empty order");
    }
    const workspaceIds = new Set<string>();
    for (const item of items) {
      workspaceIds.add(await requireRowWorkspace(store, op.entity, item?.id));
    }
    if (workspaceIds.size !== 1) {
      throw new SyncAuthorizationError("Order spans multiple workspaces");
    }
    workspaceId = [...workspaceIds][0];
    if (!(await canWrite(store, workspaceId, userId))) {
      throw new SyncAuthorizationError("Forbidden");
    }
    return workspaceId;
  }

  if (op.type === "update" || op.type === "delete") {
    workspaceId = await requireRowWorkspace(store, op.entity, op.payload.id);
    if (!(await canWrite(store, workspaceId, userId))) {
      throw new SyncAuthorizationError("Forbidden");
    }
    if (op.type === "update") {
      if (hasRef(op.payload, "workspace_id", "workspaceId")) {
        const target = readRef(op.payload, "workspace_id", "workspaceId");
        if (target !== workspaceId) {
          throw new SyncAuthorizationError("Moving rows across workspaces is not allowed");
        }
      }
      await checkParentRefs(store, op, workspaceId, false);
    }
    return workspaceId;
  }

  throw new SyncAuthorizationError("Unknown op type");
}
