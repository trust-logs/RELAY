"use client";

import type { FormEvent } from "react";

type Props = {
  projectId: string;
  action: (formData: FormData) => void | Promise<void>;
};

export default function ProjectScheduleForm({ projectId, action }: Props) {
  function prepareTimes(event: FormEvent<HTMLFormElement>) {
    const form = event.currentTarget;
    const startLocal = form.elements.namedItem("starts_at_local") as HTMLInputElement;
    const endLocal = form.elements.namedItem("ends_at_local") as HTMLInputElement;
    const startUtc = form.elements.namedItem("starts_at") as HTMLInputElement;
    const endUtc = form.elements.namedItem("ends_at") as HTMLInputElement;
    if (!startLocal.value || !endLocal.value) {
      event.preventDefault();
      return;
    }
    const start = new Date(startLocal.value);
    const end = new Date(endLocal.value);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
      event.preventDefault();
      return;
    }
    startUtc.value = start.toISOString();
    endUtc.value = end.toISOString();
  }

  return (
    <form action={action} onSubmit={prepareTimes} className="project-schedule-form">
      <input type="hidden" name="project_id" value={projectId} />
      <input type="hidden" name="starts_at" />
      <input type="hidden" name="ends_at" />
      <label>Start date and time<input type="datetime-local" name="starts_at_local" required /></label>
      <label>End date and time<input type="datetime-local" name="ends_at_local" required /></label>
      <p>Times are converted from your device's local time. Appointments must be within the provider's published working hours.</p>
      <button type="submit">Request appointment ↗</button>
    </form>
  );
}
