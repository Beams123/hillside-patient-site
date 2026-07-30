"use client";

import { ArrowLeft, Plus, Send, UserRoundCheck, X } from "lucide-react";
import { useRef, useState } from "react";

import {
  PatientRequestFormFrame,
  PatientRequestSubmissionReceipt,
  privateRequestInputClassName,
  type PrivateRequestSubmissionResult,
} from "@/components/private-request-form-ui";
import {
  allowedVisitationDays,
  type PatientRequestMode,
  visitationWindow,
} from "@/data/patient-requests";

type FormStep = "edit" | "review" | "submitted";

type Visitor = {
  id: string;
  name: string;
  relationship: string;
};

function createVisitor(id = crypto.randomUUID()): Visitor {
  return { id, name: "", relationship: "" };
}

function getFacilityDateValue(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
}

function getVisitDateError(visitDate: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(visitDate)) {
    return "Choose an available visitation date.";
  }

  const parsedDate = new Date(`${visitDate}T12:00:00Z`);
  const todayValue = getFacilityDateValue(new Date());
  const latestDate = new Date(`${todayValue}T12:00:00Z`);
  latestDate.setUTCDate(latestDate.getUTCDate() + 35);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    visitDate < todayValue ||
    parsedDate.getTime() > latestDate.getTime() ||
    ![0, 2, 4, 6].includes(parsedDate.getUTCDay())
  ) {
    return "Choose a Tuesday, Thursday, Saturday, or Sunday within the next five weeks.";
  }

  return "";
}

function formatVisitDate(visitDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${visitDate}T12:00:00Z`));
}

export function VisitorRequestForm({
  mode,
}: {
  mode: PatientRequestMode;
}) {
  const [step, setStep] = useState<FormStep>("edit");
  const [firstName, setFirstName] = useState("");
  const [lastInitial, setLastInitial] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [visitors, setVisitors] = useState<Visitor[]>([
    createVisitor("visitor-1"),
  ]);
  const [visitTypeConfirmed, setVisitTypeConfirmed] = useState(false);
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

  function updateVisitor(
    visitorId: string,
    field: "name" | "relationship",
    value: string,
  ) {
    setVisitors((current) =>
      current.map((visitor) =>
        visitor.id === visitorId
          ? { ...visitor, [field]: value }
          : visitor,
      ),
    );
  }

  function addVisitor() {
    if (visitors.length < 4) {
      setVisitors((current) => [...current, createVisitor()]);
    }
  }

  function removeVisitor(visitorId: string) {
    setVisitors((current) =>
      current.filter((visitor) => visitor.id !== visitorId),
    );
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

    const visitDateError = getVisitDateError(visitDate);

    if (visitDateError) {
      setFormError(visitDateError);
      return;
    }

    if (
      visitors.some(
        (visitor) =>
          !visitor.name.trim() || !visitor.relationship.trim(),
      )
    ) {
      setFormError(
        "Enter a name and relationship for every visitor.",
      );
      return;
    }

    if (!visitTypeConfirmed) {
      setFormError(
        "Confirm that this request is for a family visit.",
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
          kind: "visitor",
          firstName,
          lastInitial,
          visitDate,
          visitors: visitors.map(({ name, relationship }) => ({
            name,
            relationship,
          })),
          visitTypeConfirmed,
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
            : "The visitor request could not be safely recorded. Please use the current paper process and tell staff.",
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
        "The visitor request could not be safely recorded. Please use the current paper process and tell staff.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForm() {
    setFirstName("");
    setLastInitial("");
    setVisitDate("");
    setVisitors([createVisitor()]);
    setVisitTypeConfirmed(false);
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
        headingId="visitor-request-form-heading"
        title="Request a family visit"
        description="Choose an available date and send the visitor list to the private management-review spreadsheet."
        unavailableMessage="Online visitor requests will open after the private management workbook, reviewer permissions, and retention policy are approved."
      >
        {step === "edit" ? (
          <form
            aria-labelledby="visitor-request-form-heading"
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
                    value={lastInitial}
                    onChange={(event) =>
                      setLastInitial(event.target.value.toUpperCase())
                    }
                    className={privateRequestInputClassName}
                  />
                </label>
              </div>
            </fieldset>

            <label className="mt-8 block max-w-md text-sm font-semibold text-brand-cream">
              Visitation date
              <span className="ml-2 text-brand-gold">Required</span>
              <input
                type="date"
                required
                value={visitDate}
                onChange={(event) => setVisitDate(event.target.value)}
                className={`${privateRequestInputClassName} [color-scheme:dark]`}
              />
              <span className="mt-2 block font-normal leading-6 text-brand-muted">
                Available {allowedVisitationDays.join(", ")} from{" "}
                {visitationWindow}.
              </span>
            </label>

            <div className="mt-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-brand-cream">
                    Visitors
                  </p>
                  <p className="mt-1 text-sm text-brand-muted">
                    Add up to four visitors.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addVisitor}
                  disabled={visitors.length >= 4}
                  className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-brand-gold/25 px-4 py-2 text-sm font-semibold text-brand-gold transition-colors hover:bg-brand-gold/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add visitor
                </button>
              </div>

              <div className="mt-4 space-y-4">
                {visitors.map((visitor, index) => (
                  <fieldset
                    key={visitor.id}
                    className="relative rounded-xl border border-white/[0.09] bg-white/[0.025] p-4"
                  >
                    <legend className="pr-12 text-sm font-semibold text-brand-cream">
                      Visitor {index + 1}
                    </legend>
                    {visitors.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeVisitor(visitor.id)}
                        aria-label={`Remove visitor ${index + 1}`}
                        className="absolute right-4 top-3 flex size-9 items-center justify-center rounded-lg text-brand-muted transition-colors hover:bg-white/[0.06] hover:text-brand-cream"
                      >
                        <X className="size-4" aria-hidden="true" />
                      </button>
                    ) : null}
                    <div className="mt-3 grid gap-4 sm:grid-cols-2">
                      <label className="text-sm font-semibold text-brand-cream">
                        Visitor name
                        <input
                          type="text"
                          autoComplete="off"
                          maxLength={80}
                          required
                          value={visitor.name}
                          onChange={(event) =>
                            updateVisitor(
                              visitor.id,
                              "name",
                              event.target.value,
                            )
                          }
                          className={privateRequestInputClassName}
                        />
                      </label>
                      <label className="text-sm font-semibold text-brand-cream">
                        Relationship
                        <input
                          type="text"
                          autoComplete="off"
                          maxLength={80}
                          required
                          value={visitor.relationship}
                          onChange={(event) =>
                            updateVisitor(
                              visitor.id,
                              "relationship",
                              event.target.value,
                            )
                          }
                          placeholder="Example: sibling"
                          className={privateRequestInputClassName}
                        />
                      </label>
                    </div>
                  </fieldset>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-brand-gold/20 bg-brand-gold/[0.05] p-4 text-sm leading-6 text-brand-muted">
              <p className="font-semibold text-brand-cream">
                Family visit and family session
              </p>
              <p className="mt-2">
                A family visit is regular visitation during an available
                window. A family session is a separate meeting with the care
                team to discuss treatment progress and aftercare plans.
              </p>
              <label className="mt-4 flex cursor-pointer items-start gap-3 border-t border-brand-gold/15 pt-4">
                <input
                  type="checkbox"
                  checked={visitTypeConfirmed}
                  onChange={(event) =>
                    setVisitTypeConfirmed(event.target.checked)
                  }
                  className="mt-1 size-4 shrink-0 accent-brand-gold"
                />
                <span>
                  I understand that this request is for a family visit, not a
                  family session.
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
                Review visitor request
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
              Check the visitor request
            </h3>

            <dl className="mt-7 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">
                  Patient
                </dt>
                <dd className="mt-2 text-brand-cream">
                  {firstName.trim()} {lastInitial.trim().toUpperCase()}.
                </dd>
              </div>
              <div className="rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">
                  Visitation time
                </dt>
                <dd className="mt-2 text-brand-cream">
                  {formatVisitDate(visitDate)} · {visitationWindow}
                </dd>
              </div>
            </dl>

            <div className="mt-4 rounded-xl border border-white/[0.08] bg-white/[0.025] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-muted">
                Visitors
              </p>
              <ul className="mt-3 space-y-3">
                {visitors.map((visitor, index) => (
                  <li
                    key={visitor.id}
                    className="flex items-center gap-3 text-brand-cream"
                  >
                    <span className="flex size-8 items-center justify-center rounded-full border border-brand-gold/25 text-xs font-semibold text-brand-gold">
                      {index + 1}
                    </span>
                    {visitor.name} · {visitor.relationship}
                  </li>
                ))}
              </ul>
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
                {isSubmitting ? "Recording…" : "Submit visitor request"}
                <UserRoundCheck className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ) : null}

        {step === "submitted" ? (
          <PatientRequestSubmissionReceipt
            title="The visitor request was submitted"
            recipient="approved management reviewers"
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
