import type { Membership, MembershipStatus } from "../domain/entitlements";

export const TRIAL_DAYS = 60;

export function computeTrialEndsAt(startedAt: string | null, days = TRIAL_DAYS) {
  if (!startedAt) {
    return null;
  }
  const start = new Date(startedAt).getTime();
  if (Number.isNaN(start)) {
    return null;
  }
  return new Date(start + days * 24 * 60 * 60 * 1000).toISOString();
}

export function daysRemaining(endsAt: string | null) {
  if (!endsAt) {
    return null;
  }
  const end = new Date(endsAt).getTime();
  if (Number.isNaN(end)) {
    return null;
  }
  const diff = end - Date.now();
  return Math.max(0, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

export function resolveMembershipStatus(membership: Membership): MembershipStatus {
  const now = Date.now();
  if (membership.status === "cancelled") {
    return "cancelled";
  }
  if (membership.paidEndsAt) {
    const paidEndsAt = new Date(membership.paidEndsAt).getTime();
    if (!Number.isNaN(paidEndsAt)) {
      return paidEndsAt >= now ? "paid_active" : "paid_expired";
    }
  }
  if (membership.trialEndsAt) {
    const trialEndsAt = new Date(membership.trialEndsAt).getTime();
    if (!Number.isNaN(trialEndsAt)) {
      return trialEndsAt >= now ? "trial_active" : "trial_expired";
    }
  }
  return membership.status;
}
