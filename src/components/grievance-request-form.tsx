"use client";

import { ArrowLeft, Paperclip, Send } from "lucide-react";
import { useRef, useState } from "react";

import {
  PatientRequestFormFrame,
  PatientRequestSubmissionReceipt,
  privateRequestInputClassName,
  type PrivateRequestSubmissionResult,
} from "@/components/private-request-form-ui";
import type { PatientRequestMode } from "@/data/patient-requests";

type FormStep = "edit" | "review" | "submitted";

type FormValues = {
  firstName: string;
  lastInitial: string;
  grievance: string;
  incidentDate: string;
  incidentTime: string;
  staffMembers: string;
};

const emptyValues: FormValues = {
  firstName: "",
  lastInitial: "",
  grievance: "",
  incidentDate: "",
  incidentTime: "",
  staffMembers: "",
};

export function GrievanceRequestForm({
  mode,
}: {
  mode: PatientRequestMode;
}) {
  const [step, setStep] = useState<FormStep>("edit");
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [testDataConfirmed, setTestDataConfirmed] = useState(false);
  const [formError, setFormError] = useState("");
  const [receipt, setReceipt] = useState("");
  const [submittedAt, setSubmittedAt] = useState("");
  const [isTestReceipt, setIsTestReceipt] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const regionRef = useRef<HTMLDivElement>(null);

  function updateValue(field: keyof FormValues, value: string) {
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
    const firstName = values.firstName.trim();
    const lastInitial = values.lastInitial.trim();

    if (
      (firstName || lastInitial) &&
      (!/^[\p{L}][\p{L}\p{M}' -]{0,39}$/u.test(firstName) ||
        !/^\p{L}$/u.test(lastInitial))
    ) {
      setFormError(
        "For an identified grievance, enter a first name and one-letter last initial. Leave both blank to submit without a name.",
      );
      return;
    }

    if (!values.grievance.trim()) {
      setFormError("Enter the grievance description.");
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
          kind: "grievance",
          ...values,
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
            : "The grievance could not be safely recorded. Please use the current paper process and tell staff.",
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
        "The grievance could not be safely recorded. Please use the current paper process and tell staff.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setValues(emptyValues);
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
        headingId="grievance-form-heading"
        title="Submit a grievance"
        description="Submit a private grievance for management review. Providing a name is optional."
        unavailableMessage="Online grievances will open after the private management workbook, access restrictions, and retention policy are approved."
      >
        {step === "edit" ? (
          <form
            aria-labelledby="grievance-form-heading"
            className="mt-8"
            onSubmit={(event) => {
              event.preventDefault();
              handleReview();
            }}
          >
            <fieldset>
              <legend className="text-sm font-semibold text-brand-cream">
                Patient identifier
                <span className="ml-2 font-normal text-brand-muted">
                  Optional
                </span>
              </legend>
              <p className="mt-2 text-sm leading-6 text-brand-muted">
                Leave both fields blank to submit without a name. Otherwise,
                use a first name and last initial only.
              </p>
              <div className="mt-4 grid max-w-2xl gap-4 sm:grid-cols-[minmax(0,1fr)_10rem]">
                <label className="text-sm font-semibold text-brand-cream">
                  First name
                  <input
                    type="text"
                    autoComplete="off"
                    maxLength={40}
                    value={values.firstName}
                    onChange={(event) =>
                      updateValue("firstName", event.target.value)
                    }
                    className={privateRequestInputClassName}
                  />
                </label>
                <label className="text-sm font-semibold text-brand-cream">
                  Last initial
                  <input
                    type="text"
                    autoComplete="off"
                    maxLength={1}
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

            <div className="mt-8 grid max-w-2xl gap-6">
              <label className="text-sm font-semibold text-brand-cream">
                Staff members involved
                <span className="ml-2 font-normal text-brand-muted">
                  Optional
                </span>
                <input
                  type="text"
                  autoComplete="off"
                  maxLength={300}
                  value={values.staffMembers}
                  onChange={(event) =>
                    updateValue("staffMembers", event.target.value)
                  }
                  className={privateRequestInputClassName}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="min-w-0 text-sm font-semibold text-brand-cream">
                  Date
                  <span className="ml-2 font-normal text-brand-muted">
                    Optional
                  </span>
                  <input
                    type="date"
                    value={values.incidentDate}
                    onChange={(event) =>
                      updateValue("incidentDate", event.target.value)
                    }
                    className={`${privateRequestInputClassName} [color-scheme:dark]`}
                  />
                </label>
                <label className="min-w-0 text-sm font-semibold text-brand-cream">
                  Time
                  <span className="ml-2 font-normal text-brand-muted">
                    Optional
                  </span>
                  <input
                    type="time"
                    value={values.incidentTime}
                    onChange={(event) =>
                      updateValue("incidentTime", event.target.value)
                    }
                    className={`${privateRequestInputClassName} [color-scheme:dark]`}
                  />
                </label>
              </div>
            </div>

            <label className="mt-6 block text-sm font-semibold text-brand-cream">
              Tell us about the grievance
              <span className="ml-2 text-brand-gold">Required</span>
              <span className="mt-2 block font-normal leading-6 text-brand-muted">
                Include the date, time, or staff involved when relevant. Those
                details are suggested, not required.
              </span>
              <textarea
                required
                maxLength={4_000}
                value={values.grievance}
                onChange={(event) =>
                  updateValue("grievance", event.target.value)
                }
                className={`${privateRequestInputClassName} min-h-44 resize-y`}
              />
            </label>

            <div className="mt-6 flex items-start gap-3 rounded-xl border border-white/[0.09] bg-white/[0.025] p-4 text-sm leading-6 text-brand-muted">
              <Paperclip
                className="mt-0.5 size-5 shrink-0 text-brand-gold"
                aria-hidden="true"
              />
              <p>
                Attachments are not enabled in this first secure version.
                Supporting material can be provided directly to the grievance
                reviewer during follow-up.
              </p>
            </div>

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
                Review grievance
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
              Check the grievance before submitting
            </h3>

            <dl className="mt-7 grid gap-4 sm:grid-cols-2">
              {[
                [
                  "Patient identifier",
                  values.firstName
                    ? `${values.firstName.trim()} ${values.lastInitial
                        .trim()
                        .toUpperCase()}.`
                    : "Not provided",
                ],
                ["Staff involved", values.staffMembers || "Not provided"],
                ["Incident date", values.incidentDate || "Not provided"],
                ["Incident time", values.incidentTime || "Not provided"],
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
              <h4 className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">
                Grievance
              </h4>
              <p className="mt-3 whitespace-pre-wrap leading-7 text-brand-cream">
                {values.grievance.trim()}
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
                {isSubmitting ? "Recording…" : "Submit grievance"}
                <Send className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : null}

        {step === "submitted" ? (
          <PatientRequestSubmissionReceipt
            title="The grievance was submitted"
            recipient="the approved grievance reviewer"
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
