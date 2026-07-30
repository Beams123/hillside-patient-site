"use client";

import { useEffect, useState } from "react";

const facilityTimeZone = "America/New_York";

const visibleDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: facilityTimeZone,
});

const machineDateFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: facilityTimeZone,
});

export function CurrentDate() {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setToday(new Date()), 60_000);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <time
      dateTime={machineDateFormatter.format(today)}
      className="text-sm font-medium text-brand-cream"
      suppressHydrationWarning
    >
      {visibleDateFormatter.format(today)}
    </time>
  );
}
