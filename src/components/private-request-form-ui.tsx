"use client";

import {
  CheckCircle2,
  RotateCcw,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import type { ReactNode } from "react";

import type { PatientRequestMode } from "@/data/patient-requests";

export const privateRequestInputClassName =
  "mt-2 min-h-12 min-w-0 w-full rounded-xl border border-white/[0.12] bg-background/70 px-4 py-3 text-base text-brand-cream outline-none transition-colors placeholder:text-brand-muted/60 focus:border-brand-gold focus:ring-2 focus:ring-brand-gold/20 disabled:cursor-not-allowed disabled:opacity-50";

const submittedAtFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
  timeZone: "America/New_York",
});

export type PrivateRequestSubmissionResult = {
  ok?: unknown;
  test?: unknown;
  receipt?: unknown;
  submittedAt?: unknown;
  message?: unknown;
};

export function PatientRequestFormFrame({
  mode,
  headingId,
  title,
  description,
  unavailableMessage,
  children,
}: {
  mode: PatientRequestMode;
  headingId: string;
  title: string;
  description: string;
  unavailableMessage: string;
  children: ReactNode;
}) {
  return (
    <div className="scroll-mt-28 rounded-2xl border border-brand-gold/25 bg-brand-panel p-6 shadow-[0_24px_80px_rgba(0,0,0,0.25)] sm:p-8">
      <div className="flex flex-col gap-5 border-b border-white/[0.08] pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
            {mode === "test"
              ? "Demonstration mode"
              : "Private Hillside workflow"}
          </p>
          <h2
            id={headingId}
            className="mt-3 text-3xl font-semibold tracking-tight text-brand-cream"
          >
            {title}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-brand-muted">
            {mode === "unavailable" ? unavailableMessage : description}
          </p>
        </div>
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-brand-gold/25 bg-brand-gold/[0.07] px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold">
          <ShieldCheck className="size-4" aria-hidden="true" />
          {mode === "live"
            ? "Private submission"
            : mode === "test"
              ? "No data saved"
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
            The form reaches the website&apos;s validation route, but test
            submissions are not forwarded to Google Sheets or retained.
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
            Submit only the information needed for this request. It will be
            recorded in a restricted Hillside management spreadsheet.
          </p>
        </div>
      ) : null}

      {mode === "unavailable" ? (
        <div className="mt-8 rounded-xl border border-white/[0.09] bg-white/[0.025] p-5">
          <p className="font-semibold text-brand-cream">
            Continue using the current paper process
          </p>
          <p className="mt-2 text-sm leading-6 text-brand-muted">
            The online form is safely disabled until its private destination,
            management permissions, and retention policy are configured.
          </p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export function PatientRequestSubmissionReceipt({
  title,
  recipient,
  receipt,
  submittedAt,
  isTest,
  onReset,
}: {
  title: string;
  recipient: string;
  receipt: string;
  submittedAt: string;
  isTest: boolean;
  onReset: () => void;
}) {
  const visibleSubmittedAt = Number.isNaN(Date.parse(submittedAt))
    ? ""
    : submittedAtFormatter.format(new Date(submittedAt));

  return (
    <div className="mt-8 text-center" role="status" aria-live="polite">
      <span className="mx-auto flex size-16 items-center justify-center rounded-full border border-brand-gold/30 bg-brand-gold/[0.08] text-brand-gold">
        <CheckCircle2 className="size-8" aria-hidden="true" />
      </span>
      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-brand-gold">
        {isTest ? "Test submission complete" : "Request recorded"}
      </p>
      <h3 className="mt-3 text-3xl font-semibold text-brand-cream">
        {title}
      </h3>
      <p className="mx-auto mt-4 max-w-xl leading-7 text-brand-muted">
        {isTest
          ? "The request passed local validation but was not sent to Google Sheets or retained."
          : `${recipient} can now review the request in the restricted management spreadsheet.`}
      </p>
      <div className="mx-auto mt-6 grid max-w-xl gap-3 sm:grid-cols-2">
        <p className="rounded-xl border border-white/[0.09] bg-white/[0.025] px-5 py-4 font-mono text-sm text-brand-cream">
          Receipt: {receipt}
        </p>
        {visibleSubmittedAt ? (
          <p className="rounded-xl border border-white/[0.09] bg-white/[0.025] px-5 py-4 text-sm text-brand-cream">
            Recorded: {visibleSubmittedAt}
          </p>
        ) : null}
      </div>
      <button
        type="button"
        onClick={onReset}
        className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-brand-gold/25 px-5 py-3 text-sm font-semibold text-brand-gold transition-colors hover:bg-brand-gold/[0.07]"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        Start another request
      </button>
    </div>
  );
}
