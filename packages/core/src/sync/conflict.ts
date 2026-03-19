export type ConflictResolution<T> = {
  resolved: T;
  strategy: "last-write-wins";
};

// Placeholder conflict resolver: last-write-wins based on updatedAt.
export function resolveConflict<T extends { updatedAt: string }>(local: T, remote: T): ConflictResolution<T> {
  const localTime = new Date(local.updatedAt).getTime();
  const remoteTime = new Date(remote.updatedAt).getTime();
  if (Number.isNaN(localTime) || Number.isNaN(remoteTime)) {
    return { resolved: remote, strategy: "last-write-wins" };
  }
  return {
    resolved: localTime >= remoteTime ? local : remote,
    strategy: "last-write-wins",
  };
}
