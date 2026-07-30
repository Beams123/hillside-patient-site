"use client";

import Image from "next/image";
import { useState } from "react";

import type { StaffMember } from "@/types/hillside-data";

type StaffPortraitProps = {
  member: StaffMember;
  className: string;
  sizes: string;
  priority?: boolean;
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

export function StaffPortrait({
  member,
  className,
  sizes,
  priority = false,
}: StaffPortraitProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const showPortrait = member.portraitUrl.length > 0 && !imageFailed;

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-brand-gold/35 bg-brand-gold/[0.07] font-semibold tracking-[0.12em] text-brand-gold transition-colors group-hover:border-brand-gold/60 ${className}`}
    >
      {showPortrait ? (
        <Image
          src={member.portraitUrl}
          alt={`${member.name} portrait`}
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <span aria-hidden="true">{getStaffInitials(member.name)}</span>
      )}
    </div>
  );
}
