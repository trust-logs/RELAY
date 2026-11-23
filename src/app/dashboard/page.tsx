import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();

  if (error || !claimsData?.claims?.sub) redirect("/login");

  const userId = String(claimsData.claims.sub);
  const email = typeof claimsData.claims.email === "string" ? claimsData.claims.email : "";
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, account_type")
    .eq("id", userId)
    .maybeSingle();

  const displayName = profile?.display_name?.trim() || email.split("@")[0] || "there";
  const { count: unreadNotifications } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);

  return (
    <main className="dashboard-shell">
      <nav className="nav dashboard-nav">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>RELAY<span className="brand-period">.</span></span></Link>
        <div className="dashboard-nav-actions"><Link className="notification-nav-link" href="/dashboard/notifications">ACTIVITY <span>{unreadNotifications ?? 0}</span></Link><Link className="notification-nav-link" href="/dashboard/settings">SETTINGS ⚙</Link><form action={signOut}><button className="signout-button" type="submit">Sign out ↗</button></form></div>
      </nav>
      <section className="dashboard-welcome">
        <div className="auth-kicker"><span className="live-dot" /> YOUR RELAY SPACE</div>
        <h1>Welcome in,<br /><span>{displayName}.</span></h1>
        <p>Your account is active. This is the starting point for your requests, projects, and people.</p>
        <div className="dashboard-status"><span className="status-dot" /> Signed in as {email}</div>
      </section>
      <section className="dashboard-grid">
        <article className="dashboard-card dashboard-card-main"><span className="dashboard-card-icon">✳</span><span className="dashboard-label">YOUR NEXT MOVE</span><h2>What needs<br />to get done?</h2><p>We're preparing your request workspace. Soon you'll be able to describe an outcome and organise the steps to make it happen.</p><Link className="dashboard-action-link" href="/dashboard/requests/new">CREATE A REQUEST ↗</Link><Link className="dashboard-secondary-link" href="/dashboard/requests">VIEW MY REQUESTS</Link></article>
        <article className="dashboard-card"><span className="dashboard-card-icon lime-icon">⌂</span><span className="dashboard-label">YOUR ACCOUNT</span><h2>Personal profile</h2><p>Manage your personal details, sign-in email and password, and account sessions.</p><Link className="dashboard-detail dashboard-trust-link" href="/dashboard/settings">OPEN ACCOUNT SETTINGS ↗</Link><span className="dashboard-detail">Account type: {profile?.account_type ?? "personal"}</span></article>
        <article className="dashboard-card"><span className="dashboard-card-icon dark-icon">✓</span><span className="dashboard-label">RELAY TRUST</span><h2>Trust starts here.</h2><p>See your verification checks, understand each badge and manage your trust status.</p><Link className="dashboard-detail dashboard-trust-link" href="/dashboard/trust">OPEN VERIFICATION CENTRE ↗</Link></article>
      </section>
      <section className="notification-dashboard-strip"><div><span className="dashboard-label">RELAY ACTIVITY CENTRE</span><h2>Nothing important slips through.</h2><p>New proposals, project updates and evidence uploads appear in one live activity feed.</p></div><Link href="/dashboard/notifications">OPEN ACTIVITY CENTRE ↗ <span>{unreadNotifications ?? 0} UNREAD</span></Link></section>
      <section className="provider-dashboard-cta"><div><span className="dashboard-label">RELAY NETWORK</span><h2>Find help. Offer your skills.</h2><p>Discover available services or publish what you can do.</p></div><div className="network-dashboard-actions"><Link href="/dashboard/network">EXPLORE SERVICES ↗</Link><Link href="/dashboard/provider">PROVIDER PROFILE ↗</Link><Link href="/dashboard/provider/requests">REQUEST INBOX ↗</Link><Link href="/dashboard/projects">PROJECT WORKSPACE ↗</Link></div></section><footer className="dashboard-footer"><span>RELAY · MAKE IT HAPPEN</span><span>You're signed in securely.</span></footer>
    </main>
  );
}
