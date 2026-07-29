import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FlaskConical } from "lucide-react";

import { AmbientHillsideSign } from "@/components/ambient-hillside-sign";
import { ResourceDirectory } from "@/components/resource-directory";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { patientResources } from "@/data/resources";

export const metadata: Metadata = {
  title: "Patient Resources Preview | Hillside Detox",
  description:
    "Preview the developing patient-resource library for Hillside Detox.",
};

export default function ResourcesPage() {
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
          aria-labelledby="resources-page-heading"
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
                Patient information
              </p>
              <h1
                id="resources-page-heading"
                className="mt-4 text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.05em] text-brand-cream sm:text-6xl"
              >
                Resource library
              </h1>
              <p className="mt-6 text-pretty text-lg leading-8 text-brand-muted">
                Preview how reviewed facility information, practical guides,
                and educational resources can be organized in one accessible
                place.
              </p>

              <div className="mt-8 flex items-start gap-3 rounded-2xl border border-brand-gold/25 bg-brand-gold/[0.07] px-5 py-4 text-sm leading-6 text-brand-muted">
                <FlaskConical
                  className="mt-0.5 size-5 shrink-0 text-brand-gold"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <p>
                  <strong className="font-semibold text-brand-cream">
                    Sample content only.
                  </strong>{" "}
                  These entries demonstrate the website experience. They are
                  not approved Hillside guidance and must be replaced before
                  public launch.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="Sample patient resources" className="bg-brand-surface">
          <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
            <div className="mb-8 flex flex-col gap-3 border-b border-white/[0.08] pb-7 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
                  Library preview
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-brand-cream">
                  Browse sample resources
                </h2>
              </div>
              <p className="max-w-lg text-sm leading-6 text-brand-muted">
                Choose a category, then open a card to preview an individual
                resource page. This version does not collect or submit any
                information.
              </p>
            </div>

            <ResourceDirectory resources={patientResources} />
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
