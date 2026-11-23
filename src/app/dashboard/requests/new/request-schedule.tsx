"use client";

import { useState } from "react";

function localDateTimeValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

export function RequestScheduleField() {
  const [localValue, setLocalValue] = useState("");
  const [isoValue, setIsoValue] = useState("");

  return (
    <div className="request-schedule-field">
      <label htmlFor="request-desired-at">When do you need this done? <span>(optional)</span></label>
      <input
        id="request-desired-at"
        type="datetime-local"
        min={localDateTimeValue()}
        value={localValue}
        onChange={(event) => {
          const value = event.target.value;
          setLocalValue(value);
          const parsed = value ? new Date(value) : null;
          setIsoValue(parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : "");
        }}
      />
      <input type="hidden" name="desired_at" value={isoValue} />
      <small>Choose your local date and time. This target will be shared with providers only if you publish the request.</small>
    </div>
  );
}
