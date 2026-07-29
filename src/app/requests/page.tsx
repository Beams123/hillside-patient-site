import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { AmbientHillsideSign } from "@/components/ambient-hillside-sign";
import { RequestCategoryCard } from "@/components/request-category-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requestCategories } from "@/data/requests";
import { getPatientRequestMode } from "@/lib/patient-requests";

export const metadata: Metadata = {
  title: "Patient Request Hub | Hillside Detox",
  description:
    "Open Hillside’s approved patient-request workflows.",
};

const safeguards = [
  "Server-side validation",
  "Separate restricted workbooks",
  "Server-only destination secrets",
] as const;

export default function RequestsPage() {
  const patientRequestMode = getPatientRequestMode();

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
          aria-labelledby="requests-page-heading"
          className="relative isolate overflow-hidden"
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

            <div className="mt-8 sm:max-w-[52%]">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-gold">
                  Private request workflows
                </p>
                <h1
                  id="requests-page-heading"
                  className="mt-4 max-w-4xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.05em] text-brand-cream sm:text-6xl"
                >
                  Patient Request Hub
                </h1>
                <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-brand-muted">
                  Open a request form, review the information, and submit it
                  for management review.
                </p>
              </div>

              <div className="mt-8 rounded-2xl border border-brand-gold/25 bg-brand-gold/[0.07] p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    className="mt-0.5 size-6 shrink-0 text-brand-gold"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <div>
                    <h2 className="font-semibold text-brand-cream">
                      {patientRequestMode === "live"
                        ? "Private submission is active"
                        : patientRequestMode === "test"
                          ? "Demonstration mode is active"
                          : "Online submission is not active yet"}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-brand-muted">
                      {patientRequestMode === "live"
                        ? "Grievances, package requests, and visitor requests are validated before being recorded in their restricted management workbooks."
                        : patientRequestMode === "test"
                          ? "Synthetic submissions reach the website validation route but are not sent to Google Sheets or retained."
                          : "Continue using the current paper process until the private workbooks, reviewer access, and retention policies are configured."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          aria-labelledby="category-heading"
          className="border-b border-white/[0.07] bg-brand-surface"
        >
          <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-gold">
                Request categories
              </p>
              <h2
                id="category-heading"
                className="mt-4 text-balance text-4xl font-semibold tracking-[-0.04em] text-brand-cream sm:text-5xl"
              >
                Choose a request
              </h2>
              <p className="mt-5 max-w-2xl leading-7 text-brand-muted">
                Grievance, package, and visitor requests use the private
                management workflow. The nicotine-order process remains a
                planning draft because this site will not collect payment-card
                or bank information.
              </p>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {requestCategories.map((category) => (
                <RequestCategoryCard key={category.id} category={category} />
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="safeguards-heading">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,0.75fr)_minmax(20rem,0.45fr)] lg:px-12">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-gold">
                {patientRequestMode === "live"
                  ? "Private management routing"
                  : "Privacy checkpoint"}
              </p>
              <h2
                id="safeguards-heading"
                className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-brand-cream"
              >
                {patientRequestMode === "live"
                  ? "Connected and ready for requests"
                  : "Decide the secure workflow before activation"}
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-brand-muted">
                {patientRequestMode === "live"
                  ? "Grievance, package, and visitor submissions are validated by the website and recorded in separate private management workbooks. The forms can be submitted from any internet connection."
                  : "Each workbook must remain restricted to the management roles that need it. Hillside still needs to approve the records retention schedule before live launch. The patient forms themselves will be reachable from any internet connection."}
              </p>

              <ul className="mt-7 grid gap-3 sm:grid-cols-3">
                {safeguards.map((safeguard) => (
                  <li
                    key={safeguard}
                    className="flex items-start gap-2 rounded-xl border border-white/[0.08] bg-brand-panel px-4 py-4 text-sm leading-6 text-brand-muted"
                  >
                    <CheckCircle2
                      className="mt-0.5 size-4 shrink-0 text-brand-gold"
                      aria-hidden="true"
                    />
                    {safeguard}
                  </li>
                ))}
              </ul>
            </div>

            <aside
              aria-label="Private request workflow"
              className="rounded-2xl border border-white/[0.09] bg-brand-panel p-6 sm:p-7"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-11 items-center justify-center rounded-xl border border-brand-gold/20 bg-brand-gold/[0.07] text-brand-gold">
                  <LockKeyhole
                    className="size-5"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                </span>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
                  Private workflow
                </p>
              </div>
              <ol className="mt-6 space-y-5 text-sm leading-6 text-brand-muted">
                <li className="flex gap-3">
                  <span className="font-semibold text-brand-gold">01</span>
                  Patient chooses an approved request category.
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-brand-gold">02</span>
                  The page explains what information is appropriate to share.
                </li>
                <li className="flex gap-3">
                  <span className="font-semibold text-brand-gold">03</span>
                  The server validates the request and records it in the
                  restricted workbook assigned to the right management role.
                </li>
              </ol>
              <div className="mt-7 flex items-center gap-2 border-t border-white/[0.08] pt-5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">
                <ClipboardList className="size-4" aria-hidden="true" />
                {patientRequestMode === "live"
                  ? "Private workbooks connected"
                  : patientRequestMode === "test"
                    ? "Synthetic test mode"
                    : "Production submission disabled"}
              </div>
            </aside>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
