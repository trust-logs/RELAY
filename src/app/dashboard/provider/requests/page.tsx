import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { submitProposal } from "@/app/actions/request-marketplace";

type Props = { searchParams: Promise<{ error?: string; sent?: string }> };
const categoryNames: Record<string,string> = { errands:"Errands & pickups",home:"Home assistance",office:"Office assistance",property:"Property inspection",field:"Business field tasks",professional:"Professional services",other:"Other" };

function formatBudget(amount: number | null, currency: string | null) {
  if (amount === null || !currency) return "Customer budget not set";
  try {
    const digits = new Intl.NumberFormat("en", { style:"currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
    return new Intl.NumberFormat("en", { style:"currency", currency, maximumFractionDigits:digits }).format(amount / (10 ** digits));
  } catch { return "Customer budget provided"; }
}

export default async function ProviderRequestsPage({ searchParams }: Props) {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims?.claims?.sub) redirect("/login");
  const userId = String(claims.claims.sub);
  const params = await searchParams;
  const [{ data: provider }, { data: requests }] = await Promise.all([
    supabase.from("provider_profiles").select("accepting_work").eq("user_id", userId).maybeSingle(),
    supabase.from("request_publications").select("request_id,title,description,category,budget_amount_minor,currency,published_at").order("published_at", { ascending:false }).limit(60),
  ]);
  const { data: myProposals } = await supabase.from("proposals").select("request_id,status").eq("provider_user_id", userId);
  const proposalMap = new Map((myProposals ?? []).map((p) => [p.request_id,p.status]));
  const errors: Record<string,string> = {
    details:"Check your proposal details and try again.", amount:"Enter a valid amount greater than zero.",
    closed:"This request is no longer available.", currency:"Your quote must use the customer's requested currency.",
    duplicate:"You've already sent a proposal for this request.", notaccepting:"Turn on accepting work in your provider profile first.",
  };

  return <main className="dashboard-shell">
    <nav className="nav dashboard-nav"><Link className="brand" href="/"><span className="brand-mark">R</span><span>RELAY<span className="brand-period">.</span></span></Link><div className="trust-nav-actions"><Link className="signout-button trust-back-link" href="/dashboard/provider">← Provider profile</Link><form action={signOut}><button className="signout-button" type="submit">Sign out ↗</button></form></div></nav>
    <section className="network-page">
      <div className="auth-kicker"><span className="live-dot" /> RELAY NETWORK · OPEN REQUESTS</div>
      <div className="network-heading"><div><h1>Good work<br /><span>starts here.</span></h1><p>Browse customer requests shared with RELAY NETWORK. Exact addresses and private contact details are not shown in this feed.</p></div><div className="network-count"><strong>{requests?.length ?? 0}</strong><span>OPEN REQUESTS</span></div></div>
      {params.sent === "1" ? <div className="request-success">✓ Your proposal has been sent to the customer.</div> : null}
      {params.error && errors[params.error] ? <div className="auth-alert">{errors[params.error]}</div> : null}
      {!provider?.accepting_work ? <div className="network-empty"><span>✳</span><h2>Switch on your availability.</h2><p>Your provider profile must be set to accepting work before you can browse requests or send proposals.</p><Link href="/dashboard/provider">UPDATE PROVIDER PROFILE ↗</Link></div> :
      !requests?.length ? <div className="network-empty"><span>✳</span><h2>No open requests just yet.</h2><p>When customers share requests with the network, they will appear here. Check back soon.</p><Link href="/dashboard/network">EXPLORE SERVICES ↗</Link></div> :
      <div className="provider-request-stack">{requests.map((request) => {
        const existing = proposalMap.get(request.request_id);
        return <article className="provider-request-card" key={request.request_id}>
          <div className="provider-request-top"><span className="network-category">{categoryNames[request.category ?? "other"] ?? "Other"}</span><span className="provider-request-date">Shared {new Date(request.published_at).toLocaleDateString()}</span></div>
          <h2>{request.title}</h2><p>{request.description}</p>
          <div className="provider-request-meta"><strong>{formatBudget(request.budget_amount_minor,request.currency)}</strong><span>Location details shared by customer after selection</span></div>
          {existing ? <div className="proposal-sent-state">✓ Proposal already sent · {existing.replaceAll("_"," ")}</div> :
          <details className="proposal-composer"><summary>Send a proposal ↗</summary><form action={submitProposal}>
            <input type="hidden" name="request_id" value={request.request_id}/>
            <div className="request-budget-grid"><div><label>Quote amount *</label><input type="number" name="amount" min="0.01" step="any" required placeholder="Your total price"/></div><div><label>Currency *</label><input name="currency" defaultValue={request.currency?.trim() || "NGN"} minLength={3} maxLength={3} required/></div></div>
            <label>Estimated time (optional)</label><input name="estimated_duration" maxLength={100} placeholder="e.g. 2 hours, 3 working days"/>
            <label>Why are you right for this job? *</label><textarea name="message" rows={4} minLength={20} maxLength={2000} required placeholder="Explain how you will deliver the outcome, what's included and any important conditions."/>
            <button className="auth-submit" type="submit">Send proposal <span>↗</span></button>
          </form></details>}
        </article>;
      })}</div>}
      <p className="network-footnote">Only send proposals for work you can deliver. Sending a proposal does not create a contract or authorise payment.</p>
    </section><footer className="dashboard-footer"><span>RELAY · MAKE IT HAPPEN</span><span>Earn trust through clear commitments.</span></footer>
  </main>;
}
