import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { updateListingStatus } from "@/app/actions/listings";

type Props = { searchParams: Promise<{ created?: string; saved?: string; error?: string }> };

export default async function ProviderListingsPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims?.claims?.sub) redirect("/login");
  const userId = String(claims.claims.sub);
  const params = await searchParams;
  const { data: listings } = await supabase.from("service_listings")
    .select("id,title,category,pricing_model,price_amount_minor,currency,is_active,created_at")
    .eq("provider_user_id", userId).order("created_at", { ascending: false });
  const categoryNames: Record<string,string> = { errands:"Errands & pickups",home:"Home assistance",office:"Office assistance",property:"Property inspection",field:"Business field tasks",professional:"Professional services",other:"Other services" };
  return <main className="dashboard-shell">
    <nav className="nav dashboard-nav"><Link className="brand" href="/"><span className="brand-mark">R</span><span>RELAY<span className="brand-period">.</span></span></Link><div className="trust-nav-actions"><Link className="signout-button trust-back-link" href="/dashboard/provider">← Provider profile</Link><form action={signOut}><button className="signout-button" type="submit">Sign out ↗</button></form></div></nav>
    <section className="network-page">
      <div className="auth-kicker"><span className="live-dot" /> RELAY NETWORK · MY SERVICES</div>
      <div className="network-heading"><div><h1>Your work.<br /><span>Your terms.</span></h1><p>Manage the services customers can discover. You stay in control of what is visible.</p></div><Link className="network-add-button" href="/dashboard/provider/listings/new">＋ ADD A SERVICE</Link></div>
      {params.created === "1" ? <div className="request-success">✓ Your service is now published in RELAY NETWORK.</div> : null}
      {params.saved === "1" ? <div className="request-success">✓ Your listing visibility was updated.</div> : null}
      {params.error ? <div className="auth-alert">We couldn't update that listing. Please try again.</div> : null}
      {!listings?.length ? <div className="network-empty"><span>✳</span><h2>Your first service starts here.</h2><p>Describe one clear service customers can hire you for. You can publish more whenever you're ready.</p><Link href="/dashboard/provider/listings/new">CREATE YOUR FIRST LISTING ↗</Link></div> :
        <div className="provider-listing-stack">{listings.map((item) => <article className="provider-listing-row" key={item.id}><div><span className="network-category">{categoryNames[item.category] ?? item.category}</span><h2>{item.title}</h2><span className={item.is_active ? "listing-live" : "listing-paused"}>{item.is_active ? "● LIVE IN NETWORK" : "○ HIDDEN FROM NETWORK"}</span></div><form action={updateListingStatus}><input type="hidden" name="listing_id" value={item.id}/><input type="hidden" name="is_active" value={String(!item.is_active)}/><button className="listing-toggle" type="submit">{item.is_active ? "Pause listing" : "Publish listing"}</button></form></article>)}</div>}
      <p className="network-footnote">A verification badge is only displayed after RELAY approves the relevant checks. Publishing a listing does not grant verification.</p>
    </section><footer className="dashboard-footer"><span>RELAY · MAKE IT HAPPEN</span><span>Build trust through good work.</span></footer>
  </main>;
}
