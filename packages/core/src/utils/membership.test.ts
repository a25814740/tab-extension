import { describe, expect, it } from "vitest";
import { resolveMembershipStatus } from "./membership";

describe("resolveMembershipStatus", () => {
  it("marks active trial when endsAt is in the future", () => {
    const future = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const result = resolveMembershipStatus({
      userId: "u1",
      planType: "trial",
      status: "trial_active",
      trialStartedAt: new Date().toISOString(),
      trialEndsAt: future,
      paidStartsAt: null,
      paidEndsAt: null,
      updatedAt: null,
    });
    expect(result).toBe("trial_active");
  });

  it("marks expired trial when endsAt is in the past", () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const result = resolveMembershipStatus({
      userId: "u1",
      planType: "trial",
      status: "trial_active",
      trialStartedAt: new Date().toISOString(),
      trialEndsAt: past,
      paidStartsAt: null,
      paidEndsAt: null,
      updatedAt: null,
    });
    expect(result).toBe("trial_expired");
  });
});
