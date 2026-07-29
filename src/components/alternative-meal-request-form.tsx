"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  Send,
  ShieldCheck,
  TriangleAlert,
  UtensilsCrossed,
} from "lucide-react";
import { useRef, useState } from "react";

import { programMealTimes, type MealKey } from "@/data/master-schedule";
import {
  mealOrderCutoffLabel,
  mealOrderCutoffMinutes,
  mealOrderRetentionDays,
  type MealOrderMode,
} from "@/data/meal-orders";
import {
  alternativeMenuSections,
  burgerBaconSelection,
  getAlternativeMenuSelectionError,
  getAlternativeMenuSelectionLabel,
  glutenFreeRequestOptions,
  grilledCheeseAddOnOptions,
  grilledCheeseBreadOptions,
  grilledCheeseCheeseOptions,
} from "@/data/menu";
import type { ProgramCode } from "@/types/hillside-data";

const targetDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "America/New_York",
});

const submissionDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
  timeZone: "America/New_York",
});

const inputClassName =
  "mt-2 min-h-12 w-full rounded-xl border border-white/[0.12] bg-background/70 px-4 py-3 text-base text-brand-cream outline-none transition-colors placeholder:text-brand-muted/60 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20";

type RequestableMeal = Extract<MealKey, "lunch" | "dinner">;
type FormStep = "edit" | "review" | "submitted";

type SubmissionResult = {
  ok?: unknown;
  test?: unknown;
  receipt?: unknown;
  submittedAt?: unknown;
  message?: unknown;
};

function isProgramCode(value: string | null): value is ProgramCode {
  return value === "ATS" || value === "CSS";
}

function isRequestableMeal(
  value: string | null,
): value is RequestableMeal {
  return value === "lunch" || value === "dinner";
}

function isIsoDate(value: string | null): value is string {
  return value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getCutoffTime(timeValue: string): string {
  const [hour, minute] = timeValue.split(":").map(Number);
  const cutoffMinutes = hour * 60 + minute - mealOrderCutoffMinutes;
  const cutoffHour = Math.floor(cutoffMinutes / 60);
  const cutoffMinute = cutoffMinutes % 60;
  const period = cutoffHour >= 12 ? "PM" : "AM";
  const visibleHour = cutoffHour % 12 || 12;

  return `${visibleHour}:${cutoffMinute.toString().padStart(2, "0")} ${period}`;
}

export function AlternativeMealRequestForm({
  mode,
}: {
  mode: MealOrderMode;
}) {
  const searchParams = useSearchParams();
  const requestedProgram = searchParams.get("program");
  const requestedDate = searchParams.get("date");
  const requestedMeal = searchParams.get("meal");
  const hasValidMealTarget =
    isProgramCode(requestedProgram) &&
    isIsoDate(requestedDate) &&
    isRequestableMeal(requestedMeal);
  const mealConfiguration = hasValidMealTarget
    ? programMealTimes[requestedProgram].find(
        (meal) => meal.key === requestedMeal,
      )
    : undefined;
  const visibleTargetDate =
    hasValidMealTarget && mealConfiguration
      ? targetDateFormatter.format(
          new Date(`${requestedDate}T12:00:00Z`),
        )
      : "";
  const cutoffTime = mealConfiguration
    ? getCutoffTime(mealConfiguration.timeValue)
    : "";
  const [step, setStep] = useState<FormStep>("edit");
  const [firstName, setFirstName] = useState("");
  const [lastInitial, setLastInitial] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [specialRequests, setSpecialRequests] = useState("");
  const [testDataConfirmed, setTestDataConfirmed] = useState(false);
  const [formError, setFormError] = useState("");
  const [receipt, setReceipt] = useState("");
  const [submittedAt, setSubmittedAt] = useState("");
  const [isTestReceipt, setIsTestReceipt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);

  function moveToTop() {
    requestAnimationFrame(() => {
      regionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function toggleItem(item: string) {
    setSelectedItems((current) => {
      if (!current.includes(item)) {
        return [...current, item];
      }

      let nextItems = current.filter(
        (selectedItem) => selectedItem !== item,
      );

      if (
        (item === "Hamburger" || item === "Cheeseburger") &&
        !nextItems.includes("Hamburger") &&
        !nextItems.includes("Cheeseburger")
      ) {
        nextItems = nextItems.filter(
          (selectedItem) => selectedItem !== burgerBaconSelection,
        );
      }

      if (item === "Grilled cheese") {
        nextItems = nextItems.filter(
          (selectedItem) =>
            !selectedItem.startsWith("Grilled cheese "),
        );
      }

      return nextItems;
    });
  }

  function selectSingleItem(
    options: readonly { value: string }[],
    value: string,
  ) {
    const optionValues = new Set(options.map((option) => option.value));

    setSelectedItems((current) => [
      ...current.filter((item) => !optionValues.has(item)),
      value,
    ]);
  }

  function handleReview() {
    setFormError("");

    if (
      !/^[\p{L}][\p{L}\p{M}' -]{0,39}$/u.test(firstName.trim())
    ) {
      setFormError(
        "Enter the patient’s first name using letters, spaces, apostrophes, or hyphens.",
      );
      return;
    }

    if (!/^\p{L}$/u.test(lastInitial.trim())) {
      setFormError("Enter one letter for the patient’s last initial.");
      return;
    }

    const menuSelectionError =
      getAlternativeMenuSelectionError(selectedItems);

    if (menuSelectionError) {
      setFormError(menuSelectionError);
      return;
    }

    if (mode === "test" && !testDataConfirmed) {
      setFormError(
        "Confirm that you are using synthetic test information only.",
      );
      return;
    }

    setStep("review");
    moveToTop();
  }

  async function submitRequest() {
    if (
      !hasValidMealTarget ||
      !mealConfiguration ||
      isSubmitting
    ) {
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/meal-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName,
          lastInitial,
          program: requestedProgram,
          targetDate: requestedDate,
          meal: requestedMeal,
          items: selectedItems,
          specialRequests,
        }),
      });
      const result = (await response.json()) as SubmissionResult;

      if (
        !response.ok ||
        result.ok !== true ||
        typeof result.receipt !== "string" ||
        typeof result.submittedAt !== "string"
      ) {
        setFormError(
          typeof result.message === "string"
            ? result.message
            : "The request could not be recorded. Please use the paper request sheet and tell RS staff.",
        );
        return;
      }

      setReceipt(result.receipt);
      setSubmittedAt(result.submittedAt);
      setIsTestReceipt(result.test === true);
      setStep("submitted");
      moveToTop();
    } catch {
      setFormError(
        "The request could not be recorded. Please use the paper request sheet and tell RS staff.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setFirstName("");
    setLastInitial("");
    setSelectedItems([]);
    setSpecialRequests("");
    setTestDataConfirmed(false);
    setFormError("");
    setReceipt("");
    setSubmittedAt("");
    setIsTestReceipt(false);
    setStep("edit");
    moveToTop();
  }

  const isUnavailable = mode === "unavailable";
  const hasBurger =
    selectedItems.includes("Hamburger") ||
    selectedItems.includes("Cheeseburger");
  const hasGrilledCheese = selectedItems.includes("Grilled cheese");

  return (
    <div
      ref={regionRef}
      className="scroll-mt-28 rounded-2xl border border-brand-gold/25 bg-brand-panel p-6 shadow-[0_24px_80px_rgba(0,0,0,0.25)] sm:p-8"
    >
      <div className="flex flex-col gap-5 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
            {mode === "test"
              ? "Local functional prototype"
              : "Private meal workflow"}
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-brand-cream">
            Alternative meal request
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-muted">
            {isUnavailable
              ? "Online requests will open after the private order sheet and server-only connection are configured."
              : `Submit an alternative lunch or dinner at least ${mealOrderCutoffLabel} before it is served.`}
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-gold/25 bg-brand-gold/[0.07] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold">
          <ShieldCheck className="size-4" aria-hidden="true" />
          {mode === "live"
            ? "Private order sheet"
            : mode === "test"
              ? "Development only"
              : "Not active"}
        </span>
      </div>

      {mode === "test" ? (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-amber-300/25 bg-amber-200/[0.06] px-4 py-4 text-sm leading-6 text-brand-muted">
          <TriangleAlert
            className="mt-0.5 size-5 shrink-0 text-amber-200"
            aria-hidden="true"
          />
          <p>
            <strong className="font-semibold text-brand-cream">
              Use synthetic information only.
            </strong>{" "}
            Test submissions receive a receipt but are not sent to Google
            Sheets or retained.
          </p>
        </div>
      ) : null}

      {mode === "live" ? (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-brand-gold/20 bg-brand-gold/[0.05] px-4 py-4 text-sm leading-6 text-brand-muted">
          <ShieldCheck
            className="mt-0.5 size-5 shrink-0 text-brand-gold"
            aria-hidden="true"
          />
          <p>
            Requests are sent to Hillside&apos;s private order sheet and
            automatically deleted {mealOrderRetentionDays} days after the
            requested meal.
          </p>
        </div>
      ) : null}

      {!hasValidMealTarget || !mealConfiguration ? (
        <div className="mt-8 rounded-xl border border-amber-300/25 bg-amber-200/[0.06] px-5 py-5">
          <p className="font-semibold text-brand-cream">
            Choose a specific lunch or dinner first
          </p>
          <p className="mt-2 text-sm leading-6 text-brand-muted">
            Requests must begin from the corresponding meal in Master
            Schedule so its program, date, serving time, and deadline are
            attached correctly.
          </p>
          <Link
            href="/master-schedule"
            className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand-gold/30 px-4 py-2 text-sm font-semibold text-brand-gold transition-colors hover:bg-brand-gold/[0.07]"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Return to Master Schedule
          </Link>
        </div>
      ) : null}

      {hasValidMealTarget && mealConfiguration ? (
        <>
          <div className="mt-8 rounded-xl border border-brand-gold/30 bg-brand-gold/[0.07] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
              Requested meal
            </p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-4">
              {[
                ["Program", requestedProgram],
                ["Meal", mealConfiguration.label],
                ["Serving time", mealConfiguration.time],
                ["Order deadline", cutoffTime],
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">
                    {label}
                  </dt>
                  <dd className="mt-1.5 font-semibold text-brand-cream">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm leading-6 text-brand-muted">
              {visibleTargetDate}. This information came from Master Schedule
              and cannot be changed inside the request.
            </p>
          </div>

          {isUnavailable ? (
            <div className="mt-8 rounded-xl border border-white/[0.09] bg-white/[0.025] p-5">
              <p className="font-semibold text-brand-cream">
                Continue using the paper request sheet
              </p>
              <p className="mt-2 text-sm leading-6 text-brand-muted">
                The online form is safely disabled until its private
                destination and server-only connection are configured.
              </p>
            </div>
          ) : null}

          {!isUnavailable && step === "edit" ? (
            <form
              aria-label="Alternative meal request"
              className="mt-8"
              onSubmit={(event) => {
                event.preventDefault();
                handleReview();
              }}
            >
              <fieldset>
                <legend className="text-sm font-semibold text-brand-cream">
                  Patient identifier
                </legend>
                <p className="mt-2 text-sm leading-6 text-brand-muted">
                  Use the patient&apos;s first name and last initial only.
                </p>
                <div className="mt-4 grid max-w-2xl gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
                  <label className="text-sm font-semibold text-brand-cream">
                    First name
                    <span className="ml-2 text-brand-gold">Required</span>
                    <input
                      type="text"
                      autoComplete="off"
                      maxLength={40}
                      required
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      className={inputClassName}
                    />
                  </label>
                  <label className="text-sm font-semibold text-brand-cream">
                    Last initial
                    <span className="ml-2 text-brand-gold">Required</span>
                    <input
                      type="text"
                      autoComplete="off"
                      inputMode="text"
                      maxLength={1}
                      required
                      value={lastInitial}
                      onChange={(event) =>
                        setLastInitial(event.target.value.toUpperCase())
                      }
                      className={inputClassName}
                    />
                  </label>
                </div>
              </fieldset>

              <fieldset className="mt-8">
                <legend className="text-sm font-semibold text-brand-cream">
                  Alternative-menu items
                  <span className="ml-2 text-brand-gold">Required</span>
                </legend>
                <p className="mt-2 text-sm leading-6 text-brand-muted">
                  Choose one or more items.
                </p>
                <div className="mt-5 space-y-6">
                  {alternativeMenuSections.map((section) => (
                    <div key={section.id}>
                      <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-gold">
                        {section.title}
                      </h3>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {section.options.map((option) => {
                          const isSelected = selectedItems.includes(
                            option.value,
                          );

                          return (
                            <label
                              key={option.value}
                              className={`flex min-h-16 cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                                isSelected
                                  ? "border-brand-gold/45 bg-brand-gold/[0.09] text-brand-cream"
                                  : "border-white/[0.09] bg-white/[0.025] text-brand-muted hover:border-brand-gold/25"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() =>
                                  toggleItem(option.value)
                                }
                                className="mt-1 size-4 shrink-0 accent-brand-gold"
                              />
                              <span>
                                <span className="block font-semibold">
                                  {option.label}
                                </span>
                                {"note" in option && option.note ? (
                                  <span className="mt-1 block text-xs leading-5 text-brand-muted">
                                    {option.note}
                                  </span>
                                ) : null}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </fieldset>

              {hasBurger ? (
                <fieldset className="mt-6 rounded-xl border border-white/[0.09] bg-white/[0.025] p-4">
                  <legend className="px-2 text-sm font-semibold text-brand-cream">
                    Burger options
                  </legend>
                  <label className="mt-2 flex min-h-11 cursor-pointer items-center gap-3 text-sm text-brand-muted">
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(
                        burgerBaconSelection,
                      )}
                      onChange={() => toggleItem(burgerBaconSelection)}
                      className="size-4 shrink-0 accent-brand-gold"
                    />
                    Add bacon
                  </label>
                </fieldset>
              ) : null}

              {hasGrilledCheese ? (
                <fieldset className="mt-6 rounded-xl border border-brand-gold/20 bg-brand-gold/[0.035] p-4 sm:p-5">
                  <legend className="px-2 text-sm font-semibold text-brand-cream">
                    Grilled cheese options
                  </legend>
                  <div className="mt-2 grid gap-6 lg:grid-cols-3">
                    <fieldset>
                      <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold">
                        Cheese
                        <span className="ml-2 normal-case tracking-normal text-brand-gold">
                          Required
                        </span>
                      </legend>
                      <div className="mt-3 space-y-2">
                        {grilledCheeseCheeseOptions.map((option) => (
                          <label
                            key={option.value}
                            className="flex min-h-10 cursor-pointer items-center gap-3 text-sm text-brand-muted"
                          >
                            <input
                              type="radio"
                              name="grilled-cheese-cheese"
                              checked={selectedItems.includes(
                                option.value,
                              )}
                              onChange={() =>
                                selectSingleItem(
                                  grilledCheeseCheeseOptions,
                                  option.value,
                                )
                              }
                              className="size-4 shrink-0 accent-brand-gold"
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <fieldset>
                      <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold">
                        Bread
                        <span className="ml-2 normal-case tracking-normal text-brand-gold">
                          Required
                        </span>
                      </legend>
                      <div className="mt-3 space-y-2">
                        {grilledCheeseBreadOptions.map((option) => (
                          <label
                            key={option.value}
                            className="flex min-h-10 cursor-pointer items-center gap-3 text-sm text-brand-muted"
                          >
                            <input
                              type="radio"
                              name="grilled-cheese-bread"
                              checked={selectedItems.includes(
                                option.value,
                              )}
                              onChange={() =>
                                selectSingleItem(
                                  grilledCheeseBreadOptions,
                                  option.value,
                                )
                              }
                              className="size-4 shrink-0 accent-brand-gold"
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>

                    <fieldset>
                      <legend className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold">
                        Add-ons
                        <span className="ml-2 normal-case tracking-normal text-brand-muted">
                          Optional
                        </span>
                      </legend>
                      <div className="mt-3 space-y-2">
                        {grilledCheeseAddOnOptions.map((option) => (
                          <label
                            key={option.value}
                            className="flex min-h-10 cursor-pointer items-center gap-3 text-sm text-brand-muted"
                          >
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(
                                option.value,
                              )}
                              onChange={() => toggleItem(option.value)}
                              className="size-4 shrink-0 accent-brand-gold"
                            />
                            {option.label}
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  </div>
                </fieldset>
              ) : null}

              <fieldset className="mt-6 rounded-xl border border-white/[0.09] bg-white/[0.025] p-4">
                <legend className="px-2 text-sm font-semibold text-brand-cream">
                  Gluten-free requests
                  <span className="ml-2 font-normal text-brand-muted">
                    Optional
                  </span>
                </legend>
                <p className="mt-2 text-sm leading-6 text-brand-muted">
                  Gluten-free bread and snack options are available upon
                  request.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {glutenFreeRequestOptions.map((option) => (
                    <label
                      key={option.value}
                      className="flex min-h-11 cursor-pointer items-center gap-3 text-sm text-brand-muted"
                    >
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(option.value)}
                        onChange={() => toggleItem(option.value)}
                        className="size-4 shrink-0 accent-brand-gold"
                      />
                      {option.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <label className="mt-6 block text-sm font-semibold text-brand-cream">
                Special requests
                <span className="ml-2 font-normal text-brand-muted">
                  Optional
                </span>
                <textarea
                  rows={2}
                  maxLength={200}
                  value={specialRequests}
                  onChange={(event) => setSpecialRequests(event.target.value)}
                  placeholder="Example: no lettuce on the burger"
                  className={`${inputClassName} min-h-24 resize-y`}
                />
              </label>

              <p className="mt-3 max-w-3xl text-sm leading-6 text-brand-muted">
                Do not enter allergies, diagnoses, medications, or other
                medical information here. Tell RS or nursing staff directly
                about medical or allergy-related dietary needs.
              </p>

              {mode === "test" ? (
                <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.09] bg-white/[0.025] px-4 py-4 text-sm leading-6 text-brand-muted">
                  <input
                    type="checkbox"
                    checked={testDataConfirmed}
                    onChange={(event) =>
                      setTestDataConfirmed(event.target.checked)
                    }
                    className="mt-1 size-4 shrink-0 accent-brand-gold"
                  />
                  I confirm that I am using synthetic test information and not
                  a real patient&apos;s information.
                </label>
              ) : null}

              {formError ? (
                <p
                  role="alert"
                  className="mt-6 flex items-start gap-2 rounded-xl border border-red-300/25 bg-red-300/[0.06] px-4 py-3 text-sm leading-6 text-red-100"
                >
                  <TriangleAlert
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  {formError}
                </p>
              ) : null}

              <button
                type="submit"
                className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-gold px-5 py-3 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-gold-light"
              >
                Review request
                <Send className="size-4" aria-hidden="true" />
              </button>
            </form>
          ) : null}

          {!isUnavailable && step === "review" ? (
            <div className="mt-8">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
                Final review
              </p>
              <h3 className="mt-3 text-2xl font-semibold text-brand-cream">
                Confirm this meal request
              </h3>

              <dl className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  ["Patient", `${firstName.trim()} ${lastInitial.trim()}.`],
                  ["Program", requestedProgram],
                  ["Meal", mealConfiguration.label],
                  [
                    "Serving time",
                    `${visibleTargetDate} · ${mealConfiguration.time}`,
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4"
                  >
                    <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">
                      {label}
                    </dt>
                    <dd className="mt-2 text-brand-cream">{value}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">
                  Requested items
                </p>
                <ul className="mt-3 flex flex-wrap gap-2">
                  {selectedItems.map((item) => (
                    <li
                      key={item}
                      className="rounded-full border border-brand-gold/20 bg-brand-gold/[0.05] px-3 py-2 text-sm text-brand-cream"
                    >
                      {getAlternativeMenuSelectionLabel(item)}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">
                  Special requests
                </p>
                <p className="mt-3 whitespace-pre-wrap leading-7 text-brand-cream">
                  {specialRequests.trim() || "None"}
                </p>
              </div>

              {formError ? (
                <p
                  role="alert"
                  className="mt-6 flex items-start gap-2 rounded-xl border border-red-300/25 bg-red-300/[0.06] px-4 py-3 text-sm leading-6 text-red-100"
                >
                  <TriangleAlert
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  {formError}
                </p>
              ) : null}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    setFormError("");
                    setStep("edit");
                    moveToTop();
                  }}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/[0.12] px-5 py-3 text-sm font-semibold text-brand-cream transition-colors hover:bg-white/[0.05] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back to edit
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={submitRequest}
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-gold px-5 py-3 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-gold-light disabled:cursor-wait disabled:opacity-60"
                >
                  {isSubmitting
                    ? "Recording request…"
                    : mode === "test"
                      ? "Submit test request"
                      : "Submit meal request"}
                  <UtensilsCrossed className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          ) : null}

          {!isUnavailable && step === "submitted" ? (
            <div
              className="mt-8 text-center"
              role="status"
              aria-live="polite"
            >
              <span className="mx-auto flex size-16 items-center justify-center rounded-full border border-brand-gold/30 bg-brand-gold/[0.08] text-brand-gold">
                <CheckCircle2 className="size-8" aria-hidden="true" />
              </span>
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
                {isTestReceipt
                  ? "Test submission complete"
                  : "Request recorded"}
              </p>
              <h3 className="mt-3 text-3xl font-semibold text-brand-cream">
                {isTestReceipt
                  ? "The meal-request flow worked"
                  : "Your alternative meal request was received"}
              </h3>
              <p className="mx-auto mt-4 max-w-xl leading-7 text-brand-muted">
                {isTestReceipt
                  ? "No information was sent to Google Sheets or stored."
                  : `The request is attached to ${requestedProgram} ${mealConfiguration.label.toLowerCase()} on ${visibleTargetDate}.`}
              </p>
              <p className="mx-auto mt-6 w-fit rounded-xl border border-white/[0.09] bg-white/[0.025] px-5 py-4 font-mono text-sm text-brand-cream">
                Receipt: {receipt}
              </p>
              <p className="mx-auto mt-3 w-fit rounded-xl border border-white/[0.09] bg-white/[0.025] px-5 py-4 text-sm text-brand-cream">
                Recorded automatically:{" "}
                {submissionDateFormatter.format(new Date(submittedAt))}
              </p>
              <button
                type="button"
                onClick={resetForm}
                className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-brand-gold/25 px-5 py-3 text-sm font-semibold text-brand-gold transition-colors hover:bg-brand-gold/[0.07]"
              >
                <RotateCcw className="size-4" aria-hidden="true" />
                Start another request
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
