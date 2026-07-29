import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getStaffInitials } from "@/components/staff-card";
import { getHillsidePublicData } from "@/lib/hillside-data";

type StaffProfilePageProps = {
  params: Promise<{ slug: string }>;
};

async function getStaffMember(slug: string) {
  const dataResult = await getHillsidePublicData();

  if (dataResult.status !== "available") {
    return null;
  }

  return (
    dataResult.data.staff.find((member) => member.slug === slug) ?? null
  );
}

export async function generateMetadata({
  params,
}: StaffProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const member = await getStaffMember(slug);

  if (!member) {
    return {
      title: "Staff Profile | Hillside Detox",
    };
  }

  return {
    title: `${member.name} | Hillside Detox`,
    description: `View the approved public staff profile for ${member.name}.`,
  };
}

export default async function StaffProfilePage({
  params,
}: StaffProfilePageProps) {
  const { slug } = await params;
  const member = await getStaffMember(slug);

  if (!member) {
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
          aria-labelledby="profile-heading"
          className="relative isolate overflow-hidden border-b border-brand-gold/15"
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_82%_18%,rgba(210,176,103,0.12),transparent_32%)]"
          />
          <div className="mx-auto grid w-full max-w-7xl gap-12 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end lg:px-12 lg:py-24">
            <div
              aria-hidden="true"
              className="flex size-24 items-center justify-center rounded-full border border-brand-gold/35 bg-brand-gold/[0.07] text-xl font-semibold tracking-[0.14em] text-brand-gold sm:size-28"
            >
              {getStaffInitials(member.name)}
            </div>

            <div>
              <Link
                href="/staff"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-gold transition-colors hover:text-brand-gold-light"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to staff directory
              </Link>
              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.24em] text-brand-gold">
                Staff profile
              </p>
              <h1
                id="profile-heading"
                className="mt-4 max-w-4xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.05em] text-brand-cream sm:text-6xl"
              >
                {member.name}
              </h1>
              <p className="mt-5 text-xl leading-8 text-brand-muted">
                {member.title}
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="bio-heading" className="bg-brand-surface">
          <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
            <div className="max-w-3xl rounded-2xl border border-white/[0.09] bg-brand-panel p-6 sm:p-9">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
                About
              </p>
              <h2
                id="bio-heading"
                className="mt-3 text-3xl font-semibold tracking-tight text-brand-cream"
              >
                Biography
              </h2>
              <p className="mt-6 text-lg leading-8 text-brand-muted">
                {member.bio ||
                  "A public biography has not been posted yet."}
              </p>

              <p className="mt-10 inline-flex items-center gap-2 rounded-full border border-brand-gold/20 bg-brand-gold/[0.06] px-4 py-2 text-sm text-brand-gold">
                <ShieldCheck className="size-4" aria-hidden="true" />
                Approved public information only
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
