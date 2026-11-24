import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { generateRequestExecutionPlan, approveRequestExecutionPlan } from "@/app/actions/ai-planner";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ generated?: string; approved?: string; error?: string }>;
};
type PlanStep = { title: string; description: string; owner: "customer" | "provider" | "both"; requiresApproval: boolean };

export default async function RequestPlanPage({ params, searchParams }: Props) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims?.claims?.sub) redirect("/login");
  const userId = String(claims.claims.sub);
  const query = await searchParams;

  const { data: request } = await supabase.from("requests")
    .select("id,title,description,category,status,desired_at,budget_amount_minor,currency,location_label")
    .eq("id", id).eq("created_by", userId).maybeSingle();
  if (!request) notFound();

  const { data: plan } = await supabase.from("request_execution_plans")
    .select("id,title,summary,source,status,steps,provider_needs,risks,budget_guidance,timeline_guidance,approved_at,updated_at")
    .eq("request_id", id).eq("created_by", userId).maybeSingle();

  const { data: providers } = request.category
    ? await supabase.from("provider_profiles")
        .select("user_id,headline,years_experience,verification_status,service_area_label")
        .contains("service_categories", [request.category])
        .eq("accepting_work", true).limit(4)
    : { data: [] as { user_id: string; headline: string | null; years_experience: number | null; verification_status: string; service_area_label: string | null }[] };
  const providerIds = (providers ?? []).map((provider) => provider.user_id);
  const { data: profiles } = providerIds.length
    ? await supabase.from("profiles").select("id,display_name").in("id", providerIds)
    : { data: [] as { id: string; display_name: string }[] };
  const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const steps = (Array.isArray(plan?.steps) ? plan.steps : []) as PlanStep[];
  const providerNeeds = Array.isArray(plan?.provider_needs) ? plan.provider_needs.filter((item): item is string => typeof item === "string") : [];
  const risks = Array.isArray(plan?.risks) ? plan.risks.filter((item): item is string => typeof item === "string") : [];

  return <main className="dashboard-shell">
    <nav className="nav dashboard-nav">
      <Link className="brand" href="/"><span className="brand-mark">R</span><span>RELAY<span className="brand-period">.</span></span></Link>
      <div className="trust-nav-actions"><Link className="signout-button trust-back-link" href="/dashboard/requests">← My requests</Link><form action={signOut}><button className="signout-button" type="submit">Sign out ↗</button></form></div>
    </nav>
    <section className="ai-plan-page">
      <div className="auth-kicker"><span className="live-dot" /> RELAY INTELLIGENCE · EXECUTION PLANNER</div>
      <div className="ai-plan-hero">
        <div><span className="dashboard-label">YOUR REQUEST</span><h1>{request.title}</h1><p>{request.description}</p><div className="ai-plan-meta"><span>{(request.category || "general").replaceAll("_"," ")}</span><span>{request.location_label || "Location to be confirmed"}</span><span>{request.desired_at ? `Target: ${new Date(request.desired_at).toLocaleString(undefined,{dateStyle:"medium",timeStyle:"short"})}` : "Flexible timing"}</span></div></div>
        <div className="ai-plan-orb"><span>✳</span><strong>RELAY</strong><small>THINK · PLAN · DO</small></div>
      </div>
      {query.error === "save" ? <div className="auth-alert">We couldn't save the plan. Please try generating it again.</div> : null}
      {query.error === "approve" ? <div className="auth-alert">We couldn't approve this plan. Refresh and try again.</div> : null}
      {query.generated === "1" ? <div className="request-success">✓ Your execution plan is ready. Review every step before approving it.</div> : null}
      {query.approved === "1" ? <div className="request-success">✓ Plan approved. No provider has been hired and no payment has been made.</div> : null}

      {!plan ? <div className="ai-plan-empty"><div className="ai-plan-empty-icon">✳</div><h2>Let's turn this into a plan.</h2><p>RELAY will break your request into clear steps, identify the kind of provider you need, and flag decisions that should stay in your hands.</p><form action={generateRequestExecutionPlan}><input type="hidden" name="request_id" value={request.id}/><button className="auth-submit" type="submit">Build my execution plan <span>✳</span></button></form><small>Generating a plan does not publish your request or contact providers.</small></div> : <>
        <div className="ai-plan-toolbar"><div><span className="dashboard-label">YOUR EXECUTION BLUEPRINT · {plan.source === "ai_gateway" ? "AI-ASSISTED" : "SMART STARTER PLAN"}</span><h2>{plan.title}</h2><p>{plan.summary}</p>{plan.source !== "ai_gateway" ? <small className="ai-plan-muted">The AI model connection is not configured yet, so RELAY prepared a structured starter plan.</small> : null}</div><span className={plan.status === "approved" ? "ai-plan-status approved" : "ai-plan-status"}>{plan.status === "approved" ? "✓ APPROVED PLAN" : "DRAFT · REVIEW NEEDED"}</span></div>
        <div className="ai-plan-grid">
          <section className="ai-plan-card ai-plan-steps"><div className="ai-plan-section-head"><span>01</span><h3>What happens next</h3></div>
            <ol>{steps.map((step,index)=><li key={index}><span className="ai-step-number">{String(index+1).padStart(2,"0")}</span><div><h4>{step.title}</h4><p>{step.description}</p><div className="ai-step-tags"><span>{step.owner === "customer" ? "YOU" : step.owner === "provider" ? "PROVIDER" : "YOU + PROVIDER"}</span>{step.requiresApproval ? <span className="approval-tag">YOUR APPROVAL REQUIRED</span> : null}</div></div></li>)}</ol>
          </section>
          <aside className="ai-plan-side">
            <section className="ai-plan-card"><div className="ai-plan-section-head"><span>02</span><h3>Provider skills needed</h3></div><ul className="ai-plan-bullets">{providerNeeds.map((need,index)=><li key={index}>{need}</li>)}</ul>
              <div className="ai-provider-match"><strong>{providers?.length ?? 0}</strong><span>available provider profile{(providers?.length ?? 0) === 1 ? "" : "s"} currently match this category</span></div>
              {providers?.length ? <div className="ai-provider-list">{providers.map((provider)=><div key={provider.user_id}><div><strong>{profileMap.get(provider.user_id)?.display_name || "RELAY provider"}</strong><small>{provider.headline || `${provider.years_experience ?? 0} years of experience`}</small></div>{provider.verification_status === "verified" ? <span className="network-verified">✓ VERIFIED</span> : <span className="ai-unverified">PROFILE</span>}</div>)}</div> : <p className="ai-plan-muted">No matching profiles are currently visible. You can still publish the request when you're ready.</p>}
            </section>
            <section className="ai-plan-card"><div className="ai-plan-section-head"><span>03</span><h3>Things to watch</h3></div><ul className="ai-plan-bullets risk">{risks.map((risk,index)=><li key={index}>{risk}</li>)}</ul></section>
          </aside>
        </div>
        <div className="ai-plan-guidance-grid"><section className="ai-plan-guidance"><span className="dashboard-label">BUDGET GUIDANCE</span><p>{plan.budget_guidance}</p></section><section className="ai-plan-guidance"><span className="dashboard-label">TIMING GUIDANCE</span><p>{plan.timeline_guidance}</p></section></div>
        <div className="ai-plan-footer"><div><strong>{plan.status === "approved" ? "Your plan is approved." : "Ready to approve this plan?"}</strong><p>Approval only confirms this plan. Choosing a provider, accepting a quote, scheduling paid work and making payments remain separate decisions.</p></div>
          <div className="ai-plan-actions">{plan.status === "draft" ? <form action={approveRequestExecutionPlan}><input type="hidden" name="request_id" value={request.id}/><button className="auth-submit" type="submit">Approve plan <span>✓</span></button></form> : null}<form action={generateRequestExecutionPlan}><input type="hidden" name="request_id" value={request.id}/><button className="listing-toggle" type="submit">Regenerate plan ↻</button></form></div>
        </div>
      </>}
      <div className="ai-plan-back"><Link href="/dashboard/requests">← Back to all requests</Link><Link href="/dashboard/requests/new">Create another request ↗</Link></div>
    </section>
    <footer className="dashboard-footer"><span>RELAY · MAKE IT HAPPEN</span><span>You stay in control of every commitment.</span></footer>
  </main>;
}
