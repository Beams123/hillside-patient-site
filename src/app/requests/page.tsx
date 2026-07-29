import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { RequestCategoryCard } from "@/components/request-category-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requestCategories } from "@/data/requests";

export const metadata: Metadata = {
  title: "Request Hub Preview | Hillside Detox",
  description:
    "Preview proposed patient-request categories without submitting personal or clinical information.",
};

const safeguards = [
  "No form fields",
  "No request submission",
  "No personal or clinical information stored",
] as const;

export default function RequestsPage() {
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
          className="relative isolate overflow-hidden border-b border-brand-gold/15"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_86%_14%,rgba(210,176,103,0.12),transparent_30%),radial-gradient(circle_at_10%_90%,rgba(210,176,103,0.06),transparent_34%)]"
          />
          <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
            <Link
              href="/"
              className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-gold transition-colors hover:text-brand-gold-light"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back to today
            </Link>

            <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.42fr)] lg:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-gold">
                  Read-only prototype
                </p>
                <h1
                  id="requests-page-heading"
                  className="mt-4 max-w-4xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.05em] text-brand-cream sm:text-6xl"
                >
                  Patient Request Hub
                </h1>
                <p className="mt-6 max-w-2xl text-pretty text-lg leading-8 text-brand-muted">
                  Preview how common requests could be organized after Hillside
                  approves the categories, privacy safeguards, and secure
                  delivery system.
                </p>
              </div>

              <div className="rounded-2xl border border-brand-gold/25 bg-brand-gold/[0.07] p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <ShieldCheck
                    className="mt-0.5 size-6 shrink-0 text-brand-gold"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                  <div>
                    <h2 className="font-semibold text-brand-cream">
                      Nothing is sent from this page
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-brand-muted">
                      This prototype is intentionally display-only. To request
                      help now, speak directly with a staff member.
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
                Proposed organization
              </p>
              <h2
                id="category-heading"
                className="mt-4 text-balance text-4xl font-semibold tracking-[-0.04em] text-brand-cream sm:text-5xl"
              >
                Draft request categories
              </h2>
              <p className="mt-5 max-w-2xl leading-7 text-brand-muted">
                These are the initial Hillside request types identified for the
                prototype. The four forms remain inactive until their secure
                workflows are approved.
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
                Privacy checkpoint
              </p>
              <h2
                id="safeguards-heading"
                className="mt-3 text-3xl font-semibold tracking-[-0.035em] text-brand-cream"
              >
                Decide the secure workflow before activation
              </h2>
              <p className="mt-4 max-w-2xl leading-7 text-brand-muted">
                Hillside still needs to approve which requests belong online,
                what information is necessary, who receives it, and which
                compliant system handles delivery and retention.
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
              aria-label="Future request workflow"
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
                  Future workflow
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
                  An approved system securely delivers the request to the right
                  role.
                </li>
              </ol>
              <div className="mt-7 flex items-center gap-2 border-t border-white/[0.08] pt-5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">
                <ClipboardList className="size-4" aria-hidden="true" />
                No submission system connected
              </div>
            </aside>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
