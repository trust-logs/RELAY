"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function validId(value: string) {
  return /^[0-9a-f-]{36}$/i.test(value);
}

function toMinorUnits(amount: number, currency: string) {
  const digits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits ?? 2;
  return Math.round(amount * (10 ** digits));
}

export async function publishRequest(formData: FormData) {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims?.claims?.sub) redirect("/login");
  const userId = String(claims.claims.sub);
  const requestId = String(formData.get("request_id") ?? "");
  if (!validId(requestId)) redirect("/dashboard/requests");

  const { data: request } = await supabase.from("requests")
    .select("id,title,description,category,status,budget_amount_minor,currency,desired_at")
    .eq("id", requestId).eq("created_by", userId).maybeSingle();
  if (!request || request.status !== "open") redirect("/dashboard/requests?error=publish");

  const { error: publishError } = await supabase.from("request_publications").insert({
    request_id: request.id,
    title: request.title,
    description: request.description,
    category: request.category,
    budget_amount_minor: request.budget_amount_minor,
    currency: request.currency,
  });
  if (publishError) redirect("/dashboard/requests?error=publish");

  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard/provider/requests");
  redirect("/dashboard/requests?published=1");
}

export async function unpublishRequest(formData: FormData) {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims?.claims?.sub) redirect("/login");
  const requestId = String(formData.get("request_id") ?? "");
  if (!validId(requestId)) redirect("/dashboard/requests");

  const { error: removeError } = await supabase.from("request_publications")
    .delete().eq("request_id", requestId);
  if (removeError) redirect("/dashboard/requests?error=unpublish");

  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard/provider/requests");
  redirect("/dashboard/requests?unpublished=1");
}

export async function submitProposal(formData: FormData) {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims?.claims?.sub) redirect("/login");
  const userId = String(claims.claims.sub);
  const requestId = String(formData.get("request_id") ?? "");
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const currency = String(formData.get("currency") ?? "NGN").trim().toUpperCase();
  const message = String(formData.get("message") ?? "").trim();
  const duration = String(formData.get("estimated_duration") ?? "").trim();

  if (!validId(requestId) || !/^[A-Z]{3}$/.test(currency) || message.length < 20 || message.length > 2000 || duration.length > 100) {
    redirect("/dashboard/provider/requests?error=details");
  }

  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1_000_000_000) {
    redirect("/dashboard/provider/requests?error=amount");
  }

  const { data: provider } = await supabase.from("provider_profiles")
    .select("user_id,accepting_work").eq("user_id", userId).maybeSingle();
  if (!provider || !provider.accepting_work) redirect("/dashboard/provider?error=notaccepting");

  const { data: published } = await supabase.from("request_publications")
    .select("request_id,currency").eq("request_id", requestId).maybeSingle();
  if (!published) redirect("/dashboard/provider/requests?error=closed");
  if (published.currency && published.currency.trim() !== currency) redirect("/dashboard/provider/requests?error=currency");

  const { error: proposalError } = await supabase.from("proposals").insert({
    request_id: requestId,
    provider_user_id: userId,
    amount_minor: toMinorUnits(amount, currency),
    currency,
    message,
    estimated_duration: duration || null,
  });
  if (proposalError) redirect("/dashboard/provider/requests?error=duplicate");

  revalidatePath("/dashboard/provider/requests");
  revalidatePath("/dashboard/requests");
  redirect("/dashboard/provider/requests?sent=1");
}

export async function acceptProposal(formData: FormData) {
  const supabase = await createClient();
  const { data: claims, error } = await supabase.auth.getClaims();
  if (error || !claims?.claims?.sub) redirect("/login");
  const proposalId = String(formData.get("proposal_id") ?? "");
  if (!validId(proposalId)) redirect("/dashboard/requests?error=accept");

  const { data: projectId, error: acceptError } = await supabase.rpc("accept_proposal", {
    p_proposal_id: proposalId,
  });
  if (acceptError || !projectId) redirect("/dashboard/requests?error=accept");

  revalidatePath("/dashboard/requests");
  revalidatePath("/dashboard/projects");
  revalidatePath("/dashboard/provider/requests");
  redirect(`/dashboard/projects/${projectId}`);
}
