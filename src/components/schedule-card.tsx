import { Clock3, MapPin } from "lucide-react";

import type { ProgramSchedule } from "@/data/homepage";

type ScheduleCardProps = {
  schedule: ProgramSchedule;
};

export function ScheduleCard({ schedule }: ScheduleCardProps) {
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
          <span className="rounded-full border border-brand-gold/20 bg-brand-gold/[0.05] px-3 py-1.5 text-xs font-medium text-brand-gold">
            Sample schedule
          </span>
        </div>
        <p className="mt-4 flex items-center gap-2 text-sm text-brand-muted">
          <MapPin className="size-4 text-brand-gold" aria-hidden="true" />
          {schedule.location}
        </p>
      </header>

      <ol className="divide-y divide-white/[0.08]">
        {schedule.groups.map((group) => (
          <li
            key={`${schedule.id}-${group.timeValue}`}
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
              <p className="mt-1 text-sm text-brand-muted">
                {group.facilitator}
              </p>
            </div>
          </li>
        ))}
      </ol>
    </article>
  );
}
