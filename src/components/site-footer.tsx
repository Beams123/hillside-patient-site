export function SiteFooter() {
  return (
    <footer className="border-t border-brand-gold/15 bg-black">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-5 py-8 text-sm text-brand-muted sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
        <p>Hillside Detox · Patient information</p>
        <p className="text-xs uppercase tracking-[0.16em] text-brand-gold/80">
          Public information only
        </p>
      </div>
    </footer>
  );
}
