import type { Metadata } from "next";

import { AmbientHillsideSign } from "@/components/ambient-hillside-sign";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WeeklySchedule } from "@/components/weekly-schedule";
import { getHillsidePublicData } from "@/lib/hillside-data";

export const metadata: Metadata = {
  title: "Program Schedule | Hillside Detox",
  description:
    "View the approved weekly ATS and CSS groups and daily activities.",
};

export default async function SchedulePage() {
  const dataResult = await getHillsidePublicData();
  const isScheduleAvailable = dataResult.status === "available";

  return (
    <div id="top" className="min-h-screen overflow-x-clip bg-background">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-md bg-brand-gold px-4 py-3 text-sm font-semibold text-brand-ink transition-transform focus:translate-y-0"
      >
        Skip to main content
      </a>

      <SiteHeader />

      <main id="main-content" tabIndex={-1}>
        <section
          aria-labelledby="schedule-heading"
          className="ambient-hero-section relative isolate overflow-hidden bg-brand-surface"
        >
          <AmbientHillsideSign />
          <div className="mx-auto w-full max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-20 lg:px-12 lg:pb-28 lg:pt-28">
            <div className="sm:max-w-[52%]">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-gold">
                Program schedule
              </p>
              <h1
                id="schedule-heading"
                className="mt-4 text-balance text-5xl font-semibold tracking-[-0.05em] text-brand-cream sm:text-6xl"
              >
                Weekly program schedule
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-6 text-brand-muted">
                {isScheduleAvailable
                  ? `Showing the approved ATS and CSS group and daily activity information for ${dataResult.data.weekLabel}. Choose a program, then open any day.`
                  : "The secure schedule connection is not active yet. No internal workbook content or placeholder schedule details are being shown."}
              </p>
            </div>

            <div className="mt-[8.75rem] sm:mt-[9.75rem]">
              {isScheduleAvailable ? (
                <WeeklySchedule
                  schedules={dataResult.data.schedules}
                  currentDate={dataResult.data.scheduleDate}
                />
              ) : (
                <div className="rounded-2xl border border-white/[0.09] bg-brand-panel px-6 py-10 sm:px-10 sm:py-12">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
                    Schedule connection
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-brand-cream">
                    The weekly schedule is not available yet
                  </h2>
                  <p className="mt-4 max-w-2xl leading-7 text-brand-muted">
                    The read-only public schedule feed still needs its one-time
                    connection. No internal workbook details or placeholder
                    schedule items are being shown.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
