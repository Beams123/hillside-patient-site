import {
  BookOpenText,
  BusFront,
  Compass,
  HeartHandshake,
  House,
  ListChecks,
  Shirt,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import type { PatientResource } from "@/data/resources";

const resourceIcons: Record<PatientResource["icon"], LucideIcon> = {
  "daily-living": Shirt,
  facility: House,
  "next-steps": ListChecks,
  "personal-items": Compass,
  reading: BookOpenText,
  support: HeartHandshake,
  transportation: BusFront,
  wellness: Sparkles,
};

type ResourceLibraryIconProps = {
  icon: PatientResource["icon"];
  className?: string;
};

export function ResourceLibraryIcon({
  icon,
  className = "size-5",
}: ResourceLibraryIconProps) {
  const Icon = resourceIcons[icon];

  return <Icon className={className} strokeWidth={1.75} aria-hidden="true" />;
}

type ResourceLibraryCardProps = {
  resource: PatientResource;
};

export function ResourceLibraryCard({
  resource,
}: ResourceLibraryCardProps) {
  return (
    <Link
      href={`/resources/${resource.slug}`}
      aria-label={`Open sample resource: ${resource.title}`}
      className="gold-glow-card group flex min-h-64 flex-col rounded-2xl border border-white/[0.09] bg-brand-panel p-6 sm:p-7"
    >
      <div className="flex items-start justify-between gap-4">
        <span className="flex size-12 items-center justify-center rounded-xl border border-brand-gold/25 bg-brand-gold/[0.07] text-brand-gold transition-colors group-hover:bg-brand-gold group-hover:text-brand-ink">
          <ResourceLibraryIcon icon={resource.icon} />
        </span>
        <span className="rounded-full border border-brand-gold/20 bg-brand-gold/[0.05] px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.15em] text-brand-gold">
          Sample
        </span>
      </div>

      <div className="mt-auto pt-10">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
          {resource.category}
        </p>
        <h3 className="mt-3 text-2xl font-semibold tracking-tight text-brand-cream">
          {resource.title}
        </h3>
        <p className="mt-3 text-sm leading-6 text-brand-muted">
          {resource.description}
        </p>
        <span className="mt-6 inline-flex items-center text-sm font-semibold text-brand-gold">
          Preview resource
          <span
            aria-hidden="true"
            className="ml-2 transition-transform group-hover:translate-x-1"
          >
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
