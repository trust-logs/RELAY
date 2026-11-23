import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

const checks = [
  {
    type: "email_phone",
    title: "Email & phone",
    description: "Confirm the contact details used to reach you on RELAY.",
    level: "ACCOUNT",
    symbol: "@",
  },
  {
    type: "identity",
    title: "Identity",
    description: "Confirm that you are a real person before trust-sensitive actions.",
    level: "PERSONAL TRUST",
    symbol: "ID",
  },
  {
    type: "professional",
    title: "Professional credentials",
    description: "Validate relevant licences, qualifications or trade credentials.",
    level: "PROVIDER TRUST",
    symbol: "✳",
  },
  {
    type: "business",
    title: "Business",
    description: "Confirm a business and its authorised representative.",
    level: "ORGANISATION TRUST",
    symbol: "⌂",
  },
] as const;

type CheckType = (typeof checks)[number]["type"];

function statusLabel(status?: string) {
  if (!status) return "Not started";
  if (status === "verified") return "Verified";
  if (status === "pending") return "Under review";
  if (status === "rejected") return "Action needed";
  if (status === "expired") return "Expired";
  if (status === "revoked") return "Revoked";
  return "Not started";
}

function statusClass(status?: string) {
  if (status === "verified") return "trust-status trust-status-verified";
  if (status === "pending") return "trust-status trust-status-pending";
  if (status === "rejected" || status === "expired" || status === "revoked") {
    return "trust-status trust-status-action";
  }
  return "trust-status";
}

export default async function TrustPage() {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();

  if (error || !claimsData?.claims?.sub) redirect("/login");

  const userId = String(claimsData.claims.sub);
  const { data: verifications, error: verificationError } = await supabase
    .from("trust_verifications")
    .select("id, check_type, status, expires_at, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const latestByType = new Map<string, { status: string; expires_at: string | null }>();
  for (const item of verifications ?? []) {
    if (!latestByType.has(item.check_type)) latestByType.set(item.check_type, item);
  }

  return (
    <main className="dashboard-shell">
      <nav className="nav dashboard-nav">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>RELAY<span className="brand-period">.</span></span></Link>
        <div className="trust-nav-actions">
          <Link className="signout-button trust-back-link" href="/dashboard">← Dashboard</Link>
          <form action={signOut}><button className="signout-button" type="submit">Sign out ↗</button></form>
        </div>
      </nav>

      <section className="trust-page-heading">
        <div className="auth-kicker"><span className="live-dot" /> RELAY TRUST & VERIFICATION</div>
        <h1>Trust, made<br /><span>visible.</span></h1>
        <p>Build confidence with clear, meaningful checks. Your verification status is private to your account; only badges you have actually earned can appear on your public profile.</p>
      </section>

      <section className="trust-page-content">
        <div className="trust-overview">
          <div>
            <span className="dashboard-label">YOUR VERIFICATION CENTRE</span>
            <h2>Your checks</h2>
            <p>Verification is introduced in stages. You can explore RELAY before completing identity checks.</p>
          </div>
          <div className="trust-overview-mark">✓</div>
        </div>

        {verificationError ? (
          <div className="trust-alert">We couldn't load your verification status just now. Please refresh the page to try again.</div>
        ) : null}

        <div className="trust-check-list">
          {checks.map((check) => {
            const record = latestByType.get(check.type as CheckType);
            const status = record?.status;
            return (
              <article className="trust-check-card" key={check.type}>
                <div className="trust-check-symbol">{check.symbol}</div>
                <div className="trust-check-copy">
                  <span className="dashboard-label">{check.level}</span>
                  <h3>{check.title}</h3>
                  <p>{check.description}</p>
                  {record?.expires_at ? <small>Expires {new Date(record.expires_at).toLocaleDateString()}</small> : null}
                </div>
                <span className={statusClass(status)}><i />{statusLabel(status)}</span>
              </article>
            );
          })}
        </div>

        <div className="trust-explainer">
          <span className="dashboard-label">HOW RELAY VERIFICATION WORKS</span>
          <div className="trust-steps">
            <div><b>01</b><strong>Choose a check</strong><p>Start with the check required for the action you want to take.</p></div>
            <div><b>02</b><strong>Complete the review</strong><p>Submit information through a secure verification flow when it becomes available.</p></div>
            <div><b>03</b><strong>Earn your badge</strong><p>RELAY issues a badge only after the relevant check is confirmed.</p></div>
          </div>
        </div>

        <div className="trust-privacy-note">
          <span>⌑</span>
          <div><strong>Your identity belongs to you.</strong><p>RELAY will not display identity documents publicly. We will only request sensitive documents when a secure verification provider and protected submission flow are configured.</p></div>
        </div>
      </section>

      <footer className="dashboard-footer"><span>RELAY · MAKE IT HAPPEN</span><span>Trust is earned, never purchased.</span></footer>
    </main>
  );
}
