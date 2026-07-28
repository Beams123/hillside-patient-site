import {
  CalendarDays,
  ClipboardList,
  MapPinned,
  NotebookTabs,
  UtensilsCrossed,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import type { ResourcePreview } from "@/data/homepage";

const icons: Record<ResourcePreview["icon"], LucideIcon> = {
  appointments: CalendarDays,
  directory: UsersRound,
  facility: MapPinned,
  forms: ClipboardList,
  menu: UtensilsCrossed,
  resources: NotebookTabs,
};

type ResourceCardProps = {
  resource: ResourcePreview;
};

export function ResourceCard({ resource }: ResourceCardProps) {
  const Icon = icons[resource.icon];

  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <span className="flex size-11 items-center justify-center rounded-xl border border-brand-gold/20 bg-brand-gold/[0.07] text-brand-gold">
          <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-brand-muted">
          {resource.status}
        </span>
      </div>
      <h3 className="mt-8 text-xl font-semibold tracking-tight text-brand-cream">
        {resource.title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-brand-muted">
        {resource.description}
      </p>
    </>
  );

  return resource.href ? (
    <Link
      href={resource.href}
      className="group min-h-56 rounded-2xl border border-white/[0.09] bg-brand-panel p-6 transition-colors hover:border-brand-gold/40 sm:p-7"
      aria-label={`${resource.title}: ${resource.description}`}
    >
      {content}
    </Link>
  ) : (
    <article className="group min-h-56 rounded-2xl border border-white/[0.09] bg-brand-panel p-6 sm:p-7">
      {content}
    </article>
  );
}
