"use client";

import { useState, type KeyboardEvent } from "react";

import { ScheduleDayCard } from "@/components/schedule-day-card";
import type {
  ProgramCode,
  WeeklyProgramSchedule,
} from "@/types/hillside-data";

const programOrder = ["ATS", "CSS"] as const;

type WeeklyScheduleProps = {
  schedules: WeeklyProgramSchedule[];
  currentDate: string;
};

export function WeeklySchedule({
  schedules,
  currentDate,
}: WeeklyScheduleProps) {
  const [selectedProgram, setSelectedProgram] =
    useState<ProgramCode>("ATS");
  const orderedSchedules = programOrder
    .map((code) => schedules.find((schedule) => schedule.title === code))
    .filter(
      (schedule): schedule is WeeklyProgramSchedule =>
        schedule !== undefined,
    );

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
      .getElementById(`schedule-tab-${nextProgram.toLowerCase()}`)
      ?.focus();
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div
        role="tablist"
        aria-label="Program schedule"
        className="grid grid-cols-2 rounded-2xl border border-white/[0.09] bg-background/50 p-1.5"
      >
        {orderedSchedules.map((schedule, index) => {
          const isSelected = schedule.title === selectedProgram;
          const tabId = `schedule-tab-${schedule.id}`;
          const panelId = `schedule-panel-${schedule.id}`;

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

      {orderedSchedules.map((schedule) => {
        const isSelected = schedule.title === selectedProgram;

        return (
          <div
            key={schedule.id}
            id={`schedule-panel-${schedule.id}`}
            role="tabpanel"
            aria-labelledby={`schedule-tab-${schedule.id}`}
            hidden={!isSelected}
            className="mt-6 space-y-4"
          >
            {schedule.days.map((scheduleDay) => (
              <ScheduleDayCard
                key={`${schedule.id}-${scheduleDay.date}`}
                programCode={schedule.title}
                scheduleDay={scheduleDay}
                isToday={scheduleDay.date === currentDate}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
