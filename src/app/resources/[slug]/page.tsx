import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, FlaskConical } from "lucide-react";
import { notFound } from "next/navigation";

import { ResourceLibraryIcon } from "@/components/resource-library-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { patientResources } from "@/data/resources";

type ResourcePreviewPageProps = {
  params: Promise<{ slug: string }>;
};

function getResource(slug: string) {
  return patientResources.find((resource) => resource.slug === slug) ?? null;
}

export function generateStaticParams() {
  return patientResources.map((resource) => ({ slug: resource.slug }));
}

export async function generateMetadata({
  params,
}: ResourcePreviewPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = getResource(slug);

  if (!resource) {
    return {
      title: "Resource Preview | Hillside Detox",
    };
  }

  return {
    title: `${resource.title} Preview | Hillside Detox`,
    description: `Preview the sample ${resource.title.toLowerCase()} resource page.`,
  };
}

export default async function ResourcePreviewPage({
  params,
}: ResourcePreviewPageProps) {
  const { slug } = await params;
  const resource = getResource(slug);

  if (!resource) {
    notFound();
  }

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
          aria-labelledby="resource-heading"
          className="relative isolate overflow-hidden border-b border-brand-gold/15"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_18%,rgba(210,176,103,0.12),transparent_32%)]"
          />
          <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end lg:px-12 lg:py-24">
            <div
              aria-hidden="true"
              className="flex size-24 items-center justify-center rounded-2xl border border-brand-gold/35 bg-brand-gold/[0.07] text-brand-gold sm:size-28"
            >
              <ResourceLibraryIcon
                icon={resource.icon}
                className="size-10 sm:size-12"
              />
            </div>

            <div>
              <Link
                href="/resources"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-gold transition-colors hover:text-brand-gold-light"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to resource library
              </Link>
              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.24em] text-brand-gold">
                {resource.category} · Sample
              </p>
              <h1
                id="resource-heading"
                className="mt-4 max-w-4xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.05em] text-brand-cream sm:text-6xl"
              >
                {resource.title}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-brand-muted">
                {resource.description}
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="preview-heading" className="bg-brand-surface">
          <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
            <div className="max-w-3xl rounded-2xl border border-white/[0.09] bg-brand-panel p-6 sm:p-9">
              <div className="flex items-start gap-3 rounded-xl border border-brand-gold/20 bg-brand-gold/[0.06] px-4 py-4 text-sm leading-6 text-brand-muted">
                <FlaskConical
                  className="mt-0.5 size-5 shrink-0 text-brand-gold"
                  strokeWidth={1.75}
                  aria-hidden="true"
                />
                <p>
                  This page demonstrates the resource layout only. No text on
                  this page should be treated as approved facility guidance.
                </p>
              </div>

              <p className="mt-9 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
                Planned structure
              </p>
              <h2
                id="preview-heading"
                className="mt-3 text-3xl font-semibold tracking-tight text-brand-cream"
              >
                Preview sections
              </h2>
              <ul className="mt-7 space-y-3">
                {resource.previewSections.map((section, index) => (
                  <li
                    key={section}
                    className="flex items-center gap-4 rounded-xl border border-white/[0.08] bg-white/[0.025] px-4 py-4 text-brand-muted"
                  >
                    <span
                      aria-hidden="true"
                      className="flex size-8 shrink-0 items-center justify-center rounded-full border border-brand-gold/25 text-xs font-semibold text-brand-gold"
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span>{section}</span>
                  </li>
                ))}
              </ul>

              <p className="mt-9 border-t border-white/[0.08] pt-7 text-sm leading-6 text-brand-muted">
                Approved text, PDFs, or public links can replace these sample
                sections later without changing the overall interface.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
