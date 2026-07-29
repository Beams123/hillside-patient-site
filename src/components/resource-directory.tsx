"use client";

import { useMemo, useState } from "react";

import { ResourceLibraryCard } from "@/components/resource-library-card";
import {
  resourceCategories,
  type PatientResource,
} from "@/data/resources";

const allResourcesFilter = "All resources";

type ResourceDirectoryProps = {
  resources: PatientResource[];
};

export function ResourceDirectory({ resources }: ResourceDirectoryProps) {
  const [selectedCategory, setSelectedCategory] =
    useState(allResourcesFilter);
  const displayedResources = useMemo(
    () =>
      resources.filter(
        (resource) =>
          selectedCategory === allResourcesFilter ||
          resource.category === selectedCategory,
      ),
    [resources, selectedCategory],
  );
  const resultDescription =
    selectedCategory === allResourcesFilter
      ? `Showing all ${displayedResources.length} sample resources`
      : `Showing ${displayedResources.length} sample ${
          displayedResources.length === 1 ? "resource" : "resources"
        } in ${selectedCategory}`;

  return (
    <>
      <div className="rounded-2xl border border-white/[0.09] bg-brand-panel p-5 sm:p-6">
        <p
          id="resource-filter-label"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold"
        >
          Choose a category
        </p>
        <div
          role="group"
          aria-labelledby="resource-filter-label"
          className="mt-4 flex flex-wrap gap-2"
        >
          {[allResourcesFilter, ...resourceCategories].map((category) => {
            const isSelected = category === selectedCategory;

            return (
              <button
                key={category}
                type="button"
                aria-pressed={isSelected}
                aria-controls="resource-results"
                onClick={() => setSelectedCategory(category)}
                className={`min-h-11 rounded-full border px-5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-panel ${
                  isSelected
                    ? "border-brand-gold bg-brand-gold text-brand-ink"
                    : "border-white/[0.12] bg-white/[0.03] text-brand-cream hover:border-brand-gold/50 hover:text-brand-gold"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      <p
        aria-live="polite"
        className="mt-6 text-sm leading-6 text-brand-muted"
      >
        {resultDescription}
      </p>

      <div
        id="resource-results"
        className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {displayedResources.map((resource) => (
          <ResourceLibraryCard key={resource.slug} resource={resource} />
        ))}
      </div>
    </>
  );
}
