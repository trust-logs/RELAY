"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function getUserClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;
  if (error || typeof userId !== "string") redirect("/login");
  return { supabase, userId };
}

export async function updateProfile(formData: FormData) {
  const { supabase, userId } = await getUserClient();
  const displayName = String(formData.get("display_name") ?? "").trim();
  const bio = String(formData.get("bio") ?? "").trim();
  const countryCode = String(formData.get("country_code") ?? "").trim().toUpperCase();
  const preferredLanguage = String(formData.get("preferred_language") ?? "en").trim();

  if (displayName.length < 2 || displayName.length > 80 || bio.length > 500 ||
      (countryCode && !/^[A-Z]{2}$/.test(countryCode)) ||
      !/^[a-z]{2}(-[A-Z]{2})?$/.test(preferredLanguage)) {
    redirect("/dashboard/settings?profile=invalid");
  }

  const { error } = await supabase.from("profiles").update({
    display_name: displayName,
    bio: bio || null,
    country_code: countryCode || null,
    preferred_language: preferredLanguage,
    updated_at: new Date().toISOString(),
  }).eq("id", userId);

  if (error) redirect("/dashboard/settings?profile=error");
  redirect("/dashboard/settings?profile=saved");
}

export async function changePassword(formData: FormData) {
  const { supabase } = await getUserClient();
  const currentPassword = String(formData.get("current_password") ?? "");
  const newPassword = String(formData.get("new_password") ?? "");
  const confirmPassword = String(formData.get("confirm_password") ?? "");

  if (!currentPassword || newPassword.length < 8 || newPassword !== confirmPassword) {
    redirect("/dashboard/settings?password=invalid");
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
    current_password: currentPassword,
  });

  if (error) redirect("/dashboard/settings?password=error");
  redirect("/dashboard/settings?password=changed");
}

export async function requestEmailChange(formData: FormData) {
  const { supabase } = await getUserClient();
  const email = String(formData.get("new_email") ?? "").trim().toLowerCase();
  const origin = (await headers()).get("origin");
  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !origin) {
    redirect("/dashboard/settings?email=invalid");
  }

  const { error } = await supabase.auth.updateUser(
    { email },
    { emailRedirectTo: `${origin}/auth/callback` },
  );

  if (error) redirect("/dashboard/settings?email=error");
  redirect("/dashboard/settings?email=sent");
}

export async function signOutEverywhere() {
  const { supabase } = await getUserClient();
  await supabase.auth.signOut({ scope: "global" });
  redirect("/login? signedout=all");
}
