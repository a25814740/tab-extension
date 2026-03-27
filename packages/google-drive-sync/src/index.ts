export type DriveAuthToken = {
  accessToken: string;
  expiresAt: number;
};

export type DriveFilePointer = {
  fileId: string;
  name: string;
  mimeType: string;
};

export type DriveSnapshot<T> = {
  schemaVersion: number;
  appVersion: string;
  updatedAt: string;
  deviceId: string;
  payload: T;
};

export type DriveSyncState = {
  file: DriveFilePointer | null;
  lastSyncedAt: string | null;
  lastRemoteUpdatedAt: string | null;
  dirty: boolean;
};

export type DriveSyncResult = {
  ok: boolean;
  error?: string;
};

export type DriveSyncProvider<T> = {
  ensureFile: (
    token: DriveAuthToken,
    name: string,
    options?: { createIfMissing?: boolean }
  ) => Promise<DriveFilePointer | null>;
  loadSnapshot: (token: DriveAuthToken, file: DriveFilePointer) => Promise<DriveSnapshot<T> | null>;
  saveSnapshot: (token: DriveAuthToken, file: DriveFilePointer, snapshot: DriveSnapshot<T>) => Promise<DriveSyncResult>;
};

export { createGoogleDriveProvider } from "./googleDriveProvider";

export function createMockDriveSyncProvider<T>(): DriveSyncProvider<T> {
  let stored: DriveSnapshot<T> | null = null;
  let file: DriveFilePointer | null = null;
  return {
    async ensureFile(_token, name, options) {
      if (file) {
        return file;
      }
      if (options?.createIfMissing === false) {
        return null;
      }
      file = {
        fileId: `mock_${Math.random().toString(36).slice(2)}`,
        name,
        mimeType: "application/json",
      };
      return file;
    },
    async loadSnapshot() {
      return stored;
    },
    async saveSnapshot(_token, nextFile, snapshot) {
      file = nextFile;
      stored = snapshot;
      return { ok: true };
    },
  };
}
