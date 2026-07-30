"use client";

import Link from "next/link";
import { useState, type KeyboardEvent } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  MapPin,
  Sparkles,
  UsersRound,
  UtensilsCrossed,
} from "lucide-react";

import {
  programMealTimes,
  type ProgramMealTime,
} from "@/data/master-schedule";
import { orderWeekSundayFirst } from "@/lib/week-order";
import type {
  MenuDay,
  ProgramCode,
  ScheduleDay,
  WeeklyProgramSchedule,
} from "@/types/hillside-data";

const programOrder = ["ATS", "CSS"] as const;

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "America/New_York",
});

type VisibleCategory = "groups" | "meals" | "activities";

type TimelineGroup = {
  type: "group";
  key: string;
  time: string;
  timeValue: string;
  topic: string;
  facilitator: string;
  location: string;
};

type TimelineMeal = {
  type: "meal";
  key: string;
  time: string;
  timeValue: string;
  label: ProgramMealTime["label"];
  foods: string[];
  soup: string[];
};

type TimelineActivity = {
  type: "activity";
  key: string;
  time: string;
  timeValue: string;
  title: string;
};

type MasterScheduleProps = {
  schedules: WeeklyProgramSchedule[];
  menu: MenuDay[];
  currentDate: string;
};

type MasterScheduleDayProps = {
  programCode: ProgramCode;
  scheduleDay: ScheduleDay;
  menuDay?: MenuDay;
  currentDate: string;
  showGroups: boolean;
  showMeals: boolean;
  showActivities: boolean;
};

function MasterScheduleDay({
  programCode,
  scheduleDay,
  menuDay,
  currentDate,
  showGroups,
  showMeals,
  showActivities,
}: MasterScheduleDayProps) {
  const isToday = scheduleDay.date === currentDate;
  const visibleDate = dateFormatter.format(
    new Date(`${scheduleDay.date}T12:00:00Z`),
  );

  const groupItems: TimelineGroup[] = showGroups
    ? scheduleDay.groups.map((group, index) => ({
        type: "group",
        key: `group-${scheduleDay.date}-${group.timeValue}-${index}`,
        ...group,
      }))
    : [];

  const mealItems: TimelineMeal[] = showMeals
    ? programMealTimes[programCode].map((meal) => ({
        type: "meal",
        key: `meal-${scheduleDay.date}-${meal.key}`,
        time: meal.time,
        timeValue: meal.timeValue,
        label: meal.label,
        foods: menuDay?.[meal.key] ?? [],
        soup:
          meal.key === "lunch" || meal.key === "dinner"
            ? (menuDay?.soupOfTheDay ?? [])
            : [],
      }))
    : [];

  const activityItems: TimelineActivity[] = showActivities
    ? scheduleDay.activities.map((activity, index) => ({
        type: "activity",
        key: `activity-${scheduleDay.date}-${activity.timeValue}-${index}`,
        ...activity,
      }))
    : [];

  const timeline = [...groupItems, ...mealItems, ...activityItems].sort(
    (first, second) => {
      const timeOrder = first.timeValue.localeCompare(second.timeValue);

      if (timeOrder !== 0) {
        return timeOrder;
      }

      if (first.type === second.type) {
        return first.key.localeCompare(second.key);
      }

      const typeOrder = {
        meal: 0,
        group: 1,
        activity: 2,
      } as const;

      return typeOrder[first.type] - typeOrder[second.type];
    },
  );

  return (
    <details
      open={isToday}
      className={
        isToday
          ? "gold-glow-card group overflow-hidden rounded-2xl border border-brand-gold/45 bg-brand-panel shadow-[0_18px_55px_rgba(0,0,0,0.22)]"
          : "gold-glow-card group overflow-hidden rounded-2xl border border-white/[0.09] bg-brand-panel"
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

      {timeline.length > 0 ? (
        <ol className="divide-y divide-white/[0.08] border-t border-white/[0.08]">
          {timeline.map((item) => (
            <li
              key={item.key}
              className="grid gap-3 px-5 py-5 sm:grid-cols-[7rem_1fr] sm:gap-5 sm:px-6"
            >
              <time
                dateTime={item.timeValue}
                className="flex items-center gap-2 text-sm font-semibold text-brand-gold"
              >
                <Clock3 className="size-4" aria-hidden="true" />
                {item.time}
              </time>

              {item.type === "group" ? (
                <div>
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">
                    <UsersRound
                      className="size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    Group
                  </p>
                  <p className="mt-1.5 font-medium text-brand-cream">
                    {item.topic}
                  </p>
                  {item.location ? (
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm font-medium text-brand-gold">
                      <MapPin
                        className="size-3.5 shrink-0"
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      {item.location}
                    </p>
                  ) : null}
                  {item.facilitator ? (
                    <p className="mt-1 text-sm text-brand-muted">
                      Facilitator:{" "}
                      <span className="font-semibold">
                        {item.facilitator}
                      </span>
                    </p>
                  ) : null}
                </div>
              ) : item.type === "activity" ? (
                <div>
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">
                    <Sparkles
                      className="size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    Activity
                  </p>
                  <p className="mt-1.5 font-medium text-brand-cream">
                    {item.title}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">
                    <UtensilsCrossed
                      className="size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    Meal
                  </p>
                  <p className="mt-1.5 font-medium text-brand-cream">
                    {item.label}
                  </p>
                  {item.foods.length > 0 ? (
                    <ul className="mt-2 grid gap-x-6 gap-y-1.5 text-sm leading-6 text-brand-muted sm:grid-cols-2">
                      {item.foods.map((food, index) => (
                        <li
                          key={`${item.key}-${index}-${food}`}
                          className="flex gap-2.5"
                        >
                          <span
                            aria-hidden="true"
                            className="mt-[0.6rem] size-1.5 shrink-0 rounded-full bg-brand-gold"
                          />
                          <span>{food}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-sm italic text-brand-muted">
                      Menu items not posted
                    </p>
                  )}
                  {item.soup.length > 0 ? (
                    <p className="mt-2 text-sm text-brand-muted">
                      <span className="font-semibold text-brand-cream">
                        Soup of the Day:
                      </span>{" "}
                      {item.soup.join(", ")}
                    </p>
                  ) : null}
                  {item.label !== "Breakfast" ? (
                    <Link
                      href={{
                        pathname: "/menu",
                        query: {
                          program: programCode,
                          date: scheduleDay.date,
                          meal: item.label.toLowerCase(),
                        },
                      }}
                      className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-brand-gold/25 bg-brand-gold/[0.06] px-3.5 py-2 text-xs font-semibold text-brand-gold transition-colors hover:border-brand-gold/45 hover:bg-brand-gold/[0.11] hover:text-brand-gold-light"
                    >
                      Request an alternative meal
                      <ArrowRight className="size-3.5" aria-hidden="true" />
                    </Link>
                  ) : null}
                </div>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="border-t border-white/[0.08] px-5 py-8 text-sm leading-6 text-brand-muted sm:px-6">
          Choose Groups, Meals, or Activities above to show this day&apos;s
          schedule.
        </p>
      )}
    </details>
  );
}

export function MasterSchedule({
  schedules,
  menu,
  currentDate,
}: MasterScheduleProps) {
  const orderedSchedules = programOrder
    .map((code) => schedules.find((schedule) => schedule.title === code))
    .filter(
      (schedule): schedule is WeeklyProgramSchedule =>
        schedule !== undefined,
    );
  const [selectedProgram, setSelectedProgram] = useState<ProgramCode>(
    () => orderedSchedules[0]?.title ?? "ATS",
  );
  const [visibleCategories, setVisibleCategories] = useState<
    Record<VisibleCategory, boolean>
  >({
    groups: true,
    meals: true,
    activities: true,
  });

  function handleTabKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    currentIndex: number,
  ) {
    if (
      event.key !== "ArrowLeft" &&
      event.key !== "ArrowRight" &&
      event.key !== "Home" &&
      event.key !== "End"
    ) {
      return;
    }

    event.preventDefault();

    let nextIndex = currentIndex;

    if (event.key === "ArrowLeft") {
      nextIndex =
        (currentIndex - 1 + orderedSchedules.length) %
        orderedSchedules.length;
    } else if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % orderedSchedules.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = orderedSchedules.length - 1;
    }

    const nextProgram = orderedSchedules[nextIndex].title;
    setSelectedProgram(nextProgram);
    document
      .getElementById(`master-schedule-tab-${nextProgram.toLowerCase()}`)
      ?.focus();
  }

  function toggleCategory(category: VisibleCategory) {
    setVisibleCategories((current) => ({
      ...current,
      [category]: !current[category],
    }));
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div
        role="tablist"
        aria-label="Schedule program"
        className="grid grid-cols-2 rounded-2xl border border-white/[0.09] bg-background/50 p-1.5"
      >
        {orderedSchedules.map((schedule, index) => {
          const isSelected = schedule.title === selectedProgram;
          const tabId = `master-schedule-tab-${schedule.id}`;
          const panelId = `master-schedule-panel-${schedule.id}`;

          return (
            <button
              key={schedule.id}
              id={tabId}
              type="button"
              role="tab"
              aria-selected={isSelected}
              aria-controls={panelId}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => setSelectedProgram(schedule.title)}
              onKeyDown={(event) => handleTabKeyDown(event, index)}
              className={
                isSelected
                  ? "min-h-12 rounded-xl bg-brand-gold px-5 py-3 text-sm font-semibold tracking-[0.16em] text-brand-ink shadow-[0_8px_24px_rgba(210,176,103,0.14)]"
                  : "min-h-12 rounded-xl px-5 py-3 text-sm font-semibold tracking-[0.16em] text-brand-muted transition-colors hover:bg-white/[0.04] hover:text-brand-cream"
              }
            >
              {schedule.title}
            </button>
          );
        })}
      </div>

      <fieldset className="mt-5">
        <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-muted">
          Show in timeline
        </legend>
        <div className="mt-3 flex flex-wrap gap-2.5">
          <button
            type="button"
            aria-pressed={visibleCategories.groups}
            onClick={() => toggleCategory("groups")}
            className={
              visibleCategories.groups
                ? "inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-gold/45 bg-brand-gold/[0.12] px-4 py-2 text-sm font-semibold text-brand-gold"
                : "inline-flex min-h-11 items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.025] px-4 py-2 text-sm font-semibold text-brand-muted transition-colors hover:border-brand-gold/30 hover:text-brand-cream"
            }
          >
            {visibleCategories.groups ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <UsersRound className="size-4" aria-hidden="true" />
            )}
            Groups
          </button>
          <button
            type="button"
            aria-pressed={visibleCategories.meals}
            onClick={() => toggleCategory("meals")}
            className={
              visibleCategories.meals
                ? "inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-gold/45 bg-brand-gold/[0.12] px-4 py-2 text-sm font-semibold text-brand-gold"
                : "inline-flex min-h-11 items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.025] px-4 py-2 text-sm font-semibold text-brand-muted transition-colors hover:border-brand-gold/30 hover:text-brand-cream"
            }
          >
            {visibleCategories.meals ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <UtensilsCrossed className="size-4" aria-hidden="true" />
            )}
            Meals
          </button>
          <button
            type="button"
            aria-pressed={visibleCategories.activities}
            onClick={() => toggleCategory("activities")}
            className={
              visibleCategories.activities
                ? "inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-gold/45 bg-brand-gold/[0.12] px-4 py-2 text-sm font-semibold text-brand-gold"
                : "inline-flex min-h-11 items-center gap-2 rounded-full border border-white/[0.1] bg-white/[0.025] px-4 py-2 text-sm font-semibold text-brand-muted transition-colors hover:border-brand-gold/30 hover:text-brand-cream"
            }
          >
            {visibleCategories.activities ? (
              <Check className="size-4" aria-hidden="true" />
            ) : (
              <Sparkles className="size-4" aria-hidden="true" />
            )}
            Activities
          </button>
        </div>
      </fieldset>

      {orderedSchedules.map((schedule) => {
        const isSelected = schedule.title === selectedProgram;

        return (
          <div
            key={schedule.id}
            id={`master-schedule-panel-${schedule.id}`}
            role="tabpanel"
            aria-labelledby={`master-schedule-tab-${schedule.id}`}
            hidden={!isSelected}
            className="mt-6 space-y-4"
          >
            {orderWeekSundayFirst(schedule.days).map((scheduleDay) => (
              <MasterScheduleDay
                key={`${schedule.id}-${scheduleDay.date}`}
                programCode={schedule.title}
                scheduleDay={scheduleDay}
                menuDay={menu.find(
                  (menuDay) => menuDay.date === scheduleDay.date,
                )}
                currentDate={currentDate}
                showGroups={visibleCategories.groups}
                showMeals={visibleCategories.meals}
                showActivities={visibleCategories.activities}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
