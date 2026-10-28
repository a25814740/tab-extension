import { useEffect, useState } from "react";
import { getLocal, getAuthToken } from "@toby/chrome-adapters";
import { daysRemaining, type MembershipStatus } from "@toby/core";

type MembershipSnapshot = {
  planType: string;
  status: MembershipStatus;
  trialEndsAt: string | null;
  paidEndsAt: string | null;
  updatedAt: string | null;
};

const MEMBERSHIP_KEY = "toby_membership_v1";

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleDateString();
}

export function App() {
  const [membership, setMembership] = useState<MembershipSnapshot | null>(null);
  const [googleStatus, setGoogleStatus] = useState("unknown");

  useEffect(() => {
    void (async () => {
      const stored = await getLocal<MembershipSnapshot | null>(MEMBERSHIP_KEY, null);
      setMembership(stored);
    })();
  }, []);

  const remaining = membership?.trialEndsAt ? daysRemaining(membership.trialEndsAt) : null;

  const handleCheckGoogle = async () => {
    const token = await getAuthToken(false);
    setGoogleStatus(token?.token ? "connected" : "disconnected");
  };

  return (
    <div className="page">
      <section className="card">
        <div className="title">Account</div>
        <div className="row">
          <span className="muted">Google Drive</span>
          <span>{googleStatus}</span>
        </div>
        <button className="button" onClick={handleCheckGoogle}>
          檢查 Google 連線
        </button>
      </section>

      <section className="card">
        <div className="title">Plan & Trial</div>
        <div className="row">
          <span className="muted">Plan</span>
          <span>{membership?.planType ?? "unknown"}</span>
        </div>
        <div className="row">
          <span className="muted">Status</span>
          <span>{membership?.status ?? "unknown"}</span>
        </div>
        <div className="row">
          <span className="muted">Trial ends</span>
          <span>{formatDate(membership?.trialEndsAt ?? null)}</span>
        </div>
        <div className="row">
          <span className="muted">Trial days left</span>
          <span>{remaining ?? "—"}</span>
        </div>
      </section>

      <section className="card">
        <div className="title">Billing</div>
        <div className="row">
          <span className="muted">Paid ends</span>
          <span>{formatDate(membership?.paidEndsAt ?? null)}</span>
        </div>
        <button className="button">購買年費 NT$99</button>
      </section>
    </div>
  );
}
