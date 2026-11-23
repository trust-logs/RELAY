import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NotificationCentre from "./notification-centre";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: claimsData, error } = await supabase.auth.getClaims();
  if (error || !claimsData?.claims?.sub) redirect("/login");

  const userId = String(claimsData.claims.sub);
  const { data } = await supabase
    .from("notifications")
    .select("id,user_id,actor_id,project_id,request_id,type,title,body,href,read_at,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(50);

  return <NotificationCentre userId={userId} initialNotifications={data ?? []} />;
}
