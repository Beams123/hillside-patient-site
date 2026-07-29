"use client";

import { useMemo, useState } from "react";

import { StaffCard } from "@/components/staff-card";
import type { StaffMember } from "@/types/hillside-data";

const allStaffFilter = "All staff";

type StaffDirectoryProps = {
  staff: StaffMember[];
};

export function StaffDirectory({ staff }: StaffDirectoryProps) {
  const departments = useMemo(
    () =>
      Array.from(
        new Set(staff.flatMap((member) => member.departments)),
      ).sort((first, second) => first.localeCompare(second)),
    [staff],
  );
  const [selectedDepartment, setSelectedDepartment] =
    useState(allStaffFilter);
  const displayedStaff = useMemo(
    () =>
      staff
        .filter(
          (member) =>
            selectedDepartment === allStaffFilter ||
            member.departments.includes(selectedDepartment),
        )
        .toSorted((first, second) => first.name.localeCompare(second.name)),
    [selectedDepartment, staff],
  );
  const resultDescription =
    selectedDepartment === allStaffFilter
      ? `Showing all ${displayedStaff.length} staff members`
      : `Showing ${displayedStaff.length} ${
          displayedStaff.length === 1 ? "staff member" : "staff members"
        } in ${selectedDepartment}`;

  return (
    <>
      <div className="rounded-2xl border border-white/[0.09] bg-brand-panel p-5 sm:p-6">
        <p
          id="department-filter-label"
          className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold"
        >
          Choose a department
        </p>
        <div
          role="group"
          aria-labelledby="department-filter-label"
          className="mt-4 flex flex-wrap gap-2"
        >
          {[allStaffFilter, ...departments].map((department) => {
            const isSelected = department === selectedDepartment;

            return (
              <button
                key={department}
                type="button"
                aria-pressed={isSelected}
                aria-controls="staff-results"
                onClick={() => setSelectedDepartment(department)}
                className={`min-h-11 rounded-full border px-5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 focus-visible:ring-offset-brand-panel ${
                  isSelected
                    ? "border-brand-gold bg-brand-gold text-brand-ink"
                    : "border-white/[0.12] bg-white/[0.03] text-brand-cream hover:border-brand-gold/50 hover:text-brand-gold"
                }`}
              >
                {department}
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
        id="staff-results"
        className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
      >
        {displayedStaff.map((member) => (
          <StaffCard key={member.slug} member={member} />
        ))}
      </div>
    </>
  );
}
