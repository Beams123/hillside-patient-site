import { navigationItems } from "@/data/homepage";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-brand-gold/15 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
        <a
          href="#top"
          aria-label="Hillside Detox home"
          className="group inline-flex min-h-11 items-center gap-3"
        >
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-full border border-brand-gold/60 text-sm font-semibold text-brand-gold transition-colors group-hover:bg-brand-gold group-hover:text-brand-ink"
          >
            H
          </span>
          <span>
            <span className="block text-sm font-semibold uppercase tracking-[0.2em] text-brand-cream">
              Hillside
            </span>
            <span className="block text-[0.65rem] uppercase tracking-[0.18em] text-brand-muted">
              Patient information
            </span>
          </span>
        </a>

        <nav aria-label="Primary navigation" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {navigationItems.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-medium text-brand-muted transition-colors hover:bg-white/[0.05] hover:text-brand-cream"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <nav
        aria-label="Mobile navigation"
        className="border-t border-white/[0.06] md:hidden"
      >
        <ul className="grid grid-cols-4">
          {navigationItems.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="inline-flex min-h-11 w-full items-center justify-center px-1 text-[0.6rem] font-semibold uppercase tracking-[0.09em] text-brand-muted transition-colors hover:text-brand-cream sm:text-xs sm:tracking-[0.12em]"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
