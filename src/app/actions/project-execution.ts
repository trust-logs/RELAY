"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const uuid = /^[0-9a-f-]{36}$/i;
const taskStatuses = ["todo", "in_progress", "blocked", "completed", "cancelled"] as const;
const milestoneStatuses = ["pending", "in_progress", "completed"] as const;

async function signedIn() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) redirect("/login");
  return { supabase, userId: String(userId) };
}
function projectPath(id: string) { return `/dashboard/projects/${id}`; }

export async function createProjectTask(formData: FormData) {
  const { supabase, userId } = await signedIn();
  const projectId = String(formData.get("project_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const assignedToRaw = String(formData.get("assigned_to") ?? "").trim();
  const dueRaw = String(formData.get("due_at") ?? "").trim();
  if (!uuid.test(projectId) || title.length < 2 || title.length > 180 || description.length > 2000) redirect("/dashboard/projects");
  const { data: project } = await supabase.from("projects").select("id,created_by").eq("id", projectId).maybeSingle();
  if (!project || project.created_by !== userId) redirect("/dashboard/projects");
  let assignedTo: string | null = null;
  if (assignedToRaw) {
    if (!uuid.test(assignedToRaw)) redirect(projectPath(projectId));
    const { data: member } = await supabase.from("project_members").select("user_id").eq("project_id", projectId).eq("user_id", assignedToRaw).maybeSingle();
    if (!member) redirect(projectPath(projectId));
    assignedTo = assignedToRaw;
  }
  const { error } = await supabase.from("tasks").insert({
    project_id: projectId, created_by: userId, title, description,
    assigned_to: assignedTo, due_at: dueRaw ? new Date(dueRaw).toISOString() : null,
  });
  if (error) redirect(`${projectPath(projectId)}?error=task`);
  revalidatePath(projectPath(projectId));
  redirect(`${projectPath(projectId)}?task=created`);
}

export async function updateTaskStatus(formData: FormData) {
  const { supabase, userId } = await signedIn();
  const projectId = String(formData.get("project_id") ?? "");
  const taskId = String(formData.get("task_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!uuid.test(projectId) || !uuid.test(taskId) || !taskStatuses.includes(status as typeof taskStatuses[number])) redirect("/dashboard/projects");
  const { data: task } = await supabase.from("tasks").select("id,project_id,assigned_to,completed_at").eq("id", taskId).eq("project_id", projectId).maybeSingle();
  if (!task || task.assigned_to !== userId) {
    const { data: project } = await supabase.from("projects").select("created_by").eq("id", projectId).maybeSingle();
    if (!project || project.created_by !== userId) redirect(projectPath(projectId));
  }
  const { error } = await supabase.from("tasks").update({
    status, completed_at: status === "completed" ? new Date().toISOString() : null, updated_at: new Date().toISOString(),
  }).eq("id", taskId).eq("project_id", projectId);
  if (error) redirect(`${projectPath(projectId)}?error=task-update`);
  revalidatePath(projectPath(projectId));
  redirect(projectPath(projectId));
}

export async function createProjectMilestone(formData: FormData) {
  const { supabase, userId } = await signedIn();
  const projectId = String(formData.get("project_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const dueRaw = String(formData.get("due_at") ?? "").trim();
  if (!uuid.test(projectId) || title.length < 2 || title.length > 160 || description.length > 2000) redirect("/dashboard/projects");
  const { data: project } = await supabase.from("projects").select("id,created_by").eq("id", projectId).maybeSingle();
  if (!project || project.created_by !== userId) redirect(projectPath(projectId));
  const { error } = await supabase.from("project_milestones").insert({
    project_id: projectId, created_by: userId, title, description,
    due_at: dueRaw ? new Date(dueRaw).toISOString() : null,
  });
  if (error) redirect(`${projectPath(projectId)}?error=milestone`);
  revalidatePath(projectPath(projectId));
  redirect(`${projectPath(projectId)}?milestone=created`);
}

export async function updateMilestoneStatus(formData: FormData) {
  const { supabase, userId } = await signedIn();
  const projectId = String(formData.get("project_id") ?? "");
  const milestoneId = String(formData.get("milestone_id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!uuid.test(projectId) || !uuid.test(milestoneId) || !milestoneStatuses.includes(status as typeof milestoneStatuses[number])) redirect("/dashboard/projects");
  const { data: project } = await supabase.from("projects").select("created_by").eq("id", projectId).maybeSingle();
  if (!project || project.created_by !== userId) redirect(projectPath(projectId));
  const { error } = await supabase.from("project_milestones").update({
    status, completed_at: status === "completed" ? new Date().toISOString() : null, updated_at: new Date().toISOString(),
  }).eq("id", milestoneId).eq("project_id", projectId);
  if (error) redirect(`${projectPath(projectId)}?error=milestone-update`);
  revalidatePath(projectPath(projectId));
  redirect(projectPath(projectId));
}

export async function sendProjectMessage(formData: FormData) {
  const { supabase, userId } = await signedIn();
  const projectId = String(formData.get("project_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!uuid.test(projectId) || body.length < 1 || body.length > 4000) redirect("/dashboard/projects");
  const { data: project } = await supabase.from("projects").select("id").eq("id", projectId).maybeSingle();
  if (!project) redirect("/dashboard/projects");
  const { error } = await supabase.from("project_messages").insert({ project_id: projectId, sender_id: userId, body, message_type: "message" });
  if (error) redirect(`${projectPath(projectId)}?error=message`);
  revalidatePath(projectPath(projectId));
  redirect(projectPath(projectId));
}
