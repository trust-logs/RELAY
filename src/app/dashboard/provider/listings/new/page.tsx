import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createServiceListing } from "@/app/actions/listings";

type Props = { searchParams: Promise<{ error?: string }> };
const categories = [["errands","Errands & pickups"],["home","Home assistance"],["office","Office assistance"],["property","Property inspection"],["field","Business field tasks"],["professional","Professional services"],["other","Other services"]] as const;

export default async function NewServiceListingPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims?.claims?.sub) redirect("/login");
  const { data: provider } = await supabase.from("provider_profiles").select("user_id").eq("user_id", String(claims.claims.sub)).maybeSingle();
  if (!provider) redirect("/dashboard/provider?error=setup");
  const params = await searchParams;
  const errorMessage = params.error === "price" ? "Enter a valid price greater than zero." : params.error === "currency" ? "Choose a supported three-letter currency code." : params.error ? "Please review the details and try again." : "";
  return <main className="dashboard-shell">
    <nav className="nav dashboard-nav"><Link className="brand" href="/"><span className="brand-mark">R</span><span>RELAY<span className="brand-period">.</span></span></Link><Link className="signout-button trust-back-link" href="/dashboard/provider/listings">← My services</Link></nav>
    <section className="provider-page">
      <div className="auth-kicker"><span className="live-dot" /> RELAY NETWORK · PUBLISH A SERVICE</div>
      <div className="provider-heading-row"><div><h1>Make your<br /><span>service known.</span></h1><p>Give customers a clear picture of what you offer, what it includes and how you price it.</p></div><div className="provider-emblem">R<span>✳</span></div></div>
      {errorMessage ? <div className="auth-alert">{errorMessage}</div> : null}
      <form action={createServiceListing} className="provider-form">
        <div className="provider-form-intro"><span className="dashboard-label">01 · THE OFFER</span><h2>What service do you provide?</h2><p>Keep the title specific and describe the outcome a customer can expect.</p></div>
        <label htmlFor="listing-title">Service title *</label><input id="listing-title" name="title" required minLength={5} maxLength={120} placeholder="e.g. Same-day errands and local pickups"/>
        <label htmlFor="listing-description">Service description *</label><textarea id="listing-description" name="description" required minLength={30} maxLength={2000} rows={5} placeholder="Explain what is included, the areas you cover and any useful details customers should know."/>
        <label htmlFor="listing-category">Category *</label><select id="listing-category" name="category" defaultValue="errands">{categories.map(([value,label])=><option key={value} value={value}>{label}</option>)}</select>
        <div className="provider-form-intro provider-form-section"><span className="dashboard-label">02 · PRICING</span><h2>Set your pricing style</h2><p>You can quote individually when the work depends on the request.</p></div>
        <label htmlFor="listing-pricing">Pricing model</label><select id="listing-pricing" name="pricing_model" defaultValue="quote"><option value="quote">Request a quote</option><option value="fixed">Fixed price</option><option value="hourly">Hourly rate</option></select>
        <div className="request-budget-grid"><div><label htmlFor="listing-price">Price (leave blank for quote)</label><input id="listing-price" name="price" type="number" min="0.01" step="0.01" placeholder="e.g. 15000"/></div><div><label htmlFor="listing-currency">Currency</label><input id="listing-currency" name="currency" required minLength={3} maxLength={3} defaultValue="NGN"/></div></div>
        <div className="provider-form-note"><strong>Be transparent:</strong> Only publish services you can genuinely deliver. RELAY verification is separate and cannot be self-awarded.</div>
        <button className="auth-submit" type="submit">Publish service <span>↗</span></button><Link className="request-cancel" href="/dashboard/provider/listings">Cancel</Link>
      </form>
    </section><footer className="dashboard-footer"><span>RELAY · MAKE IT HAPPEN</span><span>Clear offers create better matches.</span></footer>
  </main>;
}
