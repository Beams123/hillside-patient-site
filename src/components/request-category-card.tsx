import {
  Cigarette,
  FileWarning,
  Package,
  UserRoundCheck,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";

import type { RequestCategory } from "@/data/requests";

const icons: Record<RequestCategory["icon"], LucideIcon> = {
  grievance: FileWarning,
  meal: UtensilsCrossed,
  nicotine: Cigarette,
  package: Package,
  visitor: UserRoundCheck,
};

type RequestCategoryCardProps = {
  category: RequestCategory;
};

export function RequestCategoryCard({
  category,
}: RequestCategoryCardProps) {
  const Icon = icons[category.icon];

  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <span className="flex size-12 items-center justify-center rounded-xl border border-brand-gold/20 bg-brand-gold/[0.07] text-brand-gold">
          <Icon className="size-5" strokeWidth={1.75} aria-hidden="true" />
        </span>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-brand-muted">
          {category.statusLabel}
        </span>
      </div>

      <h3 className="mt-8 text-xl font-semibold tracking-tight text-brand-cream">
        {category.title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-brand-muted">
        {category.description}
      </p>
      <p className="mt-auto border-t border-white/[0.08] pt-5 text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold">
        {category.actionLabel}
      </p>
    </>
  );

  return category.href ? (
    <Link
      href={category.href}
      aria-label={`${category.title}: ${category.actionLabel}`}
      className="gold-glow-card group flex min-h-64 flex-col rounded-2xl border border-white/[0.09] bg-brand-panel p-6 sm:p-7"
    >
      {content}
    </Link>
  ) : (
    <article className="gold-glow-card flex min-h-64 flex-col rounded-2xl border border-white/[0.09] bg-brand-panel p-6 sm:p-7">
      {content}
    </article>
  );
}
