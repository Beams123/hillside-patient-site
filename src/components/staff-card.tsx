import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import type { StaffMember } from "@/types/hillside-data";

type StaffCardProps = {
  member: StaffMember;
};

export function getStaffInitials(name: string) {
  const parts = name
    .split(",", 1)[0]
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "HD";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function StaffCard({ member }: StaffCardProps) {
  return (
    <Link
      href={`/staff/${member.slug}`}
      aria-label={`View ${member.name}'s profile`}
      className="gold-glow-card group flex min-h-64 flex-col rounded-2xl border border-white/[0.09] bg-brand-panel p-6 sm:p-7"
    >
      <div
        aria-hidden="true"
        className="flex size-14 items-center justify-center rounded-full border border-brand-gold/35 bg-brand-gold/[0.07] text-sm font-semibold tracking-[0.12em] text-brand-gold transition-colors group-hover:bg-brand-gold group-hover:text-brand-ink"
      >
        {getStaffInitials(member.name)}
      </div>

      <div className="mt-auto pt-10">
        <h3 className="text-2xl font-semibold tracking-tight text-brand-cream">
          {member.name}
        </h3>
        <p className="mt-2 leading-7 text-brand-muted">{member.title}</p>
        <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-gold">
          View profile
          <ArrowUpRight
            className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}
