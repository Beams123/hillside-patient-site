import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

import { MenuDayCard } from "@/components/menu-day-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getHillsidePublicData } from "@/lib/hillside-data";

export const metadata: Metadata = {
  title: "Weekly Menu | Hillside Detox",
  description: "View the weekly patient menu at Hillside Detox.",
};

export default async function MenuPage() {
  const dataResult = await getHillsidePublicData();
  const hasMenu =
    dataResult.status === "available" && dataResult.data.menu.length > 0;

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
          aria-labelledby="menu-heading"
          className="relative isolate overflow-hidden border-b border-brand-gold/15"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_86%_14%,rgba(210,176,103,0.12),transparent_30%)]"
          />
          <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-gold transition-colors hover:text-brand-gold-light"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to today
            </Link>
            <p className="mt-8 text-sm font-semibold uppercase tracking-[0.24em] text-brand-gold">
              Patient dining
            </p>
            <h1
              id="menu-heading"
              className="mt-4 max-w-4xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.05em] text-brand-cream sm:text-6xl"
            >
              Weekly menu
            </h1>
            <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-brand-muted">
              A simple day-by-day view of breakfast, lunch, dinner, and the
              soup of the day.
            </p>

            {hasMenu ? (
              <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-brand-gold/20 bg-brand-gold/[0.06] px-4 py-2 text-sm text-brand-gold">
                <ShieldCheck className="size-4" aria-hidden="true" />
                {dataResult.data.weekLabel}
              </p>
            ) : null}
          </div>
        </section>

        <section
          aria-label="Weekly meal information"
          className="bg-brand-surface"
        >
          <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
            {hasMenu ? (
              <>
                <div className="mb-8 flex flex-col gap-3 border-b border-white/[0.08] pb-7 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
                      Current week
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-brand-cream">
                      Meals by day
                    </h2>
                  </div>
                  <p className="max-w-lg text-sm leading-6 text-brand-muted">
                    Menu details are read from the approved public-content
                    sheet and refreshed automatically.
                  </p>
                </div>

                <div className="mx-auto max-w-4xl space-y-4">
                  {dataResult.data.menu.map((menuDay) => (
                    <MenuDayCard
                      key={menuDay.date}
                      menuDay={menuDay}
                      isToday={
                        menuDay.date === dataResult.data.scheduleDate
                      }
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="rounded-2xl border border-white/[0.09] bg-brand-panel px-6 py-10 sm:px-10 sm:py-12">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
                  Menu connection
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-brand-cream">
                  The weekly menu is not available yet
                </h2>
                <p className="mt-4 max-w-2xl leading-7 text-brand-muted">
                  The private, editable menu sheet and its secure public feed
                  still need their one-time setup. No menu details are being
                  guessed or copied from the internal schedule workbook.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
