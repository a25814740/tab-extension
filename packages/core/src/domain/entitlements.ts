export type PlanType = "trial" | "personal_yearly" | "pro_monthly" | "team" | "enterprise";

export type MembershipStatus = "trial_active" | "trial_expired" | "paid_active" | "paid_expired" | "cancelled";

export type FeatureFlag =
  | "PRO_FUTURE"
  | "TEAM_FUTURE"
  | "can_use_byo_ai"
  | "can_use_share_links"
  | "can_use_team_workspace";

export type Entitlement = {
  key: FeatureFlag;
  enabled: boolean;
  expiresAt: string | null;
  source: "trial" | "paid" | "manual";
};

export type Membership = {
  userId: string;
  planType: PlanType;
  status: MembershipStatus;
  trialStartedAt: string | null;
  trialEndsAt: string | null;
  paidStartsAt: string | null;
  paidEndsAt: string | null;
  updatedAt: string | null;
};

export type FeatureGate = {
  key: FeatureFlag;
  requiresPaid: boolean;
};

export const DEFAULT_FEATURE_GATES: FeatureGate[] = [
  { key: "can_use_byo_ai", requiresPaid: false },
  { key: "can_use_share_links", requiresPaid: true },
  { key: "can_use_team_workspace", requiresPaid: true },
  { key: "PRO_FUTURE", requiresPaid: true },
  { key: "TEAM_FUTURE", requiresPaid: true },
];
