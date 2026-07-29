import type { Metadata } from "next";

import { AmbientHillsideSign } from "@/components/ambient-hillside-sign";
import { MasterSchedule } from "@/components/master-schedule";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getHillsidePublicData } from "@/lib/hillside-data";

export const metadata: Metadata = {
  title: "Master Schedule | Hillside Detox",
  description:
    "View Hillside groups, meals, and daily activities in one filterable schedule.",
};

export default async function MasterSchedulePage() {
  const dataResult = await getHillsidePublicData();
  const isScheduleAvailable =
    dataResult.status === "available" &&
    dataResult.data.schedules.length > 0;

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
          aria-labelledby="master-schedule-heading"
          className="relative isolate overflow-hidden bg-brand-surface"
        >
          <AmbientHillsideSign />
          <div className="mx-auto w-full max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-20 lg:px-12 lg:pb-28 lg:pt-28">
            <div className="sm:max-w-[52%]">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-gold">
                Daily timeline
              </p>
              <h1
                id="master-schedule-heading"
                className="mt-4 text-balance text-5xl font-semibold tracking-[-0.05em] text-brand-cream sm:text-6xl"
              >
                Master schedule
              </h1>
              <p className="mt-6 max-w-xl text-sm leading-6 text-brand-muted">
                {isScheduleAvailable
                  ? `Showing approved group, meal, and daily activity information for ${dataResult.data.weekLabel}. Choose ATS or CSS, then filter the timeline.`
                  : "The secure schedule connection is not active yet. No internal workbook content or placeholder details are being shown."}
              </p>
            </div>

            <div className="mt-20 sm:mt-[18.5rem]">
              {isScheduleAvailable ? (
                <MasterSchedule
                  schedules={dataResult.data.schedules}
                  menu={dataResult.data.menu}
                  currentDate={dataResult.data.scheduleDate}
                />
              ) : (
                <div className="rounded-2xl border border-white/[0.09] bg-brand-panel px-6 py-10 sm:px-10 sm:py-12">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
                    Schedule connection
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-brand-cream">
                    The master schedule is not available yet
                  </h2>
                  <p className="mt-4 max-w-2xl leading-7 text-brand-muted">
                    The read-only public feed still needs its one-time
                    connection. No schedule or menu details are being guessed.
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
