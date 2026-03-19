import type { PendingOp } from "../domain/models";

export function enqueueOp(ops: PendingOp[], op: PendingOp) {
  return [...ops, op];
}

export function markSynced(ops: PendingOp[], opId: string) {
  return ops.filter((op) => op.id !== opId);
}