import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import { createProjectTask, updateTaskStatus, createProjectMilestone, updateMilestoneStatus, requestProjectSchedule, confirmProjectSchedule, declineProjectSchedule, cancelProjectSchedule } from "@/app/actions/project-execution";
import ProjectScheduleForm from "./schedule-form";
import ProjectLiveUpdates from "./project-live-updates";
import ProjectPlanBuilder from "./plan-builder";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> };
const taskLabels: Record<string,string> = { todo:"To do", in_progress:"In progress", blocked:"Blocked", awaiting_review:"Awaiting review", completed:"Approved", cancelled:"Cancelled" };
const milestoneLabels: Record<string,string> = { pending:"Pending", in_progress:"In progress", completed:"Completed" };
function money(amount: number | null, currency: string | null) {
  if (amount === null || !currency) return "Budget not set";
  try { const digits = new Intl.NumberFormat("en", {style:"currency",currency}).resolvedOptions().maximumFractionDigits ?? 2; return new Intl.NumberFormat("en",{style:"currency",currency,maximumFractionDigits:digits}).format(amount/(10**digits)); }
  catch { return `${currency} ${amount}`; }
}
export default async function ProjectDetailPage({ params, searchParams }: Props) {
  const { id } = await params;
  const query = await searchParams;
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims?.claims?.sub) redirect("/login");
  const userId = String(claims.claims.sub);
  const { data: project } = await supabase.from("projects").select("id,title,description,status,budget_amount_minor,currency,created_by,created_at,due_at,request_id").eq("id",id).maybeSingle();
  if (!project) notFound();
  const isOwner = project.created_by === userId;
  const [{data: tasks}, {data: milestones}, {data: messages}, {data: members}, {data: attachments}, {data: plan}, {data: schedule}] = await Promise.all([
    supabase.from("tasks").select("id,title,description,status,assigned_to,due_at,completed_at,created_at,blocked_reason,completion_note,completion_submitted_at").eq("project_id",id).order("sort_order").order("created_at"),
    supabase.from("project_milestones").select("id,title,description,status,due_at,completed_at,sort_order").eq("project_id",id).order("sort_order").order("created_at"),
    supabase.from("project_messages").select("id,sender_id,body,message_type,created_at").eq("project_id",id).order("created_at").limit(100),
    supabase.from("project_members").select("user_id,member_role").eq("project_id",id),
    supabase.from("project_attachments").select("id,uploaded_by,file_name,object_path,mime_type,file_size,created_at,task_id").eq("project_id",id).order("created_at",{ascending:false}),
    supabase.from("request_plans").select("id,title,summary,source,status,steps").eq("project_id",id).maybeSingle(),
    supabase.from("project_schedules").select("id,provider_user_id,starts_at,ends_at,status,requested_by").eq("project_id",id).in("status",["pending","confirmed"]).maybeSingle(),
  ]);
  const ids = [...new Set([...(members ?? []).map(m=>m.user_id),...(messages ?? []).map(m=>m.sender_id),...(attachments ?? []).map(a=>a.uploaded_by)])];
  const {data: profiles} = ids.length ? await supabase.from("profiles").select("id,display_name").in("id",ids) : {data:[]};
  const names = new Map((profiles ?? []).map(p=>[p.id,p.display_name || "RELAY member"]));
  const assignedMembers = (members ?? []).filter(m=>m.user_id !== userId);
  // Derive project health signals from the task and evidence records.
  const doneTasks = (tasks ?? []).filter(
    (task) => task.status === "completed",
  ).length;
  const blockedTasks = (tasks ?? []).filter(
    (task) => task.status === "blocked",
  );
  const reviewTasks = (tasks ?? []).filter(
    (task) => task.status === "awaiting_review",
  );
  const overdueTasks = (tasks ?? []).filter(
    (task) =>
      task.due_at &&
      new Date(task.due_at) < new Date() &&
      !["completed", "cancelled"].includes(task.status),
  );
  const missingEvidenceTasks = (tasks ?? []).filter(
    (task) =>
      task.status === "awaiting_review" &&
      !(attachments ?? []).some((attachment) => attachment.task_id === task.id),
  );
  const doneMilestones = (milestones ?? []).filter(
    (milestone) => milestone.status === "completed",
  ).length;
  return <main className="dashboard-shell">
    <nav className="nav dashboard-nav"><Link className="brand" href="/"><span className="brand-mark">R</span><span>RELAY<span className="brand-period">.</span></span></Link><div className="trust-nav-actions"><Link className="signout-button trust-back-link" href="/dashboard/projects">← Projects</Link><form action={signOut}><button className="signout-button" type="submit">Sign out ↗</button></form></div></nav>
    <section className="network-page project-workspace">
      <div className="auth-kicker"><span className="live-dot" /> RELAY · SHARED PROJECT</div>
      <div className="network-heading"><div><span className="network-category">{isOwner ? "CUSTOMER PROJECT" : "PROVIDER ASSIGNMENT"}</span><h1>{project.title}</h1><p>{project.description || "A shared space to coordinate the work and keep everyone aligned."}</p></div><div className="network-count"><strong>{project.status.replaceAll("_"," ")}</strong><span>PROJECT STATUS</span></div></div>
      {query.error ? <div className="auth-alert">That update couldn't be saved. Please check the details and try again.</div> : null}
      {query.error === "blocked-reason" ? <div className="auth-alert">Add a short reason before marking a task as blocked.</div> : null}
      {query.schedule_error ? <div className="auth-alert">That time could not be booked. Check the provider's hours or choose another time.</div> : null}
      {query.schedule === "requested" ? <div className="request-success">✓ Schedule request sent to the provider.</div> : null}
      {query.schedule === "confirmed" ? <div className="request-success">✓ Job time confirmed. RELAY has reserved this provider's slot.</div> : null}
      {query.schedule === "declined" ? <div className="request-success">Schedule request declined.</div> : null}
      {query.schedule === "cancelled" ? <div className="request-success">Appointment cancelled. The provider's time slot is released.</div> : null}
      {query.task === "created" ? <div className="request-success">✓ Task added to the project.</div> : null}
      {query.milestone === "created" ? <div className="request-success">✓ Milestone added.</div> : null}
      {query.plan === "generated" ? <div className="request-success">✓ RELAY has drafted an execution plan. Review it before approval.</div> : null}
      {query.plan === "saved" ? <div className="request-success">✓ Your plan changes have been saved.</div> : null}
      {query.plan === "approved" ? <div className="request-success">✓ Plan approved. Tasks and milestones have been added to this project.</div> : null}
      {query.plan_error ? <div className="auth-alert">The plan could not be processed. Check the plan and try again.</div> : null}
      {isOwner || plan?.status === "approved" ? <ProjectPlanBuilder projectId={id} plan={plan as any} isOwner={isOwner}/> : null}
      <div className="workspace-summary"><div><strong>{doneTasks}/{tasks?.length ?? 0}</strong><span>TASKS APPROVED</span></div><div><strong>{doneMilestones}/{milestones?.length ?? 0}</strong><span>MILESTONES HIT</span></div><div><strong>{money(project.budget_amount_minor,project.currency)}</strong><span>AGREED QUOTE</span></div></div>
      <section className="workspace-panel progress-intelligence">
        <div className="workspace-panel-heading"><div><span className="network-category">RELAY PROGRESS INTELLIGENCE</span><h2>What needs attention</h2></div><span>{blockedTasks.length+overdueTasks.length+reviewTasks.length} SIGNALS</span></div>
        <div className="progress-signal-grid"><div><strong>{blockedTasks.length}</strong><span>BLOCKED</span></div><div><strong>{overdueTasks.length}</strong><span>OVERDUE</span></div><div><strong>{reviewTasks.length}</strong><span>AWAITING REVIEW</span></div><div><strong>{missingEvidenceTasks.length}</strong><span>REVIEW WITHOUT EVIDENCE</span></div></div>
        {blockedTasks.length===0 && overdueTasks.length===0 && reviewTasks.length===0 ? <p className="workspace-empty">No urgent blockers. RELAY will highlight delays, blockers and review requests here.</p> : <div className="progress-signal-list">{[...blockedTasks.map(t=>({task:t,kind:"BLOCKED",detail:t.blocked_reason||"Reason not provided"})),...overdueTasks.map(t=>({task:t,kind:"OVERDUE",detail:`Due ${new Date(t.due_at!).toLocaleString()}`})),...reviewTasks.map(t=>({task:t,kind:"REVIEW",detail:t.completion_note||"Provider submitted work for customer review"})),...missingEvidenceTasks.map(t=>({task:t,kind:"EVIDENCE",detail:"Add a photo or document before reviewing this submission"}))].map((item)=><div key={item.task.id}><span className={`progress-signal-tag signal-${item.kind.toLowerCase()}`}>{item.kind}</span><strong>{item.task.title}</strong><small>{item.detail}</small></div>)}</div>}
      </section>
      <section className="workspace-panel project-schedule-panel">
        <div className="workspace-panel-heading"><div><span className="network-category">RELAY SMART SCHEDULING</span><h2>Job appointment</h2></div><span>{schedule?.status ? schedule.status.toUpperCase() : "NOT BOOKED"}</span></div>
        {schedule ? <>
          <p className="workspace-empty">{schedule.status === "confirmed" ? "Confirmed appointment" : "Waiting for provider confirmation"} · {new Date(schedule.starts_at).toLocaleString()} – {new Date(schedule.ends_at).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}</p>
          {schedule.status === "pending" && schedule.provider_user_id === userId ? <div className="workspace-inline-form">
            <form action={confirmProjectSchedule}><input type="hidden" name="project_id" value={id}/><input type="hidden" name="schedule_id" value={schedule.id}/><button type="submit">Confirm this time ↗</button></form>
            <form action={declineProjectSchedule}><input type="hidden" name="project_id" value={id}/><input type="hidden" name="schedule_id" value={schedule.id}/><button type="submit">Decline</button></form>
          </div> : null}
          {schedule.status === "confirmed" || (schedule.status === "pending" && isOwner) ? <form action={cancelProjectSchedule} className="workspace-inline-form"><input type="hidden" name="project_id" value={id}/><input type="hidden" name="schedule_id" value={schedule.id}/><button type="submit">Cancel appointment</button></form> : null}
        </> : isOwner ? <><p className="workspace-empty">Choose the appointment window. The provider must confirm it, and RELAY checks their working hours and existing confirmed jobs.</p><ProjectScheduleForm projectId={id} action={requestProjectSchedule}/></> : <p className="workspace-empty">The customer has not requested an appointment yet.</p>}
      </section>
      <div className="workspace-grid">
        <section className="workspace-panel">
          <div className="workspace-panel-heading"><div><span className="network-category">THE PLAN</span><h2>Tasks</h2></div><span>{tasks?.length ?? 0} ITEMS</span></div>
          {!tasks?.length ? <p className="workspace-empty">No tasks yet. Break the work into clear steps.</p> : <div className="workspace-items">{tasks.map(task=><article className="workspace-item" key={task.id}>
            <div className="workspace-item-top"><h3>{task.title}</h3><span className={`workspace-state state-${task.status}`}>{taskLabels[task.status] ?? task.status}</span></div>
            {task.description ? <p>{task.description}</p> : null}
            {task.status === "blocked" && task.blocked_reason ? <p className="task-blocked-reason">Blocker: {task.blocked_reason}</p> : null}
            {task.status === "awaiting_review" && task.completion_note ? <p className="task-review-note">Provider note: {task.completion_note}</p> : null}
            <small>{task.assigned_to ? `Assigned to ${names.get(task.assigned_to) ?? "RELAY member"}` : "Unassigned"}{task.due_at ? ` · Due ${new Date(task.due_at).toLocaleDateString()}` : ""}</small>
            {(isOwner || task.assigned_to === userId) && task.status !== "completed" && task.status !== "cancelled" ? <form action={updateTaskStatus} className="workspace-inline-form"><input type="hidden" name="project_id" value={id}/><input type="hidden" name="task_id" value={task.id}/><select name="status" defaultValue={task.status}><option value="todo">To do</option><option value="in_progress">In progress</option><option value="blocked">Blocked</option>{!isOwner ? <option value="awaiting_review">Submit for customer review</option> : <option value="completed">Approve completion</option>}</select><input name="blocked_reason" placeholder="If blocked: explain what is stopping progress" maxLength={500}/>{!isOwner ? <input name="completion_note" placeholder="Completion note for customer (optional)" maxLength={1000}/> : null}<button type="submit">{isOwner && task.status==="awaiting_review" ? "Review update ↗" : "Update"}</button></form> : null}
          </article>)}</div>}
          {isOwner ? <details className="workspace-composer"><summary>＋ Add a task</summary><form action={createProjectTask}>
            <input type="hidden" name="project_id" value={id}/><label>Task title<input name="title" required minLength={2} maxLength={180} placeholder="e.g. Pick up the materials"/></label>
            <label>Details<textarea name="description" rows={3} maxLength={2000} placeholder="What needs to happen?"/></label>
            <label>Assign to<select name="assigned_to" defaultValue=""><option value="">Leave unassigned</option>{assignedMembers.map(m=><option key={m.user_id} value={m.user_id}>{names.get(m.user_id) ?? "RELAY member"} · {m.member_role}</option>)}</select></label>
            <label>Due date<input type="datetime-local" name="due_at"/></label><button type="submit">Create task ↗</button>
          </form></details> : null}
        </section>
        <section className="workspace-panel">
          <div className="workspace-panel-heading"><div><span className="network-category">KEY CHECKPOINTS</span><h2>Milestones</h2></div><span>{milestones?.length ?? 0} CHECKPOINTS</span></div>
          {!milestones?.length ? <p className="workspace-empty">Add milestones to make important stages visible.</p> : <div className="workspace-items">{milestones.map(m=><article className="workspace-item" key={m.id}>
            <div className="workspace-item-top"><h3>{m.title}</h3><span className={`workspace-state state-${m.status}`}>{milestoneLabels[m.status] ?? m.status}</span></div>{m.description ? <p>{m.description}</p> : null}
            {m.due_at ? <small>Due {new Date(m.due_at).toLocaleDateString()}</small> : null}
            {isOwner && m.status !== "completed" ? <form action={updateMilestoneStatus} className="workspace-inline-form"><input type="hidden" name="project_id" value={id}/><input type="hidden" name="milestone_id" value={m.id}/><select name="status" defaultValue={m.status}><option value="pending">Pending</option><option value="in_progress">In progress</option><option value="completed">Completed</option></select><button type="submit">Update</button></form> : null}
          </article>)}</div>}
          {isOwner ? <details className="workspace-composer"><summary>＋ Add a milestone</summary><form action={createProjectMilestone}>
            <input type="hidden" name="project_id" value={id}/><label>Milestone<input name="title" required minLength={2} maxLength={160} placeholder="e.g. First delivery completed"/></label>
            <label>Details<textarea name="description" rows={2} maxLength={2000}/></label><label>Target date<input type="datetime-local" name="due_at"/></label><button type="submit">Add milestone ↗</button>
          </form></details> : null}
        </section>
      </div>
      <ProjectLiveUpdates projectId={id} userId={userId} initialMessages={messages ?? []} initialAttachments={attachments ?? []} taskOptions={(tasks ?? []).map(t=>({id:t.id,title:t.title}))} names={Object.fromEntries(names)} />
    </section>
    <footer className="dashboard-footer"><span>RELAY · MAKE IT HAPPEN</span><span>Make it happen, together.</span></footer>
  </main>;
}
