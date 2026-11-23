"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Notification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  project_id: string | null;
  request_id: string | null;
  type: string;
  title: string;
  body: string;
  href: string;
  read_at: string | null;
  created_at: string;
};

function timeAgo(value: string) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(value).toLocaleDateString();
}

function symbolFor(type: string) {
  if (type.startsWith("proposal")) return "↗";
  if (type === "project_message") return "✉";
  if (type === "task_updated") return "✓";
  if (type === "milestone_completed") return "✳";
  if (type === "evidence_uploaded") return "▧";
  return "•";
}

export default function NotificationCentre({
  userId,
  initialNotifications,
}: {
  userId: string;
  initialNotifications: Notification[];
}) {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState(initialNotifications);
  const [connection, setConnection] = useState<"connecting" | "live" | "offline">("connecting");
  const unreadCount = items.filter((item) => !item.read_at).length;

  useEffect(() => {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const next = payload.new as Notification;
          setItems((current) => current.some((item) => item.id === next.id) ? current : [next, ...current]);
        },
      )
      .subscribe((status) => {
        setConnection(status === "SUBSCRIBED" ? "live" : status === "CLOSED" || status === "CHANNEL_ERROR" ? "offline" : "connecting");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId]);

  async function markRead(id: string) {
    const now = new Date().toISOString();
    setItems((current) => current.map((item) => item.id === id ? { ...item, read_at: now } : item));
    const { error } = await supabase.from("notifications").update({ read_at: now }).eq("id", id).eq("user_id", userId);
    if (error) {
      setItems((current) => current.map((item) => item.id === id ? { ...item, read_at: null } : item));
    }
  }

  async function markAllRead() {
    const now = new Date().toISOString();
    const previous = items;
    setItems((current) => current.map((item) => ({ ...item, read_at: item.read_at ?? now })));
    const { error } = await supabase.from("notifications").update({ read_at: now }).eq("user_id", userId).is("read_at", null);
    if (error) setItems(previous);
  }

  return (
    <main className="dashboard-shell notification-centre">
      <nav className="nav dashboard-nav">
        <Link className="brand" href="/dashboard"><span className="brand-mark">R</span><span>RELAY<span className="brand-period">.</span></span></Link>
        <Link className="signout-button" href="/dashboard">BACK TO DASHBOARD ↗</Link>
      </nav>
      <section className="network-heading notification-heading">
        <div className="auth-kicker"><span className="live-dot" /> YOUR ACTIVITY</div>
        <h1>Stay in the <span>loop.</span></h1>
        <p>Every important update across your requests and projects, gathered in one place.</p>
        <div className="notification-toolbar">
          <span className="notification-count">{unreadCount} unread</span>
          <span className={`live-connection notification-live ${connection === "live" ? "" : "is-muted"}`}><i />{connection === "live" ? "LIVE UPDATES" : connection === "offline" ? "RECONNECTING" : "CONNECTING"}</span>
          {unreadCount > 0 && <button className="notification-mark-all" onClick={markAllRead}>MARK ALL AS READ</button>}
        </div>
      </section>
      <section className="notification-list" aria-live="polite">
        {items.length === 0 ? (
          <div className="notification-empty"><span>✳</span><h2>All quiet for now.</h2><p>When something moves in your RELAY space, you’ll see it here.</p><Link href="/dashboard">EXPLORE YOUR DASHBOARD ↗</Link></div>
        ) : items.map((item) => (
          <article className={`notification-row ${item.read_at ? "is-read" : "is-unread"}`} key={item.id}>
            <span className={`notification-symbol symbol-${item.type}`}>{symbolFor(item.type)}</span>
            <div className="notification-copy">
              <div className="notification-title-line"><h2>{item.title}</h2><time dateTime={item.created_at}>{timeAgo(item.created_at)}</time></div>
              <p>{item.body}</p>
              <div className="notification-actions">
                <Link href={item.href} onClick={() => { if (!item.read_at) void markRead(item.id); }}>OPEN UPDATE ↗</Link>
                {!item.read_at && <button onClick={() => void markRead(item.id)}>MARK AS READ</button>}
              </div>
            </div>
            {!item.read_at && <span className="notification-unread-dot" aria-label="Unread" />}
          </article>
        ))}
      </section>
      <footer className="dashboard-footer"><span>RELAY · MAKE IT HAPPEN</span><span>Only your account can see these updates.</span></footer>
    </main>
  );
}
