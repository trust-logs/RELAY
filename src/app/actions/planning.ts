"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const uuid = /^[0-9a-f-]{36}$/i;
export type PlanStep = { id: string; kind: "task" | "milestone"; title: string; description: string };

async function signedIn() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || !userId) redirect("/login");
  return { supabase, userId: String(userId) };
}
function path(id: string) { return `/dashboard/projects/${id}`; }

function makePlan(title: string, description: string, category: string | null): PlanStep[] {
  const key = (category ?? "").toLowerCase();
  let steps: Omit<PlanStep, "id">[];
  if (key === "errands" || /pickup|pick up|deliver|delivery|collect|package/i.test(title + " " + description)) {
    steps = [
      {kind:"task",title:"Confirm pickup and delivery details",description:"Confirm the item, collection contact, destination, access instructions and any handling requirements with the customer."},
      {kind:"task",title:"Coordinate the collection",description:"Agree the collection window with the provider and confirm the item is ready before travelling."},
      {kind:"task",title:"Complete the pickup and delivery",description:"Collect the correct item, follow the agreed instructions and keep the customer informed if anything changes."},
      {kind:"task",title:"Share completion evidence",description:"Provide an appropriate handover confirmation or proof of delivery without exposing private information."},
      {kind:"milestone",title:"Details and timing confirmed",description:"Customer and provider agree on the item, contacts, route and schedule."},
      {kind:"milestone",title:"Item collected",description:"The provider confirms collection and reports any issue immediately."},
      {kind:"milestone",title:"Delivery completed",description:"The customer receives the item and confirms the agreed outcome."},
    ];
  } else if (key === "home" || /repair|clean|install|maintenance|home/i.test(title + " " + description)) {
    steps = [
      {kind:"task",title:"Confirm scope and access",description:"Clarify the work area, expected result, access arrangements and any safety or material requirements."},
      {kind:"task",title:"Agree materials and preparation",description:"Confirm who supplies materials and obtain customer approval for any additional cost before purchase."},
      {kind:"task",title:"Carry out the agreed work",description:"Complete the approved work and communicate any unexpected issue before changing scope."},
      {kind:"task",title:"Inspect and document the result",description:"Review the finished work with the customer and attach relevant completion evidence."},
      {kind:"milestone",title:"Scope approved",description:"The customer and provider agree what is included and what is excluded."},
      {kind:"milestone",title:"Work completed",description:"The agreed service has been carried out."},
      {kind:"milestone",title:"Customer handover",description:"The customer reviews the result and records any follow-up."},
    ];
  } else if (["office","field","property"].includes(key)) {
    steps = [
      {kind:"task",title:"Confirm objectives and access",description:"Agree the purpose, site or work location, contacts, access permission and required outputs."},
      {kind:"task",title:"Prepare the visit or work session",description:"Confirm the schedule, equipment, checklist and any approvals needed before starting."},
      {kind:"task",title:"Carry out the field work",description:"Complete the agreed inspection or operational activity and record relevant observations."},
      {kind:"task",title:"Prepare and submit the report",description:"Organise findings and supporting evidence into the agreed deliverable."},
      {kind:"milestone",title:"Brief and access confirmed",description:"The scope, responsible contacts and access arrangements are confirmed."},
      {kind:"milestone",title:"Field activity completed",description:"The planned on-site activity has been completed."},
      {kind:"milestone",title:"Deliverable submitted",description:"The report or agreed output is ready for customer review."},
    ];
  } else {
    steps = [
      {kind:"task",title:"Clarify the desired outcome",description:"Turn the request into a clear result, confirm what is included and identify any unanswered questions."},
      {kind:"task",title:"Prepare the execution details",description:"Confirm responsibilities, required resources, access and timing before work begins."},
      {kind:"task",title:"Complete the agreed work",description:"Carry out the approved scope and keep the customer updated on progress or blockers."},
      {kind:"task",title:"Review and hand over the result",description:"Check the outcome against the request and share relevant completion evidence."},
      {kind:"milestone",title:"Scope agreed",description:"The customer and provider have a shared understanding of the result."},
      {kind:"milestone",title:"Execution completed",description:"The agreed work has been carried out."},
      {kind:"milestone",title:"Outcome confirmed",description:"The customer reviews the result and confirms the handover."},
    ];
  }
  return steps.map((step,index)=>({...step,id:`step-${index+1}`}));
}

export async function generateProjectPlan(formData: FormData) {
  const {supabase,userId}=await signedIn();
  const projectId=String(formData.get("project_id")??"");
  if(!uuid.test(projectId)) redirect("/dashboard/projects");
  const {data:project}=await supabase.from("projects").select("id,title,description,created_by,request_id").eq("id",projectId).maybeSingle();
  if(!project || project.created_by!==userId) redirect("/dashboard/projects");
  const {data:existing}=await supabase.from("request_plans").select("id,status").eq("project_id",projectId).maybeSingle();
  if(existing?.status==="approved") redirect(path(projectId));
  let category:string|null=null;
  if(project.request_id){
    const {data:request}=await supabase.from("requests").select("category").eq("id",project.request_id).maybeSingle();
    category=request?.category ?? null;
  }
  const steps=makePlan(project.title,project.description,category);
  const payload={project_id:projectId,created_by:userId,title:`Execution plan: ${project.title}`,summary:"A practical starting sequence based on the request details. Review the steps and adjust them before approval.",source:"rules",status:"draft",steps,updated_at:new Date().toISOString()};
  const {error}=existing
    ? await supabase.from("request_plans").update(payload).eq("id",existing.id).eq("status","draft")
    : await supabase.from("request_plans").insert(payload);
  if(error) redirect(`${path(projectId)}?plan_error=generate`);
  revalidatePath(path(projectId));
  redirect(`${path(projectId)}?plan=generated`);
}

export async function saveProjectPlan(formData: FormData) {
  const {supabase,userId}=await signedIn();
  const projectId=String(formData.get("project_id")??"");
  const planId=String(formData.get("plan_id")??"");
  const title=String(formData.get("title")??"").trim();
  const summary=String(formData.get("summary")??"").trim();
  let steps:PlanStep[];
  try { steps=JSON.parse(String(formData.get("steps")??"[]")) as PlanStep[]; } catch { redirect(path(projectId)); }
  if(!uuid.test(projectId)||!uuid.test(planId)||title.length<2||title.length>180||summary.length>2000||steps.length<2||steps.length>20) redirect(path(projectId));
  const valid=steps.every(s=>s && (s.kind==="task"||s.kind==="milestone") && typeof s.title==="string" && s.title.trim().length>=2 && s.title.length<=180 && typeof s.description==="string" && s.description.length<=2000);
  if(!valid||!steps.some(s=>s.kind==="task")||!steps.some(s=>s.kind==="milestone")) redirect(`${path(projectId)}?plan_error=invalid`);
  const {data:project}=await supabase.from("projects").select("id,created_by").eq("id",projectId).maybeSingle();
  if(!project||project.created_by!==userId) redirect("/dashboard/projects");
  const {error}=await supabase.from("request_plans").update({title,summary,steps,updated_at:new Date().toISOString()}).eq("id",planId).eq("project_id",projectId).eq("created_by",userId).eq("status","draft");
  if(error) redirect(`${path(projectId)}?plan_error=save`);
  revalidatePath(path(projectId));
  redirect(`${path(projectId)}?plan=saved`);
}

export async function approveProjectPlan(formData: FormData) {
  const {supabase,userId}=await signedIn();
  const projectId=String(formData.get("project_id")??"");
  const planId=String(formData.get("plan_id")??"");
  if(!uuid.test(projectId)||!uuid.test(planId)) redirect("/dashboard/projects");
  const {data:project}=await supabase.from("projects").select("id,created_by").eq("id",projectId).maybeSingle();
  if(!project||project.created_by!==userId) redirect("/dashboard/projects");
  const {error}=await supabase.rpc("approve_request_plan",{p_plan_id:planId});
  if(error) redirect(`${path(projectId)}?plan_error=approve`);
  revalidatePath(path(projectId));
  redirect(`${path(projectId)}?plan=approved`);
}
