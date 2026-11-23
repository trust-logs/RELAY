import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { saveProviderProfile, saveProviderAvailability } from "@/app/actions/provider";
import { signOut } from "@/app/actions/auth";

type ProviderPageProps = { searchParams: Promise<{ error?: string; saved?: string; scheduleSaved?: string }> };

const categories = [
  ["errands", "Errands & pickups"],
  ["home", "Home assistance"],
  ["office", "Office assistance"],
  ["property", "Property inspection"],
  ["field", "Business field tasks"],
  ["professional", "Professional services"],
  ["other", "Other services"],
] as const;

const errors: Record<string, string> = {
  details: "Please complete the required fields and select at least one service category.",
  number: "Check your service radius and years of experience.",
  website: "Enter a complete website address beginning with https:// or http://.",
  schedule: "Check your time zone and availability hours. End time must be after start time.",
  save: "We couldn't save your provider profile. Please try again.",
  notaccepting: "Turn on accepting work in your provider profile before sending proposals.",
};

export default async function ProviderPage({ searchParams }: ProviderPageProps) {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  if (error || !claimsData?.claims?.sub) redirect("/login");

  const userId = String(claimsData.claims.sub);
  const params = await searchParams;
  const { data: availability } = await supabase.from("provider_availability").select("day_of_week,start_time,end_time,timezone").eq("user_id", userId).order("day_of_week");
  const availabilityByDay = new Map((availability ?? []).map((window) => [window.day_of_week, window]));
  const timezone = availability?.[0]?.timezone ?? "Africa/Lagos";
  const { data: provider } = await supabase
    .from("provider_profiles")
    .select("provider_kind, headline, description, service_area_label, service_radius_km, years_experience, website_url, service_categories, accepting_work, verification_status")
    .eq("user_id", userId)
    .maybeSingle();

  return (
    <main className="dashboard-shell">
      <nav className="nav dashboard-nav">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>RELAY<span className="brand-period">.</span></span></Link>
        <div className="trust-nav-actions">
          <Link className="signout-button trust-back-link" href="/dashboard">← Dashboard</Link>
          <form action={signOut}><button className="signout-button" type="submit">Sign out ↗</button></form>
        </div>
      </nav>

      <section className="provider-page">
        <div className="auth-kicker"><span className="live-dot" /> RELAY NETWORK · PROVIDER SETUP</div>
        <div className="provider-heading-row"><div><h1>Turn your skills<br />into <span>opportunity.</span></h1><p>Create your provider profile so customers can understand what you do, where you work and how you can help.</p></div><div className="provider-emblem">R<span>✳</span></div></div>

        <div className="provider-status-strip">
          <div><span className="dashboard-label">PROFILE STATUS</span><strong>{provider?.headline ? "Profile saved" : "Not set up yet"}</strong></div>
          <div><span className="dashboard-label">VERIFICATION</span><strong>{provider?.verification_status === "verified" ? "Verified" : "Not verified"}</strong></div>
          <div><span className="dashboard-label">WORK STATUS</span><strong>{provider?.accepting_work ? "Open to work" : provider ? "Not accepting work" : "Not set"}</strong></div>
        </div>

        {params.saved === "1" ? <div className="request-success">✓ Your provider profile has been saved.</div> : null}
        {params.scheduleSaved === "1" ? <div className="request-success">✓ Your weekly availability has been saved.</div> : null}
        {params.error && errors[params.error] ? <div className="auth-alert">{errors[params.error]}</div> : null}

        <form action={saveProviderProfile} className="provider-form">
          <div className="provider-form-intro"><span className="dashboard-label">01 · YOUR PROFILE</span><h2>Introduce your service</h2><p>Be clear and specific. A good profile helps customers decide whether you're right for their request.</p></div>
          <label htmlFor="provider-kind">I'm registering as</label>
          <select id="provider-kind" name="provider_kind" defaultValue={provider?.provider_kind ?? "individual"}><option value="individual">An individual provider</option><option value="business">A business or service team</option></select>
          <label htmlFor="provider-headline">Profile headline *</label>
          <input id="provider-headline" name="headline" required minLength={5} maxLength={100} defaultValue={provider?.headline ?? ""} placeholder="e.g. Reliable errands and delivery support" />
          <label htmlFor="provider-description">About your service *</label>
          <textarea id="provider-description" name="description" required minLength={30} maxLength={2000} rows={5} defaultValue={provider?.description ?? ""} placeholder="Describe what you do, your experience and what customers can expect." />
          <div className="provider-form-intro provider-form-section"><span className="dashboard-label">02 · WHAT YOU DO</span><h2>Choose your services</h2><p>Select every category you genuinely provide. You can update this later.</p></div>
          <div className="provider-category-grid">
            {categories.map(([value, label]) => <label className="provider-category-option" key={value}><input type="checkbox" name="service_categories" value={value} defaultChecked={provider?.service_categories?.includes(value) ?? false} /><span>{label}</span></label>)}
          </div>
          <div className="provider-form-intro provider-form-section"><span className="dashboard-label">03 · WHERE YOU WORK</span><h2>Your service area</h2><p>Tell customers which city, region or neighbourhood you can cover.</p></div>
          <label htmlFor="provider-area">Main service area *</label>
          <input id="provider-area" name="service_area_label" required maxLength={180} defaultValue={provider?.service_area_label ?? ""} placeholder="e.g. Lagos, Nigeria" />
          <div className="request-budget-grid">
            <div><label htmlFor="provider-radius">Travel radius (km)</label><input id="provider-radius" name="service_radius_km" type="number" min="1" max="500" defaultValue={provider?.service_radius_km ?? 25} /></div>
            <div><label htmlFor="provider-experience">Years of experience</label><input id="provider-experience" name="years_experience" type="number" min="0" max="80" defaultValue={provider?.years_experience ?? ""} placeholder="e.g. 3" /></div>
          </div>
          <label className="provider-availability-option"><input type="checkbox" name="accepting_work" value="true" defaultChecked={provider?.accepting_work ?? true} /><span><strong>Im accepting new work</strong><small>Allow your provider profile to receive matching requests and send proposals. You can switch this off whenever you need a break.</small></span></label>
          <div className="provider-form-intro provider-form-section"><span className="dashboard-label">04 · WHEN YOU WORK</span><h2>Set your weekly availability</h2><p>Choose the days and hours you can normally take jobs. RELAY uses this schedule to check requests with a specific date and time.</p></div>
          <form action={saveProviderAvailability} className="provider-schedule-form">
            <label htmlFor="provider-timezone">Your time zone</label>
            <input id="provider-timezone" name="timezone" required maxLength={80} defaultValue={timezone} placeholder="e.g. Africa/Lagos or Europe/London" />
            <div className="provider-week-grid">
              {["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map((day, index) => {
                const window = availabilityByDay.get(index);
                return <div className="provider-week-row" key={day}>
                  <label className="provider-week-day"><input type="checkbox" name={"availability_enabled_" + index} value="true" defaultChecked={Boolean(window)} /><strong>{day}</strong></label>
                  <label><span>From</span><input aria-label={day + " start time"} type="time" name={"availability_start_" + index} defaultValue={window?.start_time?.slice(0,5) ?? "09:00"} /></label>
                  <label><span>To</span><input aria-label={day + " end time"} type="time" name={"availability_end_" + index} defaultValue={window?.end_time?.slice(0,5) ?? "17:00"} /></label>
                </div>;
              })}
            </div>
            <p className="provider-form-note">Unticked days are treated as unavailable. You can update your hours at any time.</p>
            <button className="auth-submit" type="submit">Save weekly availability <span>↗</span></button>
          </form>
          <label htmlFor="provider-website">Website or portfolio (optional)</label>
          <input id="provider-website" name="website_url" type="url" defaultValue={provider?.website_url ?? ""} placeholder="https://yourwebsite.com" />
          <div className="provider-form-note"><strong>Important:</strong> Saving this profile does not grant a verification badge. Once saved, you can publish individual services for customers to discover.</div>
          <button className="auth-submit" type="submit">Save provider profile <span>↗</span></button>
          <Link className="request-cancel" href="/dashboard/provider/requests">Browse customer requests ↗</Link><Link className="request-cancel" href="/dashboard/provider/listings">Manage my service listings ↗</Link><Link className="request-cancel" href="/dashboard">Return to dashboard</Link>
        </form>
      </section>
      <footer className="dashboard-footer"><span>RELAY · MAKE IT HAPPEN</span><span>Good work starts with a clear profile.</span></footer>
    </main>
  );
}
