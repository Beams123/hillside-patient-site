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
      className="gold-glow-card group flex min-h-72 flex-col rounded-2xl border border-white/[0.09] bg-brand-panel p-6 sm:p-7"
    >
      <StaffPortrait
        member={member}
        className="size-20 text-base"
        sizes="80px"
      />

      <div className="mt-auto pt-8">
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
