import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { publishRequest, unpublishRequest, acceptProposal } from "@/app/actions/request-marketplace";

type RequestsPageProps = { searchParams: Promise<{ created?: string; published?: string; unpublished?: string; error?: string }> };

function providerFit(category: string | null, provider: { verification_status: string | null; years_experience: number | null; service_categories: string[] | null; accepting_work: boolean | null }) {
  const service = Boolean(category && provider.service_categories?.includes(category));
  const experience = Math.min(Math.max(provider.years_experience ?? 0, 0), 10) * 2;
  const verification = provider.verification_status === "verified" ? 20 : 0;
  const availability = provider.accepting_work ? 10 : 0;
  return { score: (service ? 50 : 0) + experience + verification + availability, service };
}

function formatBudget(amount: number | null, currency: string | null) {
  if (amount === null || !currency) return "Budget not set";
  try {
    const resolvedDigits = new Intl.NumberFormat("en", { style:"currency", currency }).resolvedOptions().maximumFractionDigits;
    const digits: number = typeof resolvedDigits === "number" ? resolvedDigits : 2;
    return new Intl.NumberFormat("en", { style:"currency", currency, maximumFractionDigits:digits }).format(amount / (10 ** digits));
  } catch { return `${currency} ${amount}`; }
}
function formatQuote(amount: number, currency: string) {
  try {
    const resolvedDigits = new Intl.NumberFormat("en", { style:"currency", currency }).resolvedOptions().maximumFractionDigits;
    const digits: number = typeof resolvedDigits === "number" ? resolvedDigits : 2;
    return new Intl.NumberFormat("en", { style:"currency", currency, maximumFractionDigits:digits }).format(amount / (10 ** digits));
  } catch { return `${currency} ${amount}`; }
}

export default async function RequestsPage({ searchParams }: RequestsPageProps) {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims?.claims?.sub) redirect("/login");
  const userId = String(claims.claims.sub);
  const params = await searchParams;
  const { data: requests, error: requestsError } = await supabase.from("requests")
    .select("id,title,description,category,status,budget_amount_minor,currency,location_label,desired_at,created_at")
    .eq("created_by", userId).order("created_at", { ascending:false });
  const requestIds = (requests ?? []).map((r) => r.id);
  const [{ data: publications }, { data: proposals }] = requestIds.length ? await Promise.all([
    supabase.from("request_publications").select("request_id,published_at").in("request_id", requestIds),
    supabase.from("proposals").select("id,request_id,provider_user_id,amount_minor,currency,message,estimated_duration,status,created_at").in("request_id", requestIds).order("created_at", { ascending:false }),
  ]) : [{ data: [] }, { data: [] }];
  const providerIds = [...new Set((proposals ?? []).map((p) => p.provider_user_id))];
  const [{ data: profiles }, { data: providerProfiles }] = providerIds.length ? await Promise.all([
    supabase.from("profiles").select("id,display_name").in("id",providerIds),
    supabase.from("provider_profiles").select("user_id,verification_status,headline,years_experience,service_categories,accepting_work").in("user_id",providerIds),
  ]) : [{ data: [] }, { data: [] }];
  const publishedSet = new Set((publications ?? []).map((p) => p.request_id));
  const profileMap = new Map((profiles ?? []).map((p) => [p.id,p]));
  const providerMap = new Map((providerProfiles ?? []).map((p) => [p.user_id,p]));
  const proposalsByRequest = new Map<string, typeof proposals>();
  for (const proposal of proposals ?? []) proposalsByRequest.set(proposal.request_id,[...(proposalsByRequest.get(proposal.request_id) ?? []),proposal]);
  const errors: Record<string,string> = { publish:"We couldn't share that request. Check that it is still open and try again.", unpublish:"We couldn't remove that request from the network. Please try again.", accept:"We couldn't accept that proposal. It may no longer be available." };

  return <main className="dashboard-shell">
    <nav className="nav dashboard-nav"><Link className="brand" href="/"><span className="brand-mark">R</span><span>RELAY<span className="brand-period">.</span></span></Link><div className="trust-nav-actions"><Link className="signout-button trust-back-link" href="/dashboard">← Dashboard</Link><form action={signOut}><button className="signout-button" type="submit">Sign out ↗</button></form></div></nav>
    <section className="requests-page">
      <div className="requests-page-top"><div><div className="auth-kicker"><span className="live-dot" /> YOUR RELAY LIFE</div><h1>Your <span>requests.</span></h1><p>Keep track of what needs doing, share selected requests with providers and compare their proposals.</p></div><Link className="button button-primary" href="/dashboard/requests/new">Create a request <span>↗</span></Link></div>
      {params.created === "1" ? <div className="request-success">✓ Your request has been saved privately to your account.</div> : null}
      {params.published === "1" ? <div className="request-success">✓ Your request is now visible to eligible RELAY providers.</div> : null}
      {params.unpublished === "1" ? <div className="request-success">✓ Your request has been removed from provider discovery.</div> : null}
      {params.error && errors[params.error] ? <div className="auth-alert">{errors[params.error]}</div> : null}
      {requestsError ? <div className="auth-alert">We couldn't load your requests. Please refresh the page.</div> : null}
      {!requestsError && (!requests || requests.length === 0) ? <div className="requests-empty"><span>✳</span><h2>Your next move starts here.</h2><p>When you publish a request, it will appear here so you can follow its progress.</p><Link className="button button-primary" href="/dashboard/requests/new">Create your first request <span>↗</span></Link></div> : null}
      <div className="requests-list">{(requests ?? []).map((request) => {
        const isPublished = publishedSet.has(request.id);
        const requestProposals = proposalsByRequest.get(request.id) ?? [];
        return <article className="request-list-card request-marketplace-card" key={request.id}>
          <div className="request-list-main"><span className="dashboard-label">{(request.category || "GENERAL").replaceAll("_"," ").toUpperCase()}</span><h2>{request.title}</h2><p>{request.description || "No extra details provided."}</p><small>{request.location_label || "Location not set"} · {new Date(request.created_at).toLocaleDateString()}{request.desired_at ? ` · Needed by ${new Date(request.desired_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}` : ""}</small></div>
          <div className="request-list-meta"><span className="request-list-status">{isPublished ? "shared with network" : request.status.replaceAll("_"," ")}</span><strong>{formatBudget(request.budget_amount_minor,request.currency)}</strong>
            {isPublished ? <form action={unpublishRequest}><input type="hidden" name="request_id" value={request.id}/><button className="listing-toggle" type="submit">Stop sharing</button></form> :
              request.status === "open" ? <form action={publishRequest}><input type="hidden" name="request_id" value={request.id}/><button className="request-share-button" type="submit">Share with providers ↗</button></form> : null}
          </div>
          {isPublished || request.status === "matched" ? <div className="request-proposals"><div className="request-proposals-heading"><strong>{requestProposals.length} {requestProposals.length === 1 ? "proposal" : "proposals"}</strong><span>Provider responses</span></div>
            {!requestProposals.length ? <p className="request-no-proposals">Your request is live. Provider proposals will appear here.</p> :
              requestProposals.map((proposal) => {
                const profile = profileMap.get(proposal.provider_user_id);
                const provider = providerMap.get(proposal.provider_user_id);
                const fit = provider ? providerFit(request.category, provider) : null;
                return <div className="request-proposal-row" key={proposal.id}><div><strong>{profile?.display_name || "RELAY provider"} {provider?.verification_status === "verified" ? <span className="network-verified">✓ VERIFIED</span> : null}</strong>{fit ? <div className="customer-provider-fit"><b>{fit.score}% request fit</b><span>{fit.service ? "Service category matches" : "Service category differs"} · {provider?.years_experience ?? 0} yrs experience · {provider?.accepting_work ? "Open to work" : "Not currently accepting work"}</span></div> : null}<p>{proposal.message}</p><small>{proposal.estimated_duration || "Timing to be discussed"} · {new Date(proposal.created_at).toLocaleDateString()}</small></div><div className="request-proposal-price"><strong>{formatQuote(proposal.amount_minor,proposal.currency)}</strong><span>{proposal.status}</span>{proposal.status === "pending" && request.status === "open" ? <form action={acceptProposal}><input type="hidden" name="proposal_id" value={proposal.id}/><button className="proposal-accept-button" type="submit">Accept proposal ↗</button></form> : null}</div></div>;
              })}
          </div> : <div className="request-private-note">Private to you. Share it with providers only when you're ready.</div>}
        </article>;
      })}</div>
    </section><footer className="dashboard-footer"><span>RELAY · MAKE IT HAPPEN</span><span>You decide when a request is shared.</span></footer>
  </main>;
}
