"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signUp(formData: FormData) {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (displayName.length < 2 || displayName.length > 80 || !email || password.length < 8) {
    redirect("/signup?error=invalid");
  }

  const origin = (await headers()).get("origin");
  if (!origin) redirect("/signup?error=configuration");

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    // Keep provider details out of the URL and show a safe, useful message.
    redirect(`/signup?error=${error.status === 429 ? "rate" : "signup"}`);
  }

  if (!data.session) {
    redirect(`/check-email?email=${encodeURIComponent(email)}`);
  }

  redirect("/dashboard");
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) redirect("/login?error=invalid");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(`/login?error=${error.status === 429 ? "rate" : "credentials"}`);
  }

  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
