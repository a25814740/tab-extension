import type { SupabaseClient } from "@supabase/supabase-js";
import type { Membership, PlanType, MembershipStatus } from "@toby/core";
import { computeTrialEndsAt, resolveMembershipStatus, TRIAL_DAYS } from "@toby/core";

type MembershipRow = {
  user_id: string;
  plan_type: string;
  status: string;
  trial_started_at: string | null;
  trial_ends_at: string | null;
  paid_starts_at: string | null;
  paid_ends_at: string | null;
  updated_at: string | null;
};

export type MembershipResult = {
  data: Membership | null;
  error?: string;
};

const DEFAULT_PLAN: PlanType = "trial";
const DEFAULT_STATUS: MembershipStatus = "trial_active";

function normalizeMembershipRow(row: MembershipRow): Membership {
  const trialEndsAt = row.trial_ends_at ?? computeTrialEndsAt(row.trial_started_at, TRIAL_DAYS);
  const membership: Membership = {
    userId: row.user_id,
    planType: (row.plan_type as PlanType) || DEFAULT_PLAN,
    status: (row.status as MembershipStatus) || DEFAULT_STATUS,
    trialStartedAt: row.trial_started_at ?? null,
    trialEndsAt,
    paidStartsAt: row.paid_starts_at ?? null,
    paidEndsAt: row.paid_ends_at ?? null,
    updatedAt: row.updated_at ?? null,
  };
  return {
    ...membership,
    status: resolveMembershipStatus(membership),
  };
}

export async function ensureTrialMembership(client: SupabaseClient): Promise<MembershipResult> {
  const user = await client.auth.getUser();
  const userId = user.data.user?.id ?? null;
  if (!userId) {
    return { data: null, error: "missing_user" };
  }

  const { data, error } = await client
    .from("memberships")
    .select("user_id, plan_type, status, trial_started_at, trial_ends_at, paid_starts_at, paid_ends_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return { data: null, error: error.message };
  }
  if (data) {
    return { data: normalizeMembershipRow(data as MembershipRow) };
  }

  const trialStartedAt = new Date().toISOString();
  const trialEndsAt = computeTrialEndsAt(trialStartedAt, TRIAL_DAYS);
  const insert = await client
    .from("memberships")
    .insert({
      user_id: userId,
      plan_type: "trial",
      status: "trial_active",
      trial_started_at: trialStartedAt,
      trial_ends_at: trialEndsAt,
    })
    .select("user_id, plan_type, status, trial_started_at, trial_ends_at, paid_starts_at, paid_ends_at, updated_at")
    .single();

  if (insert.error) {
    return { data: null, error: insert.error.message };
  }
  return { data: normalizeMembershipRow(insert.data as MembershipRow) };
}

export async function fetchMembership(client: SupabaseClient): Promise<MembershipResult> {
  const user = await client.auth.getUser();
  const userId = user.data.user?.id ?? null;
  if (!userId) {
    return { data: null, error: "missing_user" };
  }
  const { data, error } = await client
    .from("memberships")
    .select("user_id, plan_type, status, trial_started_at, trial_ends_at, paid_starts_at, paid_ends_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    return { data: null, error: error.message };
  }
  if (!data) {
    return { data: null };
  }
  return { data: normalizeMembershipRow(data as MembershipRow) };
}
