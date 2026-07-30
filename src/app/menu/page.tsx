import type { Metadata } from "next";
import { Suspense } from "react";

import { AlternativeMealRequestForm } from "@/components/alternative-meal-request-form";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getMealOrderMode } from "@/lib/meal-orders";

export const metadata: Metadata = {
  title: "Alternative Meal Request | Hillside Detox",
  description:
    "Request an alternative meal for a selected Hillside lunch or dinner.",
};

export default function MenuPage() {
  const mealOrderMode = getMealOrderMode();

  return (
    <div id="top" className="min-h-screen overflow-x-clip bg-background">
      <a
        href="#main-content"
        className="fixed left-4 top-4 z-[100] -translate-y-24 rounded-md bg-brand-gold px-4 py-3 text-sm font-semibold text-brand-ink transition-transform focus:translate-y-0"
      >
        Skip to main content
      </a>

      <SiteHeader />

      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto w-full max-w-5xl px-5 pb-16 pt-8 sm:px-8 sm:pb-20 md:pt-24 lg:px-12 lg:pb-24"
      >
        <section aria-label="Alternative meal request">
          <Suspense
            fallback={
              <div className="min-h-64 rounded-2xl border border-brand-gold/25 bg-brand-panel" />
            }
          >
            <AlternativeMealRequestForm mode={mealOrderMode} />
          </Suspense>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
