import { CalendarDays } from "lucide-react";

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
    <article
      className={
        isToday
          ? "overflow-hidden rounded-2xl border border-brand-gold/45 bg-brand-panel shadow-[0_18px_55px_rgba(0,0,0,0.22)]"
          : "overflow-hidden rounded-2xl border border-white/[0.09] bg-brand-panel"
      }
    >
      <header className="flex items-start justify-between gap-4 border-b border-white/[0.08] px-5 py-5 sm:px-6">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
            <CalendarDays className="size-4" aria-hidden="true" />
            {visibleDate}
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-brand-cream">
            {menuDay.day}
          </h2>
        </div>
        {isToday ? (
          <span className="rounded-full border border-brand-gold/25 bg-brand-gold/[0.07] px-3 py-1.5 text-xs font-semibold text-brand-gold">
            Today
          </span>
        ) : null}
      </header>

      <dl className="divide-y divide-white/[0.08]">
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
    </article>
  );
}
