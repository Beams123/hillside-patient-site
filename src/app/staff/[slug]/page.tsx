import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Mail, Phone, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";

import { AmbientHillsideSign } from "@/components/ambient-hillside-sign";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { StaffPortrait } from "@/components/staff-portrait";
import { getHillsidePublicData } from "@/lib/hillside-data";

type StaffProfilePageProps = {
  params: Promise<{ slug: string }>;
};

async function getStaffMemberResult(slug: string) {
  const dataResult = await getHillsidePublicData();

  if (dataResult.status !== "available") {
    return {
      status: "unavailable" as const,
      member: null,
    };
  }

  return {
    status: "available" as const,
    member:
      dataResult.data.staff.find((member) => member.slug === slug) ?? null,
  };
}

export async function generateStaticParams() {
  const dataResult = await getHillsidePublicData();

  if (dataResult.status !== "available") {
    return [];
  }

  return dataResult.data.staff.map((member) => ({
    slug: member.slug,
  }));
}

export async function generateMetadata({
  params,
}: StaffProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const profileResult = await getStaffMemberResult(slug);
  const member = profileResult.member;

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

function StaffProfileUnavailable() {
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
          aria-labelledby="profile-unavailable-heading"
          className="ambient-hero-section relative isolate overflow-hidden"
        >
          <AmbientHillsideSign />
          <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
            <div className="sm:max-w-[52%]">
              <Link
                href="/staff"
                className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-brand-gold transition-colors hover:text-brand-gold-light"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to staff directory
              </Link>
              <UsersRound
                className="mt-10 size-8 text-brand-gold"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <h1
                id="profile-unavailable-heading"
                className="mt-5 text-balance text-4xl font-semibold leading-tight tracking-[-0.04em] text-brand-cream sm:text-5xl"
              >
                This staff profile is temporarily unavailable
              </h1>
              <p className="mt-5 max-w-xl leading-7 text-brand-muted">
                The staff directory connection did not respond in time. Please
                return to the directory and try again shortly.
              </p>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

export default async function StaffProfilePage({
  params,
}: StaffProfilePageProps) {
  const { slug } = await params;
  const profileResult = await getStaffMemberResult(slug);

  if (profileResult.status !== "available") {
    return <StaffProfileUnavailable />;
  }

  const member = profileResult.member;

  if (!member) {
    notFound();
  }

  const biographyParagraphs = member.bio
    ? member.bio.split("\n")
    : ["A public biography has not been posted yet."];
  const hasContactDetails = Boolean(member.email || member.phone);
  const phoneHref = member.phone
    ? `tel:${member.phone.replace(/[^\d+]/g, "")}`
    : "";

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
          className="ambient-hero-section relative isolate overflow-hidden"
        >
          <AmbientHillsideSign />
          <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
            <div className="grid gap-12 sm:max-w-[52%] lg:grid-cols-[auto_minmax(0,1fr)] lg:items-end">
              <StaffPortrait
                member={member}
                className="size-32 text-xl sm:size-40 sm:text-2xl"
                sizes="(max-width: 640px) 128px, 160px"
                priority
              />

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
                  className="mt-4 text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.05em] text-brand-cream sm:text-6xl"
                >
                  {member.name}
                </h1>
                <p className="mt-5 text-xl leading-8 text-brand-muted">
                  {member.title}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section aria-labelledby="bio-heading" className="bg-brand-surface">
          <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
            <div
              className={
                hasContactDetails
                  ? "grid max-w-5xl gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start"
                  : "max-w-3xl"
              }
            >
              <article className="rounded-2xl border border-white/[0.09] bg-brand-panel p-6 sm:p-9">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
                  About
                </p>
                <h2
                  id="bio-heading"
                  className="mt-3 text-3xl font-semibold tracking-tight text-brand-cream"
                >
                  Biography
                </h2>
                <div className="mt-6 space-y-5 text-lg leading-8 text-brand-muted">
                  {biographyParagraphs.map((paragraph, index) => (
                    <p key={`${member.slug}-bio-${index}`}>{paragraph}</p>
                  ))}
                </div>
              </article>

              {hasContactDetails ? (
                <aside
                  aria-labelledby="contact-heading"
                  className="rounded-2xl border border-white/[0.09] bg-brand-panel p-6 sm:p-7"
                >
                  <div className="flex size-11 items-center justify-center rounded-xl border border-brand-gold/20 bg-brand-gold/[0.07] text-brand-gold">
                    <Mail
                      className="size-5"
                      strokeWidth={1.75}
                      aria-hidden="true"
                    />
                  </div>
                  <h2
                    id="contact-heading"
                    className="mt-6 text-xl font-semibold tracking-tight text-brand-cream"
                  >
                    Contact
                  </h2>
                  <div className="mt-4 space-y-4">
                    {member.email ? (
                      <a
                        href={`mailto:${member.email}`}
                        className="block break-all text-sm font-semibold leading-6 text-brand-gold underline decoration-brand-gold/35 underline-offset-4 transition-colors hover:text-brand-gold-light"
                      >
                        {member.email}
                      </a>
                    ) : null}
                    {member.phone ? (
                      <a
                        href={phoneHref}
                        className="inline-flex items-center gap-2 text-sm font-semibold leading-6 text-brand-gold underline decoration-brand-gold/35 underline-offset-4 transition-colors hover:text-brand-gold-light"
                      >
                        <Phone className="size-4" aria-hidden="true" />
                        {member.phone}
                      </a>
                    ) : null}
                  </div>
                  <p className="mt-6 border-t border-white/[0.08] pt-5 text-xs leading-5 text-brand-muted">
                    For general communication only. Do not include medical,
                    treatment, or other confidential information in an
                    unsecured email.
                  </p>
                </aside>
              ) : null}
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
