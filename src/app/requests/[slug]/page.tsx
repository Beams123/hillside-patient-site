import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  LockKeyhole,
  RouteOff,
  ShieldAlert,
} from "lucide-react";
import { notFound } from "next/navigation";

import { AmbientHillsideSign } from "@/components/ambient-hillside-sign";
import { RequestCategoryIcon } from "@/components/request-category-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { requestDetails } from "@/data/requests";
import { getPatientRequestMode } from "@/lib/patient-requests";
import type { PatientRequestMode } from "@/data/patient-requests";

type RequestDetailPageProps = {
  params: Promise<{ slug: string }>;
};

function getRequestDetail(slug: string) {
  return requestDetails.find((detail) => detail.slug === slug) ?? null;
}

async function getPatientRequestForm(
  slug: string,
  mode: PatientRequestMode,
) {
  switch (slug) {
    case "grievance": {
      const { GrievanceRequestForm } =
        await import("@/components/grievance-request-form");
      return <GrievanceRequestForm mode={mode} />;
    }
    case "package-request": {
      const { PackageRequestForm } =
        await import("@/components/package-request-form");
      return <PackageRequestForm mode={mode} />;
    }
    case "visitor-request": {
      const { VisitorRequestForm } =
        await import("@/components/visitor-request-form");
      return <VisitorRequestForm mode={mode} />;
    }
    default:
      return null;
  }
}

export function generateStaticParams() {
  return requestDetails.map((detail) => ({ slug: detail.slug }));
}

export async function generateMetadata({
  params,
}: RequestDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const detail = getRequestDetail(slug);

  if (!detail) {
    return {
      title: "Request Workflow Preview | Hillside Detox",
    };
  }

  return {
    title: `${detail.title} | Hillside Detox`,
    description: `Review the ${detail.title.toLowerCase()} workflow.`,
  };
}

export default async function RequestDetailPage({
  params,
}: RequestDetailPageProps) {
  const { slug } = await params;
  const detail = getRequestDetail(slug);

  if (!detail) {
    notFound();
  }

  const patientRequestMode = getPatientRequestMode();
  const patientRequestForm = await getPatientRequestForm(
    detail.slug,
    patientRequestMode,
  );

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
          aria-labelledby="request-detail-heading"
          className="relative isolate overflow-hidden"
        >
          <AmbientHillsideSign />
          <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
            <div className="grid gap-10 sm:max-w-[52%] lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end">
              <div
                aria-hidden="true"
                className="flex size-24 items-center justify-center rounded-2xl border border-brand-gold/35 bg-brand-gold/[0.07] text-brand-gold sm:size-28"
              >
                <RequestCategoryIcon
                  icon={detail.icon}
                  className="size-10 sm:size-12"
                />
              </div>

              <div>
                <Link
                  href="/requests"
                  className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-gold transition-colors hover:text-brand-gold-light"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back to Request Hub
                </Link>
                <p className="mt-8 text-sm font-semibold uppercase tracking-[0.24em] text-brand-gold">
                  {patientRequestForm
                    ? "Private request workflow"
                    : "Display-only workflow draft"}
                </p>
                <h1
                  id="request-detail-heading"
                  className="mt-4 text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.05em] text-brand-cream sm:text-6xl"
                >
                  {detail.title}
                </h1>
                <p className="mt-5 text-lg leading-8 text-brand-muted">
                  {detail.summary}
                </p>
              </div>
            </div>
          </div>
        </section>

        {patientRequestForm ? (
          <section
            aria-label={detail.title}
            className="border-b border-white/[0.07] bg-brand-surface"
          >
            <div className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
              {patientRequestForm}
            </div>
          </section>
        ) : null}

        <section aria-labelledby="workflow-heading" className="bg-brand-surface">
          <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[minmax(0,0.72fr)_minmax(20rem,0.35fr)] lg:items-start lg:px-12 lg:py-24">
            <div>
              <div className="flex items-start gap-3 rounded-2xl border border-brand-gold/25 bg-brand-gold/[0.07] px-5 py-5 text-sm leading-6 text-brand-muted">
                <ShieldAlert
                  className="mt-0.5 size-5 shrink-0 text-brand-gold"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <p>
                  <strong className="font-semibold text-brand-cream">
                    {patientRequestForm
                      ? patientRequestMode === "live"
                        ? "Submissions use the private management workflow."
                        : patientRequestMode === "test"
                          ? "Synthetic testing is active."
                          : "Online submission remains disabled."
                      : "No information is transmitted or stored."}
                  </strong>{" "}
                  {patientRequestForm
                    ? patientRequestMode === "live"
                      ? "The website validates each request before forwarding it to the restricted workbook assigned to this request type."
                        : patientRequestMode === "test"
                          ? "Test submissions reach the local server validation route but are not sent to Google Sheets or retained."
                          : "Continue using the current paper process until the private workbook, access restrictions, and retention policy are configured."
                    : "This page documents the proposed workflow so Hillside can review it before any secure submission system is selected."}
                </p>
              </div>

              <p className="mt-10 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
                Workflow details
              </p>
              <h2
                id="workflow-heading"
                className="mt-3 text-3xl font-semibold tracking-tight text-brand-cream"
              >
                {patientRequestForm && patientRequestMode === "live"
                  ? "How this request works"
                  : "Current details and open decisions"}
              </h2>

              <div className="mt-7 space-y-4">
                {detail.sections.map((section, index) => (
                  <article
                    key={section.title}
                    className="gold-glow-card rounded-2xl border border-white/[0.09] bg-brand-panel p-6 sm:p-8"
                  >
                    <div className="flex items-start gap-4">
                      <span
                        aria-hidden="true"
                        className="flex size-9 shrink-0 items-center justify-center rounded-full border border-brand-gold/25 text-xs font-semibold text-brand-gold"
                      >
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className="text-xl font-semibold tracking-tight text-brand-cream">
                          {section.title}
                        </h3>
                        <p className="mt-3 leading-7 text-brand-muted">
                          {section.description}
                        </p>
                      </div>
                    </div>

                    {section.items ? (
                      <ul className="mt-6 space-y-3 border-t border-white/[0.08] pt-6">
                        {section.items.map((item) => (
                          <li
                            key={item}
                            className="flex items-start gap-3 text-sm leading-6 text-brand-muted"
                          >
                            <CheckCircle2
                              className="mt-1 size-4 shrink-0 text-brand-gold"
                              aria-hidden="true"
                            />
                            {item}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    {section.note ? (
                      <p className="mt-6 rounded-xl border border-brand-gold/20 bg-brand-gold/[0.05] px-4 py-4 text-sm leading-6 text-brand-muted">
                        {section.note}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>

            <aside
              aria-label={
                patientRequestForm
                  ? "Management review destination"
                  : "Planned request routing"
              }
              className="rounded-2xl border border-white/[0.09] bg-brand-panel p-6 sm:p-7 lg:sticky lg:top-24"
            >
              <div className="flex size-11 items-center justify-center rounded-xl border border-brand-gold/20 bg-brand-gold/[0.07] text-brand-gold">
                {patientRequestForm ? (
                  <LockKeyhole
                    className="size-5"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                ) : (
                  <RouteOff
                    className="size-5"
                    strokeWidth={1.75}
                    aria-hidden="true"
                  />
                )}
              </div>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
                {patientRequestForm
                  ? "Management review"
                  : "Intended recipient"}
              </p>
              <h2 className="mt-2 text-xl font-semibold tracking-tight text-brand-cream">
                {detail.intendedRecipient}
              </h2>
              <p className="mt-4 text-sm leading-6 text-brand-muted">
                {detail.routingNote}
              </p>
              <div className="mt-7 flex items-center gap-2 border-t border-white/[0.08] pt-5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">
                <LockKeyhole className="size-4" aria-hidden="true" />
                {patientRequestForm
                  ? patientRequestMode === "live"
                    ? "Private submission active"
                    : patientRequestMode === "test"
                      ? "Synthetic test mode"
                      : "Production submission disabled"
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
