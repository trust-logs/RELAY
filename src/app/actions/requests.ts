"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function createRequest(formData: FormData) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) redirect("/login");

  const createdBy = String(claimsData.claims.sub);
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "").trim();
  const locationLabel = String(formData.get("location_label") ?? "").trim();
  const budgetRaw = String(formData.get("budget") ?? "").trim();
  const currencyRaw = String(formData.get("currency") ?? "NGN").trim().toUpperCase();
  const desiredAtRaw = String(formData.get("desired_at") ?? "").trim();
  const allowedCategories = new Set(["", "errands", "home", "office", "property", "field", "professional", "other"]);
  const desiredAt = desiredAtRaw ? new Date(desiredAtRaw) : null;

  if (title.length < 3 || title.length > 160 || description.length < 10 || description.length > 5000 ||
      locationLabel.length > 240 || !allowedCategories.has(category) ||
      (desiredAtRaw && (!desiredAt || Number.isNaN(desiredAt.getTime()) || desiredAt.getTime() <= Date.now() || desiredAt.getTime() > Date.now() + 2 * 365 * 24 * 60 * 60 * 1000))) {
    redirect("/dashboard/requests/new?error=invalid");
  }

  let budgetAmountMinor: number | null = null;
  let currency: string | null = null;

  if (budgetRaw) {
    const amount = Number(budgetRaw);
    if (!Number.isFinite(amount) || amount < 0 || !/^[A-Z]{3}$/.test(currencyRaw)) {
      redirect("/dashboard/requests/new?error=budget");
    }

    try {
      const resolvedFractionDigits = new Intl.NumberFormat("en", {
        style: "currency",
        currency: currencyRaw,
      }).resolvedOptions().maximumFractionDigits;
      const fractionDigits: number = typeof resolvedFractionDigits === "number" ? resolvedFractionDigits : 2;
      const multiplier = 10 ** fractionDigits;
      budgetAmountMinor = Math.round(amount * multiplier);
      currency = currencyRaw;
    } catch {
      redirect("/dashboard/requests/new?error=currency");
    }
  }

  const { error } = await supabase.from("requests").insert({
    created_by: createdBy,
    title,
    description,
    category: category || null,
    location_label: locationLabel || null,
    budget_amount_minor: budgetAmountMinor,
    currency,
    desired_at: desiredAt?.toISOString() ?? null,
    status: "open",
  });

  if (error) redirect("/dashboard/requests/new?error=save");

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/requests");
  redirect("/dashboard/requests?created=1");
}
