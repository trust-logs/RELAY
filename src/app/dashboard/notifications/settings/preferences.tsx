"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type EventType = "proposal_received" | "proposal_accepted" | "proposal_rejected" | "project_message" | "task_updated" | "milestone_completed" | "evidence_uploaded" | "appointment_requested" | "appointment_confirmed" | "appointment_declined" | "appointment_cancelled" | "appointment_reminder" | "schedule_response_due" | "task_overdue" | "milestone_overdue";
type Preference = { event_type: EventType; in_app_enabled: boolean; email_enabled: boolean; push_enabled: boolean };

const labels: Record<EventType,{title:string;description:string}> = {
  proposal_received:{title:"New proposals",description:"When a provider responds to one of your requests."},
  proposal_accepted:{title:"Proposal accepted",description:"When a customer accepts your proposal."},
  proposal_rejected:{title:"Proposal not selected",description:"When a customer chooses another proposal."},
  project_message:{title:"Project messages",description:"When another project participant sends a message."},
  task_updated:{title:"Task updates",description:"When a task is assigned or its status changes."},
  milestone_completed:{title:"Milestones completed",description:"When a project milestone is marked complete."},
  evidence_uploaded:{title:"New evidence",description:"When someone uploads a project file or proof."},
  appointment_requested:{title:"Appointment requests",description:"When a customer asks you to schedule project work."},
  appointment_confirmed:{title:"Appointment confirmed",description:"When your requested appointment is confirmed."},
  appointment_declined:{title:"Appointment declined",description:"When an appointment request is declined."},
  appointment_cancelled:{title:"Appointment cancelled",description:"When a scheduled appointment is cancelled."},
  appointment_reminder:{title:"Appointment reminders",description:"Reminders 24 hours and one hour before confirmed appointments."},
  schedule_response_due:{title:"Appointment response needed",description:"When a customer is waiting for your appointment response."},
  task_overdue:{title:"Overdue tasks",description:"When an assigned task passes its due time."},
  milestone_overdue:{title:"Overdue milestones",description:"When a project milestone passes its due date."},
};

export default function NotificationPreferences({userId,initialPreferences}:{userId:string;initialPreferences:Preference[]}) {
  const supabase=useMemo(()=>createClient(),[]);
  const [items,setItems]=useState(initialPreferences);
  const [saving,setSaving]=useState(false);
  const [notice,setNotice]=useState("");
  async function toggle(event_type:EventType) {
    const current=items.find(x=>x.event_type===event_type);
    if(!current)return;
    const next={...current,in_app_enabled:!current.in_app_enabled};
    setItems(old=>old.map(x=>x.event_type===event_type?next:x));
    setSaving(true);setNotice("");
    const {error}=await supabase.from("notification_preferences").upsert({...next,user_id:userId,updated_at:new Date().toISOString()},{onConflict:"user_id,event_type"});
    setSaving(false);
    if(error){setItems(old=>old.map(x=>x.event_type===event_type?current:x));setNotice("Could not save that change. Please try again.");}
    else setNotice("Your notification preferences have been saved.");
  }
  return <main className="dashboard-shell notification-centre">
    <nav className="nav dashboard-nav">
      <Link className="brand" href="/dashboard"><span className="brand-mark">R</span><span>RELAY<span className="brand-period">.</span></span></Link>
      <Link className="signout-button" href="/dashboard/notifications">BACK TO ACTIVITY ↗</Link>
    </nav>
    <section className="network-heading notification-heading">
      <div className="auth-kicker"><span className="live-dot"/> YOUR CONTROL ROOM</div>
      <h1>Choose what <span>reaches you.</span></h1>
      <p>Control which updates appear in your RELAY activity centre.</p>
    </section>
    <section className="preference-panel">
      <div className="preference-columns"><span>ACTIVITY TYPE</span><span>IN-APP ALERTS</span></div>
      {items.map(item=><article className="preference-row" key={item.event_type}>
        <div><h2>{labels[item.event_type].title}</h2><p>{labels[item.event_type].description}</p></div>
        <button type="button" role="switch" aria-checked={item.in_app_enabled} className={`preference-switch ${item.in_app_enabled?"is-on":""}`} onClick={()=>void toggle(item.event_type)} disabled={saving}><span/></button>
      </article>)}
      <div className="preference-coming"><strong>Email and push delivery</strong><p>These channels will appear here once RELAY’s email provider and mobile push service are connected. Your in-app alerts work now.</p></div>
      <p className="preference-notice" aria-live="polite">{notice}</p>
    </section>
    <footer className="dashboard-footer"><span>RELAY · MAKE IT HAPPEN</span><span>Your preferences apply to future activity.</span></footer>
  </main>;
}
