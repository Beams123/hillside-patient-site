import {
  CalendarDays,
  ChevronDown,
  Clock3,
  MapPin,
} from "lucide-react";

import type {
  ProgramCode,
  ScheduleDay,
} from "@/types/hillside-data";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "America/New_York",
});

type ScheduleDayCardProps = {
  programCode: ProgramCode;
  scheduleDay: ScheduleDay;
  isToday: boolean;
};

export function ScheduleDayCard({
  programCode,
  scheduleDay,
  isToday,
}: ScheduleDayCardProps) {
  const visibleDate = dateFormatter.format(
    new Date(`${scheduleDay.date}T12:00:00Z`),
  );

  return (
    <details
      open={isToday}
      className={
        isToday
          ? "group overflow-hidden rounded-2xl border border-brand-gold/45 bg-brand-panel shadow-[0_18px_55px_rgba(0,0,0,0.22)]"
          : "group overflow-hidden rounded-2xl border border-white/[0.09] bg-brand-panel"
      }
    >
      <summary className="flex min-h-24 cursor-pointer list-none items-center justify-between gap-4 px-5 py-5 select-none transition-colors hover:bg-white/[0.025] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-gold [&::-webkit-details-marker]:hidden sm:px-6">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
            <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
            {visibleDate}
          </p>
          <h3 className="mt-2 text-2xl font-semibold tracking-tight text-brand-cream">
            {scheduleDay.day}
          </h3>
        </div>

        <span className="flex shrink-0 items-center gap-3">
          {isToday ? (
            <span className="rounded-full border border-brand-gold/25 bg-brand-gold/[0.07] px-3 py-1.5 text-xs font-semibold text-brand-gold">
              Today
            </span>
          ) : null}
          <ChevronDown
            className="size-5 text-brand-gold transition-transform duration-200 group-open:rotate-180"
            aria-hidden="true"
          />
        </span>
      </summary>

      {scheduleDay.groups.length > 0 ? (
        <ol className="divide-y divide-white/[0.08] border-t border-white/[0.08]">
          {scheduleDay.groups.map((group, index) => (
            <li
              key={`${programCode}-${scheduleDay.date}-${group.timeValue}-${index}`}
              className="grid gap-3 px-5 py-5 sm:grid-cols-[7rem_1fr] sm:gap-5 sm:px-6"
            >
              <time
                dateTime={group.timeValue}
                className="flex items-center gap-2 text-sm font-semibold text-brand-gold"
              >
                <Clock3 className="size-4" aria-hidden="true" />
                {group.time}
              </time>
              <div>
                <p className="font-medium text-brand-cream">{group.topic}</p>
                {group.location ? (
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-brand-gold">
                    <MapPin
                      className="size-3.5 shrink-0"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                    {group.location}
                  </p>
                ) : null}
                {group.facilitator ? (
                  <p className="mt-1 text-sm text-brand-muted">
                    Facilitator:{" "}
                    <span className="font-semibold">{group.facilitator}</span>
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="border-t border-white/[0.08] px-5 py-8 text-sm leading-6 text-brand-muted sm:px-6">
          No groups are listed for this day.
        </p>
      )}
    </details>
  );
}
