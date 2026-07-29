import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import {
  ArrowLeft,
  ClipboardPenLine,
  ShieldCheck,
  UtensilsCrossed,
} from "lucide-react";

import { AlternativeMealRequestForm } from "@/components/alternative-meal-request-form";
import { AmbientHillsideSign } from "@/components/ambient-hillside-sign";
import { MenuDayCard } from "@/components/menu-day-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getHillsidePublicData } from "@/lib/hillside-data";
import { getMealOrderMode } from "@/lib/meal-orders";
import { orderWeekSundayFirst } from "@/lib/week-order";

export const metadata: Metadata = {
  title: "Meals & Alternatives | Hillside Detox",
  description:
    "View the weekly patient menu and alternative-meal request area.",
};

export default async function MenuPage() {
  const dataResult = await getHillsidePublicData();
  const hasMenu =
    dataResult.status === "available" && dataResult.data.menu.length > 0;
  const mealOrderMode = getMealOrderMode();

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
          className="ambient-hero-section relative isolate overflow-hidden"
        >
          <AmbientHillsideSign />
          <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
            <Link
              href="/master-schedule"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-gold transition-colors hover:text-brand-gold-light"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to master schedule
            </Link>
            <div className="sm:max-w-[52%]">
              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.24em] text-brand-gold">
                Patient dining
              </p>
              <h1
                id="menu-heading"
                className="mt-4 text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.05em] text-brand-cream sm:text-6xl"
              >
                Meals & alternatives
              </h1>
              <p className="mt-6 text-pretty text-lg leading-8 text-brand-muted">
                A simple day-by-day view of breakfast, lunch, dinner, and the
                soup of the day.
              </p>

              {hasMenu ? (
                <p className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-full border border-brand-gold/20 bg-brand-gold/[0.06] px-4 py-2 text-sm text-brand-gold">
                  <ShieldCheck className="size-4" aria-hidden="true" />
                  {dataResult.data.weekLabel}
                </p>
              ) : null}
            </div>
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
                  {orderWeekSundayFirst(dataResult.data.menu).map(
                    (menuDay) => (
                      <MenuDayCard
                        key={menuDay.date}
                        menuDay={menuDay}
                        isToday={
                          menuDay.date === dataResult.data.scheduleDate
                        }
                      />
                    ),
                  )}
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

        <section
          id="alternative-meal-request"
          aria-labelledby="alternative-meal-heading"
          className="scroll-mt-28 border-t border-white/[0.07]"
        >
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,0.75fr)_minmax(20rem,0.45fr)] lg:items-center lg:px-12 lg:py-24">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-gold">
                Alternative menu
              </p>
              <h2
                id="alternative-meal-heading"
                className="mt-3 text-balance text-3xl font-semibold tracking-[-0.035em] text-brand-cream sm:text-4xl"
              >
                Request an alternative meal
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-brand-muted">
                Choose an eligible lunch or dinner from Master Schedule. Its
                program, date, serving time, and request deadline will be
                attached automatically.
              </p>
              <Link
                href="/requests"
                className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-gold transition-colors hover:text-brand-gold-light"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Return to the Request Hub
              </Link>
            </div>

            <aside
              aria-label="Alternative meal request instructions"
              className="gold-glow-card rounded-2xl border border-brand-gold/25 bg-brand-panel p-6 sm:p-7"
            >
              <div className="flex items-start gap-4">
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-brand-gold/20 bg-brand-gold/[0.07] text-brand-gold">
                  <UtensilsCrossed
                    className="size-5"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
                    Request protection
                  </p>
                  <h3 className="mt-2 text-xl font-semibold tracking-tight text-brand-cream">
                    Meal-specific requests
                  </h3>
                </div>
              </div>
              <p className="mt-5 text-sm leading-6 text-brand-muted">
                Requests must begin from a lunch or dinner in Master Schedule.
                {mealOrderMode === "live"
                  ? " The selected meal and submission time are verified by the server before the request reaches the private order sheet."
                  : mealOrderMode === "test"
                    ? " Demonstration mode uses synthetic receipts and is not connected to the private order sheet."
                    : " Online submission remains disabled until the private order destination and server-only connection are fully configured."}
              </p>
              <div className="mt-6 flex items-center gap-2 border-t border-white/[0.08] pt-5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">
                <ClipboardPenLine className="size-4" aria-hidden="true" />
                {mealOrderMode === "live"
                  ? "Private workflow active"
                  : mealOrderMode === "test"
                    ? "Safe demonstration mode"
                    : "Paper process remains active"}
              </div>
            </aside>
          </div>

          <div className="mx-auto w-full max-w-5xl px-5 pb-16 sm:px-8 sm:pb-20 lg:px-12 lg:pb-24">
            <Suspense
              fallback={
                <div className="min-h-64 rounded-2xl border border-brand-gold/25 bg-brand-panel" />
              }
            >
              <AlternativeMealRequestForm mode={mealOrderMode} />
            </Suspense>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
