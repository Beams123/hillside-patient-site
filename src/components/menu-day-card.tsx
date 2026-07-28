import { CalendarDays, ChevronDown } from "lucide-react";

import type { MenuDay } from "@/types/hillside-data";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "America/New_York",
});

const meals = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snack", label: "Snack" },
] as const;

type MenuDayCardProps = {
  menuDay: MenuDay;
  isToday: boolean;
};

export function MenuDayCard({ menuDay, isToday }: MenuDayCardProps) {
  const visibleDate = dateFormatter.format(
    new Date(`${menuDay.date}T12:00:00Z`),
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
          <span className="mt-2 block text-2xl font-semibold tracking-tight text-brand-cream">
            {menuDay.day}
          </span>
        </div>

        <span className="flex shrink-0 items-center gap-3">
          {isToday ? (
            <span className="rounded-full border border-brand-gold/25 bg-brand-gold/[0.07] px-3 py-1.5 text-xs font-semibold text-brand-gold">
              Today
            </span>
          ) : null}
          <span className="hidden text-xs font-semibold uppercase tracking-[0.12em] text-brand-muted sm:inline">
            <span className="group-open:hidden">View meals</span>
            <span className="hidden group-open:inline">Hide meals</span>
          </span>
          <ChevronDown
            className="size-5 text-brand-gold transition-transform duration-200 group-open:rotate-180"
            aria-hidden="true"
          />
        </span>
      </summary>

      <dl className="divide-y divide-white/[0.08] border-t border-white/[0.08]">
        {meals.map((meal) => (
          <div
            key={meal.key}
            className="grid gap-1 px-5 py-4 sm:grid-cols-[7rem_1fr] sm:gap-4 sm:px-6"
          >
            <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">
              {meal.label}
            </dt>
            <dd
              className={
                menuDay[meal.key]
                  ? "text-sm leading-6 text-brand-cream"
                  : "text-sm italic leading-6 text-brand-muted"
              }
            >
              {menuDay[meal.key] || "Not posted"}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
