import type { Metadata } from "next";

import { AmbientHillsideSign } from "@/components/ambient-hillside-sign";
import { MasterSchedule } from "@/components/master-schedule";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getHillsidePublicData } from "@/lib/hillside-data";
import type { HillsidePublicData } from "@/types/hillside-data";

export const metadata: Metadata = {
  title: "Schedule | Hillside Detox",
  description:
    "View Hillside groups, meals, and daily activities in one filterable schedule.",
};

const scheduleDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

function getScheduleDateRange(data: HillsidePublicData) {
  const firstSchedule = data.schedules[0];
  const firstDate = firstSchedule?.days[0]?.date;
  const lastDate = firstSchedule?.days.at(-1)?.date;

  if (!firstDate || !lastDate) {
    return "";
  }

  const start = new Date(`${firstDate}T12:00:00Z`);
  const end = new Date(`${lastDate}T12:00:00Z`);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return "";
  }

  return `${scheduleDateFormatter.format(start)} - ${scheduleDateFormatter.format(end)}`;
}

export default async function MasterSchedulePage() {
  const dataResult = await getHillsidePublicData();
  const isScheduleAvailable =
    dataResult.status === "available" &&
    dataResult.data.schedules.length > 0;
  const scheduleDateRange =
    dataResult.status === "available"
      ? getScheduleDateRange(dataResult.data)
      : "";

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
          className="ambient-hero-section relative isolate overflow-hidden bg-brand-surface"
        >
          <AmbientHillsideSign />
          <div className="mx-auto w-full max-w-7xl px-5 pb-20 pt-16 sm:px-8 sm:pb-24 sm:pt-20 lg:px-12 lg:pb-28 lg:pt-28">
            <div className="sm:max-w-[52%]">
              <h1
                id="master-schedule-heading"
                className="text-balance text-5xl font-semibold tracking-[-0.05em] text-brand-cream sm:text-6xl"
              >
                Schedule
              </h1>
              {scheduleDateRange ? (
                <p className="mt-5 text-sm font-semibold tracking-[0.08em] text-brand-gold">
                  {scheduleDateRange}
                </p>
              ) : null}
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
                    The schedule is not available yet
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
