"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildExecutionPlan } from "@/lib/ai/request-planner";

const validId = (value: string) => /^[0-9a-f-]{36}$/i.test(value);

export async function generateRequestExecutionPlan(formData: FormData) {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims?.claims?.sub) redirect("/login");
  const userId = String(claims.claims.sub);
  const requestId = String(formData.get("request_id") ?? "");
  if (!validId(requestId)) redirect("/dashboard/requests");

  const { data: request, error: requestError } = await supabase.from("requests")
    .select("id,title,description,category,desired_at,created_by")
    .eq("id", requestId).eq("created_by", userId).maybeSingle();
  if (requestError || !request) redirect("/dashboard/requests");

  const { plan, source } = await buildExecutionPlan({
    title: request.title,
    description: request.description,
    category: request.category,
    desiredAt: request.desired_at,
  });

  const { error: saveError } = await supabase.from("request_execution_plans").upsert({
    request_id: request.id,
    created_by: userId,
    title: plan.title,
    summary: plan.summary,
    source,
    status: "draft",
    steps: plan.steps,
    provider_needs: plan.providerNeeds,
    risks: plan.risks,
    budget_guidance: plan.budgetGuidance,
    timeline_guidance: plan.timelineGuidance,
    approved_at: null,
    updated_at: new Date().toISOString(),
  }, { onConflict: "request_id" });

  if (saveError) redirect(`/dashboard/requests/${requestId}/plan?error=save`);
  revalidatePath(`/dashboard/requests/${requestId}/plan`);
  redirect(`/dashboard/requests/${requestId}/plan?generated=1`);
}

export async function approveRequestExecutionPlan(formData: FormData) {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims?.claims?.sub) redirect("/login");
  const userId = String(claims.claims.sub);
  const requestId = String(formData.get("request_id") ?? "");
  if (!validId(requestId)) redirect("/dashboard/requests");

  const { data, error: updateError } = await supabase.from("request_execution_plans")
    .update({ status: "approved", approved_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("request_id", requestId).eq("created_by", userId).eq("status", "draft")
    .select("id").maybeSingle();

  if (updateError || !data) redirect(`/dashboard/requests/${requestId}/plan?error=approve`);
  revalidatePath(`/dashboard/requests/${requestId}/plan`);
  redirect(`/dashboard/requests/${requestId}/plan?approved=1`);
}
