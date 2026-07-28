import { Clock3 } from "lucide-react";

import type { ProgramSchedule } from "@/types/hillside-data";

type ScheduleCardProps = {
  schedule: ProgramSchedule;
  isAvailable: boolean;
};

export function ScheduleCard({ schedule, isAvailable }: ScheduleCardProps) {
  return (
    <article className="overflow-hidden rounded-2xl border border-white/[0.09] bg-brand-panel">
      <header className="border-b border-white/[0.08] px-5 py-6 sm:px-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
              {schedule.label}
            </p>
            <h3 className="mt-2 text-2xl font-semibold tracking-tight text-brand-cream">
              {schedule.title}
            </h3>
          </div>
          <span
            className={
              isAvailable
                ? "rounded-full border border-brand-gold/20 bg-brand-gold/[0.05] px-3 py-1.5 text-xs font-medium text-brand-gold"
                : "rounded-full border border-white/10 px-3 py-1.5 text-xs font-medium text-brand-muted"
            }
          >
            {isAvailable ? "Today" : "Not connected"}
          </span>
        </div>
      </header>

      {schedule.groups.length > 0 ? (
        <ol className="divide-y divide-white/[0.08]">
          {schedule.groups.map((group) => (
            <li
              key={`${schedule.id}-${group.timeValue}-${group.topic}`}
              className="grid gap-3 px-5 py-5 sm:grid-cols-[7rem_1fr] sm:gap-5 sm:px-7"
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
                {group.facilitator ? (
                  <p className="mt-1 text-sm text-brand-muted">
                    Facilitator: {group.facilitator}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="px-5 py-8 text-sm leading-6 text-brand-muted sm:px-7">
          {isAvailable
            ? "No groups are currently listed for this program today."
            : "Today’s schedule will appear here after the secure data connection is deployed."}
        </p>
      )}
    </article>
  );
}
