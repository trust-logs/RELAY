import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";

function formatBudget(amount: number | null, currency: string | null) {
  if (amount === null || !currency) return "Budget not set";
  try {
    const digits = new Intl.NumberFormat("en", { style:"currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
    return new Intl.NumberFormat("en", { style:"currency", currency, maximumFractionDigits:digits }).format(amount / (10 ** digits));
  } catch { return `${currency} ${amount}`; }
}

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims?.claims?.sub) redirect("/login");
  const userId = String(claims.claims.sub);
  const params = await searchParams;
  const { data: projects, error: projectError } = await supabase.from("projects")
    .select("id,title,description,status,budget_amount_minor,currency,request_id,created_by,created_at")
    .order("created_at", { ascending:false });
  const projectIds = (projects ?? []).map((p) => p.id);
  const { data: members } = projectIds.length ? await supabase.from("project_members")
    .select("project_id,user_id,member_role").in("project_id",projectIds) : { data: [] };
  const memberIds = [...new Set((members ?? []).map((m) => m.user_id))];
  const { data: profiles } = memberIds.length ? await supabase.from("profiles")
    .select("id,display_name").in("id",memberIds) : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id,p]));

  return <main className="dashboard-shell">
    <nav className="nav dashboard-nav"><Link className="brand" href="/"><span className="brand-mark">R</span><span>RELAY<span className="brand-period">.</span></span></Link><div className="trust-nav-actions"><Link className="signout-button trust-back-link" href="/dashboard">← Dashboard</Link><form action={signOut}><button className="signout-button" type="submit">Sign out ↗</button></form></div></nav>
    <section className="network-page">
      <div className="auth-kicker"><span className="live-dot" /> RELAY · PROJECT WORKSPACE</div>
      <div className="network-heading"><div><h1>Work in<br /><span>motion.</span></h1><p>Projects created when a customer chooses a provider. Your commitments start here.</p></div><div className="network-count"><strong>{projects?.length ?? 0}</strong><span>YOUR PROJECTS</span></div></div>
      {params.created === "1" ? <div className="request-success">✓ Proposal accepted. Your RELAY project has been created.</div> : null}
      {projectError ? <div className="auth-alert">We couldn't load your projects. Please refresh the page.</div> : null}
      {!projectError && !projects?.length ? <div className="network-empty"><span>✳</span><h2>Nothing in motion yet.</h2><p>When a proposal is accepted, RELAY creates a shared project workspace for the customer and provider.</p><Link href="/dashboard/requests">VIEW YOUR REQUESTS ↗</Link></div> :
      <div className="project-list-stack">{(projects ?? []).map((project) => {
        const projectMembers = (members ?? []).filter((m) => m.project_id === project.id);
        const otherMembers = projectMembers.filter((m) => m.user_id !== userId);
        const isOwner = project.created_by === userId;
        return <article className="project-list-card" key={project.id}>
          <div className="project-list-top"><span className="network-category">{isOwner ? "CUSTOMER PROJECT" : "PROVIDER ASSIGNMENT"}</span><span className="project-status-pill">{project.status.replaceAll("_"," ")}</span></div>
          <h2><Link href={`/dashboard/projects/${project.id}`}>{project.title} ↗</Link></h2><p>{project.description}</p>
          <div className="project-list-bottom"><strong>{formatBudget(project.budget_amount_minor,project.currency)}</strong><span>{isOwner ? "Provider: " : "Customer: "}{otherMembers.map((m) => profileMap.get(m.user_id)?.display_name || "RELAY member").join(", ") || "Assigned RELAY member"}</span></div>
          <small>Created {new Date(project.created_at).toLocaleDateString()} · <Link href={`/dashboard/projects/${project.id}`}>OPEN WORKSPACE ↗</Link></small>
        </article>;
      })}</div>}
    </section><footer className="dashboard-footer"><span>RELAY · MAKE IT HAPPEN</span><span>Make it happen, together.</span></footer>
  </main>;
}
