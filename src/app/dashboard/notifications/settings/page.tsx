import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NotificationPreferences from "./preferences";

const EVENT_TYPES = [
  "proposal_received","proposal_accepted","proposal_rejected",
  "project_message","task_updated","milestone_completed","evidence_uploaded",
  "appointment_requested","appointment_confirmed","appointment_declined","appointment_cancelled",
  "appointment_reminder","schedule_response_due","task_overdue","milestone_overdue",
] as const;

export default async function NotificationSettingsPage() {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  if (error || !claimsData?.claims?.sub) redirect("/login");
  const userId = String(claimsData.claims.sub);
  const { data } = await supabase.from("notification_preferences")
    .select("event_type,in_app_enabled,email_enabled,push_enabled")
    .eq("user_id",userId);
  const saved = new Map((data ?? []).map((item) => [item.event_type,item]));
  const preferences = EVENT_TYPES.map((event_type) => ({
    event_type,
    in_app_enabled: saved.get(event_type)?.in_app_enabled ?? true,
    email_enabled: saved.get(event_type)?.email_enabled ?? false,
    push_enabled: saved.get(event_type)?.push_enabled ?? false,
  }));
  return <NotificationPreferences userId={userId} initialPreferences={preferences} />;
}
