import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

type RequestsPageProps = {
  searchParams: Promise<{ created?: string }>;
};

function formatBudget(amount: number | null, currency: string | null) {
  if (amount === null || !currency) return "Budget not set";
  try {
    const digits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
    return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: digits }).format(amount / 10 ** digits);
  } catch {
    return `${currency} ${amount}`;
  }
}

export default async function RequestsPage({ searchParams }: RequestsPageProps) {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  if (error || !claimsData?.claims?.sub) redirect("/login");

  const userId = String(claimsData.claims.sub);
  const params = await searchParams;
  const { data: requests, error: requestsError } = await supabase
    .from("requests")
    .select("id, title, description, category, status, budget_amount_minor, currency, location_label, created_at")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  return (
    <main className="dashboard-shell">
      <nav className="nav dashboard-nav">
        <Link className="brand" href="/"><span className="brand-mark">R</span><span>RELAY<span className="brand-period">.</span></span></Link>
        <div className="trust-nav-actions">
          <Link className="signout-button trust-back-link" href="/dashboard">← Dashboard</Link>
          <form action={signOut}><button className="signout-button" type="submit">Sign out ↗</button></form>
        </div>
      </nav>
      <section className="requests-page">
        <div className="requests-page-top">
          <div><div className="auth-kicker"><span className="live-dot" /> YOUR RELAY LIFE</div><h1>Your <span>requests.</span></h1><p>Keep track of the things you need to get done.</p></div>
          <Link className="button button-primary" href="/dashboard/requests/new">Create a request <span>↗</span></Link>
        </div>
        {params.created === "1" ? <div className="request-success">✓ Your request has been published and saved to your account.</div> : null}
        {requestsError ? <div className="auth-alert">We couldn't load your requests. Please refresh the page.</div> : null}
        {!requestsError && (!requests || requests.length === 0) ? (
          <div className="requests-empty"><span>✳</span><h2>Your next move starts here.</h2><p>When you publish a request, it will appear here so you can follow its progress.</p><Link className="button button-primary" href="/dashboard/requests/new">Create your first request <span>↗</span></Link></div>
        ) : null}
        <div className="requests-list">
          {(requests ?? []).map((request) => (
            <article className="request-list-card" key={request.id}>
              <div className="request-list-main"><span className="dashboard-label">{(request.category || "GENERAL").replaceAll("_", " ").toUpperCase()}</span><h2>{request.title}</h2><p>{request.description || "No extra details provided."}</p><small>{request.location_label || "Location not set"} · {new Date(request.created_at).toLocaleDateString()}</small></div>
              <div className="request-list-meta"><span className="request-list-status">{request.status.replaceAll("_", " ")}</span><strong>{formatBudget(request.budget_amount_minor, request.currency)}</strong></div>
            </article>
          ))}
        </div>
      </section>
      <footer className="dashboard-footer"><span>RELAY · MAKE IT HAPPEN</span><span>Only you can see your requests at this stage.</span></footer>
    </main>
  );
}
