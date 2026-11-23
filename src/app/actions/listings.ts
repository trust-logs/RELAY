"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const categories = new Set(["errands", "home", "office", "property", "field", "professional", "other"]);

export async function createServiceListing(formData: FormData) {
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims?.claims?.sub) redirect("/login");
  const userId = String(claims.claims.sub);

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const pricingModel = String(formData.get("pricing_model") ?? "quote");
  const currency = String(formData.get("currency") ?? "NGN").trim().toUpperCase();
  const priceRaw = String(formData.get("price") ?? "").trim();

  if (title.length < 5 || title.length > 120 || description.length < 30 ||
      description.length > 2000 || !categories.has(category) ||
      !["fixed", "hourly", "quote"].includes(pricingModel) ||
      !/^[A-Z]{3}$/.test(currency)) {
    redirect("/dashboard/provider/listings/new?error=details");
  }

  let priceAmountMinor: number | null = null;
  if (pricingModel !== "quote") {
    const amount = Number(priceRaw);
    if (!Number.isFinite(amount) || amount <= 0) redirect("/dashboard/provider/listings/new?error=price");
    try {
      const digits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits;
      priceAmountMinor = Math.round(amount * (10 ** digits));
    } catch {
      redirect("/dashboard/provider/listings/new?error=currency");
    }
  }

  const { data: provider } = await supabase
    .from("provider_profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!provider) redirect("/dashboard/provider?error=setup");

  const { error } = await supabase.from("service_listings").insert({
    provider_user_id: userId,
    title,
    description,
    category,
    pricing_model: pricingModel,
    price_amount_minor: priceAmountMinor,
    currency,
  });
  if (error) redirect("/dashboard/provider/listings/new?error=save");

  revalidatePath("/dashboard/network");
  revalidatePath("/dashboard/provider/listings");
  redirect("/dashboard/provider/listings?created=1");
}

export async function updateListingStatus(formData: FormData) {
  const supabase = await createClient();
  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims?.claims?.sub) redirect("/login");
  const userId = String(claims.claims.sub);
  const listingId = String(formData.get("listing_id") ?? "");
  const isActive = String(formData.get("is_active") ?? "") === "true";
  if (!/^[0-9a-f-]{36}$/i.test(listingId)) redirect("/dashboard/provider/listings");

  const { error } = await supabase.from("service_listings")
    .update({ is_active: isActive })
    .eq("id", listingId)
    .eq("provider_user_id", userId);
  if (error) redirect("/dashboard/provider/listings?error=save");
  revalidatePath("/dashboard/network");
  revalidatePath("/dashboard/provider/listings");
  redirect("/dashboard/provider/listings?saved=1");
}
