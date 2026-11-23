import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createRequest } from "@/app/actions/requests";
import { signOut } from "@/app/actions/auth";
import { RequestScheduleField } from "./request-schedule";

type NewRequestPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  invalid: "Add a title, provide at least 10 characters of detail, and choose a future target time if needed.",
  budget: "Enter a valid budget and a three-letter currency code.",
  currency: "That currency code isn't recognised. Try a valid ISO currency code such as NGN, USD, GBP or EUR.",
  save: "We couldn't save your request. Please try again.",
};

export default async function NewRequestPage({ searchParams }: NewRequestPageProps) {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  if (error || !claimsData?.claims?.sub) redirect("/login");

  const params = await searchParams;

  return (
    <main className="dashboard-shell">
      <nav className="nav dashboard-nav">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>RELAY<span className="brand-period">.</span></span></Link>
        <div className="trust-nav-actions">
          <Link className="signout-button trust-back-link" href="/dashboard/requests">← My requests</Link>
          <form action={signOut}><button className="signout-button" type="submit">Sign out ↗</button></form>
        </div>
      </nav>

      <section className="request-form-layout">
        <div className="request-form-intro">
          <div className="auth-kicker"><span className="live-dot" /> RELAY LIFE · NEW REQUEST</div>
          <h1>What needs<br /><span>to get done?</span></h1>
          <p>Tell us the outcome you need. Start with the essentials; you can add more detail as your request develops.</p>
          <div className="request-form-promise"><span>✳</span><p><strong>One clear request.</strong><br />RELAY is being built to help turn it into an organised plan.</p></div>
        </div>

        <form className="request-form" action={createRequest}>
          <div className="request-form-heading"><span className="dashboard-label">THE DETAILS</span><h2>Describe your request</h2><p>Fields marked with * are required.</p></div>
          {params.error && errorMessages[params.error] ? <div className="auth-alert">{errorMessages[params.error]}</div> : null}
          <label htmlFor="request-title">What do you need? *</label>
          <input id="request-title" name="title" required minLength={3} maxLength={160} placeholder="e.g. Pick up a package and deliver it" />
          <label htmlFor="request-description">Describe what success looks like *</label>
          <textarea id="request-description" name="description" required maxLength={5000} rows={5} placeholder="Share the important details, instructions and anything the person helping you should know." />
          <label htmlFor="request-category">Category</label>
          <select id="request-category" name="category" defaultValue="">
            <option value="">Choose a category</option>
            <option value="errands">Errands & pickups</option>
            <option value="home">Home assistance</option>
            <option value="office">Office assistance</option>
            <option value="property">Property inspection</option>
            <option value="field">Business field task</option>
            <option value="professional">Professional service</option>
            <option value="other">Other</option>
          </select>
          <RequestScheduleField />
          <div className="request-budget-grid">
            <div><label htmlFor="request-budget">Your budget (optional)</label><input id="request-budget" name="budget" type="number" min="0" step="any" placeholder="e.g. 25000" /></div>
            <div><label htmlFor="request-currency">Currency</label><input id="request-currency" name="currency" defaultValue="NGN" maxLength={3} minLength={3} placeholder="NGN" /></div>
          </div>
          <label htmlFor="request-location">Where is this needed? (optional)</label>
          <input id="request-location" name="location_label" maxLength={240} placeholder="City, area or address" />
          <div className="request-form-footnote">Your request will be saved as open. You remain in control of any provider selection, quote approval and payment.</div>
          <button className="auth-submit" type="submit">Publish request <span>↗</span></button>
          <Link className="request-cancel" href="/dashboard">Cancel and return to dashboard</Link>
        </form>
      </section>
      <footer className="dashboard-footer"><span>RELAY · MAKE IT HAPPEN</span><span>Your request is private to your account for now.</span></footer>
    </main>
  );
}
