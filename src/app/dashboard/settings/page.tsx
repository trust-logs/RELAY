import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateProfile, changePassword, requestEmailChange, signOutEverywhere } from "@/app/actions/account";

type SearchParams = Promise<{ profile?: string; password?: string; email?: string }>;

function Notice({ value, kind }: { value?: string; kind: "profile" | "password" | "email" }) {
  if (!value) return null;
  const messages: Record<string, string> = {
    saved: "Your profile has been updated.",
    invalid: "Please check the details and try again.",
    error: "We couldn't complete that change. Please try again.",
    changed: "Your password has been changed.",
    sent: "Confirmation instructions have been sent to your email addresses.",
  };
  return <p className={`settings-notice ${value === "error" || value === "invalid" ? "is-error" : "is-success"}`} role="status">{messages[value] ?? (kind === "email" ? "Email update status." : "Update status.")}</p>;
}

export default async function SettingsPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient();
  const [{ data: claimsData, error }, params] = await Promise.all([supabase.auth.getClaims(), searchParams]);
  if (error || !claimsData?.claims?.sub) redirect("/login");

  const userId = String(claimsData.claims.sub);
  const email = typeof claimsData.claims.email === "string" ? claimsData.claims.email : "";
  const { data: profile } = await supabase.from("profiles")
    .select("display_name, bio, country_code, preferred_language, account_type, created_at")
    .eq("id", userId).maybeSingle();

  return (
    <main className="dashboard-shell settings-shell">
      <nav className="nav dashboard-nav">
        <Link className="brand" href="/dashboard"><span className="brand-mark">R</span><span>RELAY<span className="brand-period">.</span></span></Link>
        <div className="dashboard-nav-actions"><Link className="notification-nav-link" href="/dashboard">DASHBOARD ↗</Link><Link className="notification-nav-link" href="/dashboard/trust">RELAY TRUST</Link></div>
      </nav>
      <section className="dashboard-welcome settings-welcome">
        <div className="auth-kicker"><span className="live-dot" /> YOUR ACCOUNT, YOUR CONTROL</div>
        <h1>Settings &<br /><span>security.</span></h1>
        <p>Keep your details current and protect access to your RELAY account.</p>
      </section>

      <div className="settings-layout">
        <section className="settings-card">
          <div className="settings-card-heading"><span className="dashboard-label">01 / YOUR PROFILE</span><h2>Personal details</h2><p>These details help people recognise you across RELAY.</p></div>
          <Notice value={params.profile} kind="profile" />
          <form action={updateProfile} className="settings-form">
            <label>Display name<input name="display_name" defaultValue={profile?.display_name ?? ""} minLength={2} maxLength={80} required /></label>
            <label>About you <span className="settings-hint">(optional, up to 500 characters)</span><textarea name="bio" defaultValue={profile?.bio ?? ""} maxLength={500} rows={4} placeholder="A little about yourself..." /></label>
            <div className="settings-form-row">
              <label>Country code <span className="settings-hint">(2 letters)</span><input name="country_code" defaultValue={profile?.country_code?.trim() ?? ""} maxLength={2} placeholder="NG" /></label>
              <label>Preferred language<select name="preferred_language" defaultValue={profile?.preferred_language ?? "en"}><option value="en">English</option><option value="fr">French</option><option value="es">Spanish</option><option value="pt">Portuguese</option><option value="ar">Arabic</option></select></label>
            </div>
            <div className="settings-readonly"><span>Account type</span><strong>{profile?.account_type ?? "personal"}</strong><small>Account type is controlled by RELAY, not editable here.</small></div>
            <button className="settings-submit" type="submit">SAVE PROFILE ↗</button>
          </form>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading"><span className="dashboard-label">02 / SIGN-IN DETAILS</span><h2>Email address</h2><p>Your email is used for sign-in and important account notices.</p></div>
          <div className="settings-readonly"><span>Current email</span><strong>{email || "Not available"}</strong><small>Changing your email requires confirmation. Your current email remains active until the change is confirmed.</small></div>
          <Notice value={params.email} kind="email" />
          <form action={requestEmailChange} className="settings-form">
            <label>New email address<input type="email" name="new_email" autoComplete="email" required placeholder="you@example.com" /></label>
            <button className="settings-submit settings-submit-light" type="submit">REQUEST EMAIL CHANGE ↗</button>
          </form>
        </section>

        <section className="settings-card">
          <div className="settings-card-heading"><span className="dashboard-label">03 / PASSWORD</span><h2>Change password</h2><p>Use a unique password of at least 8 characters. Your current password is required.</p></div>
          <Notice value={params.password} kind="password" />
          <form action={changePassword} className="settings-form">
            <label>Current password<input type="password" name="current_password" autoComplete="current-password" required /></label>
            <label>New password<input type="password" name="new_password" autoComplete="new-password" minLength={8} required /></label>
            <label>Confirm new password<input type="password" name="confirm_password" autoComplete="new-password" minLength={8} required /></label>
            <button className="settings-submit" type="submit">UPDATE PASSWORD ↗</button>
          </form>
        </section>

        <section className="settings-card settings-security-card">
          <div className="settings-card-heading"><span className="dashboard-label">04 / SESSION SECURITY</span><h2>Sign out everywhere</h2><p>End all active RELAY sessions on your devices. You will need to sign in again.</p></div>
          <form action={signOutEverywhere}><button className="settings-danger-button" type="submit">SIGN OUT OF ALL DEVICES ↗</button></form>
        </section>

        <section className="settings-footnote"><span>RELAY TRUST</span><p>Verification badges and review decisions cannot be edited from profile settings. Visit the Verification Centre to see your checks and next steps.</p><Link href="/dashboard/trust">OPEN VERIFICATION CENTRE ↗</Link></section>
      </div>
      <footer className="dashboard-footer"><span>RELAY · MAKE IT HAPPEN</span><Link href="/dashboard">BACK TO DASHBOARD ↗</Link></footer>
    </main>
  );
}
