import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { StaffPortrait } from "@/components/staff-portrait";
import type { StaffMember } from "@/types/hillside-data";

type StaffCardProps = {
  member: StaffMember;
};

export function StaffCard({ member }: StaffCardProps) {
  return (
    <Link
      href={`/staff/${member.slug}`}
      aria-label={`View ${member.name}'s profile`}
      className="gold-glow-card group flex min-h-60 min-w-0 flex-col rounded-xl border border-white/[0.09] bg-brand-panel p-4 sm:min-h-72 sm:rounded-2xl sm:p-7"
    >
      <StaffPortrait
        member={member}
        className="size-16 text-sm sm:size-20 sm:text-base"
        sizes="(max-width: 639px) 64px, 80px"
      />

      <div className="mt-auto min-w-0 pt-5 sm:pt-8">
        <h3 className="text-base font-semibold leading-snug tracking-tight text-brand-cream sm:text-2xl">
          {member.name}
        </h3>
        <p className="mt-2 text-sm leading-5 text-brand-muted sm:text-base sm:leading-7">
          {member.title}
        </p>
        <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-gold sm:mt-6 sm:gap-2 sm:text-sm">
          <span className="sm:hidden">Profile</span>
          <span className="hidden sm:inline">View profile</span>
          <ArrowUpRight
            className="size-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 sm:size-4"
            aria-hidden="true"
          />
        </span>
      </div>
    </Link>
  );
}
