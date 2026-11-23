import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

const categoryNames: Record<string, string> = {
  errands: "Errands & pickups", home: "Home assistance", office: "Office assistance",
  property: "Property inspection", field: "Business field tasks",
  professional: "Professional services", other: "Other services",
};

function priceLabel(model: string, amount: number | null, currency: string) {
  if (model === "quote" || amount === null) return "Request a quote";
  const fractionDigits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits;
  const value = amount / (10 ** fractionDigits);
  return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: fractionDigits }).format(value) + (model === "hourly" ? " / hour" : "");
}

export default async function NetworkPage() {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims?.claims?.sub) redirect("/login");

  const { data: listings } = await supabase.from("service_listings")
    .select("id, provider_user_id, title, description, category, pricing_model, price_amount_minor, currency, created_at")
    .eq("is_active", true).order("created_at", { ascending: false }).limit(60);

  const providerIds = [...new Set((listings ?? []).map((item) => item.provider_user_id))];
  const [{ data: providers }, { data: profiles }] = providerIds.length ? await Promise.all([
    supabase.from("provider_profiles").select("user_id, headline, service_area_label, years_experience, verification_status, provider_kind").in("user_id", providerIds),
    supabase.from("profiles").select("id, display_name, avatar_url").in("id", providerIds),
  ]) : [{ data: [] }, { data: [] }];

  const providerMap = new Map((providers ?? []).map((item) => [item.user_id, item]));
  const profileMap = new Map((profiles ?? []).map((item) => [item.id, item]));

  return <main className="dashboard-shell">
    <nav className="nav dashboard-nav">
      <Link className="brand" href="/"><span className="brand-mark">R</span><span>RELAY<span className="brand-period">.</span></span></Link>
      <div className="trust-nav-actions"><Link className="signout-button trust-back-link" href="/dashboard">← Dashboard</Link><form action={signOut}><button className="signout-button" type="submit">Sign out ↗</button></form></div>
    </nav>
    <section className="network-page">
      <div className="auth-kicker"><span className="live-dot" /> RELAY NETWORK · DISCOVER</div>
      <div className="network-heading"><div><h1>Find your<br /><span>people.</span></h1><p>Discover independent professionals and service teams ready to help move your plans forward.</p></div><div className="network-count"><strong>{listings?.length ?? 0}</strong><span>LIVE SERVICES</span></div></div>
      <div className="network-toolbar"><span>AVAILABLE SERVICES</span><Link href="/dashboard/provider/listings">MANAGE MY SERVICES ↗</Link></div>
      {!listings?.length ? <div className="network-empty"><span>✳</span><h2>The network is warming up.</h2><p>There are no published services yet. Provider listings will appear here as people join RELAY NETWORK.</p><Link href="/dashboard/provider">CREATE YOUR PROVIDER PROFILE ↗</Link></div> :
        <div className="network-listing-grid">{listings.map((listing) => {
          const provider = providerMap.get(listing.provider_user_id);
          const profile = profileMap.get(listing.provider_user_id);
          if (!provider) return null;
          return <article className="network-listing-card" key={listing.id}>
            <div className="network-card-top"><span className="network-category">{categoryNames[listing.category] ?? "RELAY service"}</span><span className="network-arrow">↗</span></div>
            <h2>{listing.title}</h2><p>{listing.description}</p>
            <div className="network-provider"><div className="network-avatar">{(profile?.display_name || "R").slice(0,1).toUpperCase()}</div><div><strong>{profile?.display_name || "RELAY provider"}</strong><span>{provider.service_area_label || "Service area not listed"}</span></div>{provider.verification_status === "verified" ? <span className="network-verified">✓ VERIFIED</span> : null}</div>
            <div className="network-card-bottom"><strong>{priceLabel(listing.pricing_model, listing.price_amount_minor, listing.currency)}</strong><span>{provider.years_experience ? provider.years_experience + "+ yrs experience" : "Ready to help"}</span></div>
          </article>;
        })}</div>}
      <div className="network-provider-cta"><div><span className="dashboard-label">GOT SOMETHING TO OFFER?</span><h2>Put your skills to work.</h2><p>Publish a clear service listing and let customers discover what you do.</p></div><Link href="/dashboard/provider/listings/new">PUBLISH A SERVICE ↗</Link></div>
    </section>
    <footer className="dashboard-footer"><span>RELAY · MAKE IT HAPPEN</span><span>Good work finds its way.</span></footer>
  </main>;
}
