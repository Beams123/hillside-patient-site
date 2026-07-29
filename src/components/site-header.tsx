import Link from "next/link";

import { navigationItems } from "@/data/homepage";

const coinEdgeDepths = [-3, -2, -1, 0, 1, 2, 3];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-gold/15 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
        <Link
          href="/"
          aria-label="Hillside Detox home — progress not perfection"
          className="site-logo-link inline-flex min-h-11 items-center gap-3 rounded-md [perspective:500px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          <span
            aria-hidden="true"
            className="hillside-coin relative size-11 shrink-0"
          >
            {coinEdgeDepths.map((depth, index) => (
              <span
                key={depth}
                className={`hillside-coin-edge absolute inset-0 rounded-full ${
                  index % 2 === 0
                    ? "hillside-coin-edge-dark"
                    : "hillside-coin-edge-light"
                }`}
                style={{ transform: `translateZ(${depth}px)` }}
              />
            ))}

            <span className="hillside-coin-face hillside-coin-front absolute inset-0 flex items-center justify-center rounded-full border border-[#f1dc9a] bg-[radial-gradient(circle_at_32%_25%,#f3dda1_0%,#d6b665_35%,#a77d2f_76%,#6f4d16_100%)] shadow-[inset_0_0_0_2px_rgba(76,50,12,0.28),inset_0_0_12px_rgba(255,244,196,0.45),0_2px_8px_rgba(0,0,0,0.35)]">
              <span className="pointer-events-none absolute inset-1 rounded-full border border-brand-ink/35" />
              <span className="pointer-events-none absolute left-[22%] top-[13%] h-[18%] w-[36%] -rotate-[20deg] rounded-full bg-white/25 blur-[1px]" />
              <span className="hillside-coin-engraving pointer-events-none absolute inset-[0.38rem]" />
            </span>

            <span className="hillside-coin-face hillside-coin-back absolute inset-0 flex items-center justify-center rounded-full border border-[#f1dc9a] bg-[radial-gradient(circle_at_35%_28%,#f0d58d_0%,#cfaa55_43%,#9b6f24_78%,#684513_100%)] shadow-[inset_0_0_0_2px_rgba(76,50,12,0.3),inset_0_0_12px_rgba(255,244,196,0.42),0_2px_8px_rgba(0,0,0,0.35)]">
              <span className="pointer-events-none absolute inset-1 rounded-full border border-brand-ink/35" />
              <span className="hillside-coin-motto relative flex flex-col items-center justify-center text-center text-[0.32rem] font-black uppercase leading-[1.05] tracking-[0.055em] text-[#62400b]">
                <span>Progress</span>
                <span className="my-px text-[0.27rem] tracking-[0.12em]">
                  not
                </span>
                <span>Perfection</span>
              </span>
            </span>
          </span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-[0.2em] text-brand-cream">
              Hillside
            </span>
            <span className="block text-[0.65rem] uppercase tracking-[0.18em] text-brand-muted">
              Patient information
            </span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-brand-muted transition-colors hover:bg-white/[0.05] hover:text-brand-cream"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="border-t border-white/[0.06] md:hidden"
      >
        <ul className="grid grid-cols-5">
          {navigationItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-flex min-h-11 w-full items-center justify-center px-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.04em] text-brand-muted transition-colors hover:text-brand-cream sm:text-xs sm:tracking-[0.1em]"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
