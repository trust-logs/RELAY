"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const allowedCategories = new Set([
  "errands", "home", "office", "property", "field", "professional", "other",
]);

export async function saveProviderProfile(formData: FormData) {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims?.sub) redirect("/login");

  const userId = String(claimsData.claims.sub);
  const providerKind = String(formData.get("provider_kind") ?? "individual");
  const acceptingWork = formData.get("accepting_work") === "true";
  const headline = String(formData.get("headline") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const serviceArea = String(formData.get("service_area_label") ?? "").trim();
  const websiteRaw = String(formData.get("website_url") ?? "").trim();
  const radiusRaw = String(formData.get("service_radius_km") ?? "").trim();
  const experienceRaw = String(formData.get("years_experience") ?? "").trim();
  const categories = formData.getAll("service_categories").map(String).filter((value) => allowedCategories.has(value));

  if (!["individual", "business"].includes(providerKind) ||
      headline.length < 5 || headline.length > 100 ||
      description.length < 30 || description.length > 2000 ||
      serviceArea.length < 2 || serviceArea.length > 180 ||
      categories.length === 0) {
    redirect("/dashboard/provider?error=details");
  }

  const radius = radiusRaw ? Number(radiusRaw) : 25;
  const experience = experienceRaw ? Number(experienceRaw) : null;
  if (!Number.isInteger(radius) || radius < 1 || radius > 500 ||
      (experience !== null && (!Number.isInteger(experience) || experience < 0 || experience > 80))) {
    redirect("/dashboard/provider?error=number");
  }

  let websiteUrl: string | null = null;
  if (websiteRaw) {
    try {
      const parsed = new URL(websiteRaw);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Invalid protocol");
      websiteUrl = parsed.toString();
    } catch {
      redirect("/dashboard/provider?error=website");
    }
  }

  const { error } = await supabase.from("provider_profiles").upsert({
    user_id: userId,
    provider_kind: providerKind,
    headline,
    description,
    service_area_label: serviceArea,
    service_radius_km: radius,
    years_experience: experience,
    website_url: websiteUrl,
    service_categories: [...new Set(categories)],
    accepting_work: acceptingWork,
  }, { onConflict: "user_id" });

  if (error) redirect("/dashboard/provider?error=save");

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/provider");
  redirect("/dashboard/provider?saved=1");
}
