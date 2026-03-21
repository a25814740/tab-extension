import type { DriveAuthToken, DriveFilePointer, DriveSnapshot, DriveSyncProvider, DriveSyncResult } from "./index";

const DRIVE_API = "https://www.googleapis.com/drive/v3/files";
const DRIVE_UPLOAD_API = "https://www.googleapis.com/upload/drive/v3/files";

type DriveFileListResponse = {
  files?: Array<{ id: string; name: string; mimeType: string }>;
};

function authHeaders(token: DriveAuthToken) {
  return {
    Authorization: `Bearer ${token.accessToken}`,
  };
}

async function findFile(token: DriveAuthToken, name: string): Promise<DriveFilePointer | null> {
  const query = `name='${name.replace(/'/g, "\\'")}' and 'appDataFolder' in parents and trashed=false`;
  const url = `${DRIVE_API}?spaces=appDataFolder&fields=files(id,name,mimeType)&q=${encodeURIComponent(query)}`;
  const response = await fetch(url, { headers: authHeaders(token) });
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as DriveFileListResponse;
  const file = data.files?.[0];
  if (!file) {
    return null;
  }
  return { fileId: file.id, name: file.name, mimeType: file.mimeType };
}

async function createFile(token: DriveAuthToken, name: string): Promise<DriveFilePointer | null> {
  const response = await fetch(`${DRIVE_API}?fields=id,name,mimeType`, {
    method: "POST",
    headers: {
      ...authHeaders(token),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      parents: ["appDataFolder"],
      mimeType: "application/json",
    }),
  });
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as { id: string; name: string; mimeType: string };
  return { fileId: data.id, name: data.name, mimeType: data.mimeType };
}

export function createGoogleDriveProvider<T>(): DriveSyncProvider<T> {
  return {
    async ensureFile(token, name, options) {
      const existing = await findFile(token, name);
      if (existing) {
        return existing;
      }
      if (options?.createIfMissing === false) {
        return null;
      }
      return createFile(token, name);
    },
    async loadSnapshot(token, file) {
      const response = await fetch(`${DRIVE_API}/${file.fileId}?alt=media`, {
        headers: authHeaders(token),
      });
      if (!response.ok) {
        return null;
      }
      try {
        return (await response.json()) as DriveSnapshot<T>;
      } catch {
        return null;
      }
    },
    async saveSnapshot(token, file, snapshot): Promise<DriveSyncResult> {
      const response = await fetch(`${DRIVE_UPLOAD_API}/${file.fileId}?uploadType=media`, {
        method: "PATCH",
        headers: {
          ...authHeaders(token),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(snapshot),
      });
      if (!response.ok) {
        return { ok: false, error: `drive_write_failed_${response.status}` };
      }
      return { ok: true };
    },
  };
}
