import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, UsersRound } from "lucide-react";

import { AmbientHillsideSign } from "@/components/ambient-hillside-sign";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StaffDirectory } from "@/components/staff-directory";
import { getHillsidePublicData } from "@/lib/hillside-data";

export const metadata: Metadata = {
  title: "Staff Directory | Hillside Detox",
  description: "View approved public staff information for Hillside Detox.",
};

export default async function StaffPage() {
  const dataResult = await getHillsidePublicData();
  const hasStaff =
    dataResult.status === "available" && dataResult.data.staff.length > 0;

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
          aria-labelledby="staff-heading"
          className="ambient-hero-section relative isolate overflow-hidden"
        >
          <AmbientHillsideSign />
          <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
            <Link
              href="/master-schedule"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-gold transition-colors hover:text-brand-gold-light"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to schedule
            </Link>
            <div className="sm:max-w-[52%]">
              <h1
                id="staff-heading"
                className="mt-8 text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.05em] text-brand-cream sm:text-6xl"
              >
                Staff directory
              </h1>
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-brand-gold">
                People at Hillside
              </p>
            </div>
          </div>
        </section>

        <section aria-label="Staff members" className="bg-brand-surface">
          <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
            {hasStaff ? (
              <>
                <div className="mb-8 border-b border-white/[0.08] pb-7">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
                      Staff
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight text-brand-cream">
                      Meet the team
                    </h2>
                  </div>
                </div>

                <StaffDirectory staff={dataResult.data.staff} />
              </>
            ) : (
              <div className="rounded-2xl border border-white/[0.09] bg-brand-panel px-6 py-10 sm:px-10 sm:py-12">
                <UsersRound
                  className="size-7 text-brand-gold"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
                  Directory connection
                </p>
                <h2 className="mt-3 text-3xl font-semibold tracking-tight text-brand-cream">
                  The staff directory is not available yet
                </h2>
                <p className="mt-4 max-w-2xl leading-7 text-brand-muted">
                  The approved public staff list is still being connected. No
                  names, roles, or contact details are being guessed.
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
