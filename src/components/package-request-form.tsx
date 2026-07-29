"use client";

import { ArrowLeft, PackageCheck, Send } from "lucide-react";
import { useRef, useState } from "react";

import {
  PatientRequestFormFrame,
  PatientRequestSubmissionReceipt,
  privateRequestInputClassName,
  type PrivateRequestSubmissionResult,
} from "@/components/private-request-form-ui";
import type { PatientRequestMode } from "@/data/patient-requests";

type FormStep = "edit" | "review" | "submitted";

type PackageValues = {
  firstName: string;
  lastInitial: string;
  item: string;
  retailer: string;
  quantity: string;
  reason: string;
};

const emptyValues: PackageValues = {
  firstName: "",
  lastInitial: "",
  item: "",
  retailer: "",
  quantity: "1",
  reason: "",
};

export function PackageRequestForm({
  mode,
}: {
  mode: PatientRequestMode;
}) {
  const [step, setStep] = useState<FormStep>("edit");
  const [values, setValues] = useState<PackageValues>(emptyValues);
  const [criteriaConfirmed, setCriteriaConfirmed] = useState(false);
  const [testDataConfirmed, setTestDataConfirmed] = useState(false);
  const [formError, setFormError] = useState("");
  const [receipt, setReceipt] = useState("");
  const [submittedAt, setSubmittedAt] = useState("");
  const [isTestReceipt, setIsTestReceipt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);

  function updateValue(field: keyof PackageValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function moveToTop() {
    requestAnimationFrame(() => {
      regionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }

  function handleReview() {
    setFormError("");

    if (
      !/^[\p{L}][\p{L}\p{M}' -]{0,39}$/u.test(
        values.firstName.trim(),
      )
    ) {
      setFormError(
        "Enter the patient’s first name using letters, spaces, apostrophes, or hyphens.",
      );
      return;
    }

    if (!/^\p{L}$/u.test(values.lastInitial.trim())) {
      setFormError("Enter one letter for the patient’s last initial.");
      return;
    }

    if (
      !values.item.trim() ||
      !values.reason.trim() ||
      !/^\d{1,2}$/.test(values.quantity) ||
      Number(values.quantity) < 1 ||
      Number(values.quantity) > 10
    ) {
      setFormError(
        "Enter the requested item, a quantity from 1–10, and why it is needed.",
      );
      return;
    }

    if (!criteriaConfirmed) {
      setFormError(
        "Confirm that the request meets the working package criteria and has not been ordered yet.",
      );
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
    if (isSubmitting) {
      return;
    }

    setFormError("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/patient-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "package",
          ...values,
          criteriaConfirmed,
        }),
      });
      const result =
        (await response.json()) as PrivateRequestSubmissionResult;

      if (
        !response.ok ||
        result.ok !== true ||
        typeof result.receipt !== "string" ||
        typeof result.submittedAt !== "string"
      ) {
        setFormError(
          typeof result.message === "string"
            ? result.message
            : "The package request could not be safely recorded. Please use the current paper process and tell staff.",
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
        "The package request could not be safely recorded. Please use the current paper process and tell staff.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setValues(emptyValues);
    setCriteriaConfirmed(false);
    setTestDataConfirmed(false);
    setFormError("");
    setReceipt("");
    setSubmittedAt("");
    setIsTestReceipt(false);
    setStep("edit");
    moveToTop();
  }

  return (
    <div ref={regionRef}>
      <PatientRequestFormFrame
        mode={mode}
        headingId="package-request-form-heading"
        title="Request package approval"
        description="Send a package request to the private clinical-leadership review spreadsheet before placing an order."
        unavailableMessage="Online package requests will open after the private clinical-leadership workbook, criteria, and retention policy are approved."
      >
        {step === "edit" ? (
          <form
            aria-labelledby="package-request-form-heading"
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
                    value={values.firstName}
                    onChange={(event) =>
                      updateValue("firstName", event.target.value)
                    }
                    className={privateRequestInputClassName}
                  />
                </label>
                <label className="text-sm font-semibold text-brand-cream">
                  Last initial
                  <span className="ml-2 text-brand-gold">Required</span>
                  <input
                    type="text"
                    autoComplete="off"
                    maxLength={1}
                    required
                    value={values.lastInitial}
                    onChange={(event) =>
                      updateValue(
                        "lastInitial",
                        event.target.value.toUpperCase(),
                      )
                    }
                    className={privateRequestInputClassName}
                  />
                </label>
              </div>
            </fieldset>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <label className="text-sm font-semibold text-brand-cream">
                Requested item
                <span className="ml-2 text-brand-gold">Required</span>
                <input
                  type="text"
                  autoComplete="off"
                  maxLength={200}
                  required
                  value={values.item}
                  onChange={(event) =>
                    updateValue("item", event.target.value)
                  }
                  className={privateRequestInputClassName}
                />
              </label>

              <label className="text-sm font-semibold text-brand-cream">
                Retailer or website
                <span className="ml-2 font-normal text-brand-muted">
                  Optional
                </span>
                <input
                  type="text"
                  autoComplete="off"
                  maxLength={120}
                  value={values.retailer}
                  onChange={(event) =>
                    updateValue("retailer", event.target.value)
                  }
                  placeholder="Example: Amazon"
                  className={privateRequestInputClassName}
                />
              </label>

              <label className="text-sm font-semibold text-brand-cream">
                Quantity
                <span className="ml-2 text-brand-gold">Required</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  inputMode="numeric"
                  required
                  value={values.quantity}
                  onChange={(event) =>
                    updateValue("quantity", event.target.value)
                  }
                  className={privateRequestInputClassName}
                />
              </label>
            </div>

            <label className="mt-6 block text-sm font-semibold text-brand-cream">
              Why is this item needed during the stay?
              <span className="ml-2 text-brand-gold">Required</span>
              <textarea
                required
                maxLength={1_200}
                value={values.reason}
                onChange={(event) =>
                  updateValue("reason", event.target.value)
                }
                className={`${privateRequestInputClassName} min-h-36 resize-y`}
              />
            </label>

            <div className="mt-7 rounded-xl border border-white/[0.09] bg-white/[0.025] p-4">
              <p className="text-sm font-semibold text-brand-cream">
                Working approval criteria
              </p>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-brand-muted">
                <li>Necessary or meaningfully useful during the stay</li>
                <li>Not solely for entertainment</li>
                <li>Reasonable size and quantity for room and storage</li>
                <li>Permitted under Hillside&apos;s approved-item rules</li>
                <li>Not ordered until clinical leadership approves it</li>
              </ul>
              <label className="mt-4 flex cursor-pointer items-start gap-3 border-t border-white/[0.08] pt-4 text-sm leading-6 text-brand-muted">
                <input
                  type="checkbox"
                  checked={criteriaConfirmed}
                  onChange={(event) =>
                    setCriteriaConfirmed(event.target.checked)
                  }
                  className="mt-1 size-4 shrink-0 accent-brand-gold"
                />
                <span>
                  I confirm this request meets the working criteria and the
                  package has not been ordered yet.
                </span>
              </label>
            </div>

            {mode === "test" ? (
              <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-white/[0.09] bg-white/[0.025] px-4 py-4 text-sm leading-6 text-brand-muted">
                <input
                  type="checkbox"
                  checked={testDataConfirmed}
                  onChange={(event) =>
                    setTestDataConfirmed(event.target.checked)
                  }
                  className="mt-1 size-4 shrink-0 accent-brand-gold"
                />
                <span>
                  I confirm that this request contains synthetic test
                  information only.
                </span>
              </label>
            ) : null}

            <p
              aria-live="polite"
              className="mt-4 min-h-6 text-sm font-medium text-red-300"
            >
              {formError}
            </p>

            <div className="mt-4 flex justify-end">
              <button
                type="submit"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-gold px-5 py-3 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-gold-light"
              >
                Review package request
                <Send className="size-4" aria-hidden="true" />
              </button>
            </div>
          </form>
        ) : null}

        {step === "review" ? (
          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-gold">
              Review
            </p>
            <h3 className="mt-2 text-2xl font-semibold text-brand-cream">
              Check the package request
            </h3>

            <dl className="mt-7 grid gap-4 sm:grid-cols-2">
              {[
                [
                  "Patient",
                  `${values.firstName.trim()} ${values.lastInitial
                    .trim()
                    .toUpperCase()}.`,
                ],
                ["Requested item", values.item],
                ["Retailer", values.retailer || "Not provided"],
                ["Quantity", values.quantity],
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
                Reason needed
              </p>
              <p className="mt-3 whitespace-pre-wrap leading-7 text-brand-cream">
                {values.reason}
              </p>
            </div>

            <p
              aria-live="polite"
              className="mt-4 min-h-6 text-sm font-medium text-red-300"
            >
              {formError}
            </p>

            <div className="mt-3 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setStep("edit");
                  moveToTop();
                }}
                disabled={isSubmitting}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/[0.12] px-5 py-3 text-sm font-semibold text-brand-cream transition-colors hover:bg-white/[0.05] disabled:opacity-50"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Back to edit
              </button>
              <button
                type="button"
                onClick={submitRequest}
                disabled={isSubmitting}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-gold px-5 py-3 text-sm font-semibold text-brand-ink transition-colors hover:bg-brand-gold-light disabled:cursor-wait disabled:opacity-60"
              >
                {isSubmitting ? "Recording…" : "Submit for approval"}
                <PackageCheck className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : null}

        {step === "submitted" ? (
          <PatientRequestSubmissionReceipt
            title="The package request was submitted"
            recipient="approved clinical leadership"
            receipt={receipt}
            submittedAt={submittedAt}
            isTest={isTestReceipt}
            onReset={resetForm}
          />
        ) : null}
      </PatientRequestFormFrame>
    </div>
  );
}
