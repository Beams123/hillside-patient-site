import { ArrowDown } from "lucide-react";

import { CurrentDate } from "@/components/current-date";
import { ResourceCard } from "@/components/resource-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { WeeklySchedule } from "@/components/weekly-schedule";
import { homepageContent, resourcePreviews } from "@/data/homepage";
import { getHillsidePublicData } from "@/lib/hillside-data";

export default async function Home() {
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
          aria-labelledby="today-heading"
          className="relative isolate overflow-hidden border-b border-brand-gold/15"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_86%_14%,rgba(210,176,103,0.12),transparent_28%),radial-gradient(circle_at_12%_88%,rgba(210,176,103,0.07),transparent_34%)]"
          />
          <div className="mx-auto flex min-h-[32rem] w-full max-w-7xl items-center px-5 py-16 sm:min-h-[34rem] sm:px-8 sm:py-20 lg:min-h-[36rem] lg:px-12 lg:py-24">
            <div className="max-w-4xl">
              <div className="mb-8 flex flex-wrap items-center gap-x-4 gap-y-3">
                <span className="h-px w-10 bg-brand-gold" aria-hidden="true" />
                <CurrentDate />
                <span className="rounded-full border border-brand-gold/25 bg-brand-gold/[0.06] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
                  {homepageContent.previewLabel}
                </span>
              </div>

              <p className="mb-5 text-sm font-semibold uppercase tracking-[0.26em] text-brand-gold">
                {homepageContent.eyebrow}
              </p>
              <h1
                id="today-heading"
                className="max-w-4xl text-balance text-5xl font-semibold leading-[0.98] tracking-[-0.055em] text-brand-cream sm:text-6xl lg:text-[5.5rem]"
              >
                {homepageContent.title}
              </h1>
              <p className="mt-7 max-w-2xl text-pretty text-lg leading-8 text-brand-muted sm:text-xl sm:leading-9">
                {homepageContent.introduction}
              </p>

              <a
                href="#schedule"
                className="mt-9 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand-gold px-5 py-3 text-sm font-semibold text-brand-ink shadow-[0_10px_35px_rgba(210,176,103,0.12)] transition-colors hover:bg-brand-gold-light"
              >
                View this week&apos;s schedule
                <ArrowDown className="size-4" aria-hidden="true" />
              </a>
            </div>
          </div>
        </section>

        <section
          id="schedule"
          aria-labelledby="schedule-heading"
          className="scroll-mt-28 border-b border-white/[0.07] bg-brand-surface"
        >
          <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,0.75fr)_minmax(20rem,0.4fr)] lg:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-gold">
                  Group schedule
                </p>
                <h2
                  id="schedule-heading"
                  className="mt-4 text-balance text-4xl font-semibold tracking-[-0.04em] text-brand-cream sm:text-5xl"
                >
                  Weekly program schedule
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-brand-muted lg:justify-self-end">
                {isScheduleAvailable
                  ? `Showing the approved ATS and CSS group information for ${dataResult.data.weekLabel}. Choose a program, then open any day.`
                  : "The secure schedule connection is not active yet. No internal workbook content or placeholder group details are being shown."}
              </p>
            </div>

            <div className="mt-10">
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
                  <h3 className="mt-3 text-3xl font-semibold tracking-tight text-brand-cream">
                    The weekly schedule is not available yet
                  </h3>
                  <p className="mt-4 max-w-2xl leading-7 text-brand-muted">
                    The read-only public schedule feed still needs its one-time
                    connection. No internal workbook details or placeholder
                    groups are being shown.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>

        <section
          id="resources"
          aria-labelledby="resources-heading"
          className="scroll-mt-28 border-b border-white/[0.07]"
        >
          <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8 sm:py-24 lg:px-12 lg:py-28">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-gold">
                Patient resources
              </p>
              <h2
                id="resources-heading"
                className="mt-4 text-balance text-4xl font-semibold tracking-[-0.04em] text-brand-cream sm:text-5xl"
              >
                What you need, in one place
              </h2>
              <p className="mt-5 max-w-2xl text-base leading-7 text-brand-muted">
                Open the weekly menu, meet the staff, or try the sample resource
                library while verified content is gathered.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {resourcePreviews.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          </div>
        </section>

        <section
          id="information"
          aria-labelledby="information-heading"
          className="scroll-mt-28"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-center lg:px-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-gold">
                Here to help
              </p>
              <h2
                id="information-heading"
                className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-brand-cream"
              >
                Not sure where to look?
              </h2>
              <p className="mt-3 max-w-2xl leading-7 text-brand-muted">
                A staff member can help you find the right schedule or facility
                resource.
              </p>
            </div>
            <p className="rounded-xl border border-brand-gold/20 bg-brand-gold/[0.05] px-5 py-4 text-sm leading-6 text-brand-muted lg:max-w-sm">
              This site displays general patient information and does not
              collect personal or clinical information.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
