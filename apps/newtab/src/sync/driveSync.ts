import { createGoogleDriveProvider, type DriveAuthToken, type DriveSnapshot } from "@toby/google-drive-sync";
import { getAuthToken, getLocal, setLocal } from "@toby/chrome-adapters";
import { localSnapshotSchema, migrateLocalSnapshot, toSnapshot, type LocalStoreSnapshot, type MembershipStatus } from "@toby/core";
import { appStore } from "../store/appStore";

const DRIVE_FILE_NAME = "workspace_state_v1.json";
const DRIVE_SYNC_ENABLED_KEY = "toby_drive_sync_enabled_v1";
const DRIVE_SYNC_STATE_KEY = "toby_drive_sync_state_v1";
const DEVICE_ID_KEY = "toby_device_id_v1";
const MEMBERSHIP_KEY = "toby_membership_v1";

type DriveSyncState = {
  fileId: string | null;
  lastRemoteUpdatedAt: string | null;
  lastLocalUpdatedAt: string | null;
  lastSyncedAt: string | null;
};

type MembershipSnapshot = {
  status: MembershipStatus;
};

const provider = createGoogleDriveProvider<LocalStoreSnapshot>();

async function getDeviceId() {
  const stored = await getLocal<string | null>(DEVICE_ID_KEY, null);
  if (stored) {
    return stored;
  }
  const created = crypto.randomUUID();
  await setLocal(DEVICE_ID_KEY, created);
  return created;
}

async function readMembershipStatus() {
  const membership = await getLocal<MembershipSnapshot | null>(MEMBERSHIP_KEY, null);
  return membership?.status ?? null;
}

function canSync(status: MembershipStatus | null) {
  return status === "trial_active" || status === "paid_active";
}

function buildSnapshot(payload: LocalStoreSnapshot, appVersion: string, deviceId: string): DriveSnapshot<LocalStoreSnapshot> {
  return {
    schemaVersion: 1,
    appVersion,
    updatedAt: new Date().toISOString(),
    deviceId,
    payload,
  };
}

async function getDriveSyncState(): Promise<DriveSyncState> {
  return (
    (await getLocal<DriveSyncState | null>(DRIVE_SYNC_STATE_KEY, null)) ?? {
      fileId: null,
      lastRemoteUpdatedAt: null,
      lastLocalUpdatedAt: null,
      lastSyncedAt: null,
    }
  );
}

async function setDriveSyncState(state: DriveSyncState) {
  await setLocal(DRIVE_SYNC_STATE_KEY, state);
}

function shouldApplyRemote(remote: DriveSnapshot<LocalStoreSnapshot>, state: DriveSyncState) {
  if (!state.lastLocalUpdatedAt) {
    return true;
  }
  const localTime = new Date(state.lastLocalUpdatedAt).getTime();
  const remoteTime = new Date(remote.updatedAt).getTime();
  if (Number.isNaN(localTime) || Number.isNaN(remoteTime)) {
    return false;
  }
  return remoteTime > localTime;
}

async function getAppVersion() {
  if (typeof chrome !== "undefined" && chrome.runtime?.getManifest) {
    return chrome.runtime.getManifest().version ?? "0.0.0";
  }
  return "0.0.0";
}

async function getToken(interactive: boolean): Promise<DriveAuthToken | null> {
  const token = await getAuthToken(interactive);
  if (!token?.token) {
    return null;
  }
  return { accessToken: token.token, expiresAt: token.expiresAt };
}

export async function startupDriveSync() {
  const enabled = await getLocal<boolean>(DRIVE_SYNC_ENABLED_KEY, false);
  if (!enabled) {
    return;
  }
  const status = await readMembershipStatus();
  if (!canSync(status)) {
    return;
  }
  const token = await getToken(false);
  if (!token) {
    return;
  }
  const state = await getDriveSyncState();
  const file = await provider.ensureFile(token, DRIVE_FILE_NAME, { createIfMissing: false });
  if (!file) {
    return;
  }
  const remote = await provider.loadSnapshot(token, file);
  if (!remote) {
    return;
  }
  const parsed = localSnapshotSchema.safeParse(remote.payload);
  if (!parsed.success) {
    return;
  }
  if (shouldApplyRemote(remote, state)) {
    appStore.getState().hydrate(migrateLocalSnapshot(parsed.data));
  }
  await setDriveSyncState({
    ...state,
    fileId: file.fileId,
    lastRemoteUpdatedAt: remote.updatedAt,
  });
}

export async function manualDriveSync() {
  const status = await readMembershipStatus();
  if (!canSync(status)) {
    return { ok: false, error: "membership_inactive" };
  }
  const token = await getToken(true);
  if (!token) {
    return { ok: false, error: "missing_token" };
  }
  const file = await provider.ensureFile(token, DRIVE_FILE_NAME, { createIfMissing: true });
  if (!file) {
    return { ok: false, error: "drive_file_missing" };
  }
  const deviceId = await getDeviceId();
  const appVersion = await getAppVersion();
  const snapshot = buildSnapshot(toSnapshot(appStore.getState()), appVersion, deviceId);
  const result = await provider.saveSnapshot(token, file, snapshot);
  if (!result.ok) {
    return result;
  }
  await setLocal(DRIVE_SYNC_ENABLED_KEY, true);
  await setDriveSyncState({
    fileId: file.fileId,
    lastRemoteUpdatedAt: snapshot.updatedAt,
    lastLocalUpdatedAt: snapshot.updatedAt,
    lastSyncedAt: snapshot.updatedAt,
  });
  return { ok: true };
}
