import "server-only";

import {
  type PatientRequestKind,
  type PatientRequestMode,
  visitationWindow,
} from "@/data/patient-requests";

export type PatientRequestPayload = {
  kind: unknown;
  firstName: unknown;
  lastInitial: unknown;
  grievance?: unknown;
  incidentDate?: unknown;
  incidentTime?: unknown;
  staffMembers?: unknown;
  item?: unknown;
  retailer?: unknown;
  quantity?: unknown;
  reason?: unknown;
  criteriaConfirmed?: unknown;
  visitDate?: unknown;
  visitors?: unknown;
  visitTypeConfirmed?: unknown;
};

type PatientIdentifier = {
  firstName: string;
  lastInitial: string;
};

export type ValidatedGrievanceRequest = PatientIdentifier & {
  kind: "grievance";
  grievance: string;
  incidentDate: string;
  incidentTime: string;
  staffMembers: string;
};

export type ValidatedPackageRequest = PatientIdentifier & {
  kind: "package";
  item: string;
  retailer: string;
  quantity: number;
  reason: string;
  criteriaConfirmed: true;
};

export type ValidatedVisitorRequest = PatientIdentifier & {
  kind: "visitor";
  visitDate: string;
  visitWindow: typeof visitationWindow;
  visitors: {
    name: string;
    relationship: string;
  }[];
  visitTypeConfirmed: true;
};

export type ValidatedPatientRequest =
  | ValidatedGrievanceRequest
  | ValidatedPackageRequest
  | ValidatedVisitorRequest;

type PatientRequestValidationResult =
  | { ok: true; request: ValidatedPatientRequest }
  | { ok: false; status: number; message: string };

type PatientRequestDestinationResult =
  | { ok: true; receipt: string; submittedAt: string }
  | { ok: false };

const firstNamePattern = /^[\p{L}][\p{L}\p{M}' -]{0,39}$/u;
const lastInitialPattern = /^\p{L}$/u;
const calendarDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
const maximumRequestCharacters = 25_000;
const maximumDestinationResponseCharacters = 2_000;
const maximumFutureVisitDays = 35;
const allowedVisitationDayNumbers = new Set([0, 2, 4, 6]);

function isPatientRequestKind(
  value: unknown,
): value is PatientRequestKind {
  return (
    value === "grievance" ||
    value === "package" ||
    value === "visitor"
  );
}

function normalizeRequiredText(
  value: unknown,
  maximumLength: number,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(/\r\n?/g, "\n");

  return normalized.length > 0 && normalized.length <= maximumLength
    ? normalized
    : null;
}

function normalizeOptionalText(
  value: unknown,
  maximumLength: number,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(/\r\n?/g, "\n");

  return normalized.length <= maximumLength ? normalized : null;
}

function normalizeIdentifierText(
  value: unknown,
  maximumLength: number,
): string | null {
  const normalized = normalizeOptionalText(value, maximumLength);

  return normalized?.replace(/\s+/g, " ") ?? null;
}

function isValidCalendarDate(value: string): boolean {
  if (!calendarDatePattern.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));

  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() === month - 1 &&
    parsed.getUTCDate() === day
  );
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

function readPatientIdentifier(
  payload: PatientRequestPayload,
  optional: boolean,
):
  | { ok: true; identifier: PatientIdentifier }
  | { ok: false; message: string } {
  const firstName = normalizeIdentifierText(payload.firstName, 40);
  const normalizedLastInitial = normalizeIdentifierText(
    payload.lastInitial,
    1,
  );
  const lastInitial = normalizedLastInitial?.toUpperCase() ?? null;

  if (firstName === null || lastInitial === null) {
    return {
      ok: false,
      message: "The patient identifier could not be read.",
    };
  }

  if (optional && firstName.length === 0 && lastInitial.length === 0) {
    return {
      ok: true,
      identifier: { firstName: "", lastInitial: "" },
    };
  }

  if (!firstNamePattern.test(firstName)) {
    return {
      ok: false,
      message:
        "Enter the patient’s first name using letters, spaces, apostrophes, or hyphens.",
    };
  }

  if (!lastInitialPattern.test(lastInitial)) {
    return {
      ok: false,
      message: "Enter one letter for the patient’s last initial.",
    };
  }

  return {
    ok: true,
    identifier: { firstName, lastInitial },
  };
}

function validateGrievance(
  payload: PatientRequestPayload,
): PatientRequestValidationResult {
  const identifierResult = readPatientIdentifier(payload, true);

  if (!identifierResult.ok) {
    return {
      ok: false,
      status: 400,
      message: identifierResult.message,
    };
  }

  const grievance = normalizeRequiredText(payload.grievance, 4_000);
  const incidentDate = normalizeOptionalText(
    payload.incidentDate,
    10,
  );
  const incidentTime = normalizeOptionalText(
    payload.incidentTime,
    5,
  );
  const staffMembers = normalizeOptionalText(
    payload.staffMembers,
    300,
  );

  if (!grievance) {
    return {
      ok: false,
      status: 400,
      message: "Enter the grievance description.",
    };
  }

  if (
    incidentDate === null ||
    (incidentDate.length > 0 && !isValidCalendarDate(incidentDate)) ||
    incidentTime === null ||
    (incidentTime.length > 0 && !timePattern.test(incidentTime)) ||
    staffMembers === null
  ) {
    return {
      ok: false,
      status: 400,
      message:
        "Review the optional incident details and try again.",
    };
  }

  return {
    ok: true,
    request: {
      kind: "grievance",
      ...identifierResult.identifier,
      grievance,
      incidentDate,
      incidentTime,
      staffMembers,
    },
  };
}

function validatePackageRequest(
  payload: PatientRequestPayload,
): PatientRequestValidationResult {
  const identifierResult = readPatientIdentifier(payload, false);

  if (!identifierResult.ok) {
    return {
      ok: false,
      status: 400,
      message: identifierResult.message,
    };
  }

  const item = normalizeRequiredText(payload.item, 200);
  const retailer = normalizeOptionalText(payload.retailer, 120);
  const reason = normalizeRequiredText(payload.reason, 1_200);
  const quantity =
    typeof payload.quantity === "number"
      ? payload.quantity
      : typeof payload.quantity === "string" &&
          /^\d{1,2}$/.test(payload.quantity)
        ? Number(payload.quantity)
        : Number.NaN;

  if (
    !item ||
    retailer === null ||
    !reason ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > 10
  ) {
    return {
      ok: false,
      status: 400,
      message:
        "Enter the requested item, a quantity from 1–10, and why it is needed.",
    };
  }

  if (payload.criteriaConfirmed !== true) {
    return {
      ok: false,
      status: 400,
      message:
        "Confirm that the request meets the working package criteria and has not been ordered yet.",
    };
  }

  return {
    ok: true,
    request: {
      kind: "package",
      ...identifierResult.identifier,
      item,
      retailer,
      quantity,
      reason,
      criteriaConfirmed: true,
    },
  };
}

function validateVisitorRequest(
  payload: PatientRequestPayload,
  now: Date,
): PatientRequestValidationResult {
  const identifierResult = readPatientIdentifier(payload, false);

  if (!identifierResult.ok) {
    return {
      ok: false,
      status: 400,
      message: identifierResult.message,
    };
  }

  if (
    typeof payload.visitDate !== "string" ||
    !isValidCalendarDate(payload.visitDate)
  ) {
    return {
      ok: false,
      status: 400,
      message: "Choose an available visitation date.",
    };
  }

  const visitDate = new Date(`${payload.visitDate}T12:00:00Z`);
  const todayValue = getFacilityDateValue(now);
  const latestDate = new Date(`${todayValue}T12:00:00Z`);
  latestDate.setUTCDate(latestDate.getUTCDate() + maximumFutureVisitDays);

  if (
    payload.visitDate < todayValue ||
    visitDate.getTime() > latestDate.getTime() ||
    !allowedVisitationDayNumbers.has(visitDate.getUTCDay())
  ) {
    return {
      ok: false,
      status: 400,
      message:
        "Choose a Tuesday, Thursday, Saturday, or Sunday within the next five weeks.",
    };
  }

  if (
    !Array.isArray(payload.visitors) ||
    payload.visitors.length < 1 ||
    payload.visitors.length > 4
  ) {
    return {
      ok: false,
      status: 400,
      message: "Add between one and four visitors.",
    };
  }

  const visitors = payload.visitors.map((value) => {
    if (
      typeof value !== "object" ||
      value === null ||
      Array.isArray(value) ||
      !("name" in value) ||
      !("relationship" in value)
    ) {
      return null;
    }

    const name = normalizeRequiredText(value.name, 80);
    const relationship = normalizeRequiredText(
      value.relationship,
      80,
    );

    return name && relationship ? { name, relationship } : null;
  });

  if (
    visitors.some(
      (visitor): visitor is null => visitor === null,
    ) ||
    payload.visitTypeConfirmed !== true
  ) {
    return {
      ok: false,
      status: 400,
      message:
        "Enter a name and relationship for every visitor, then confirm this is a family visit.",
    };
  }

  return {
    ok: true,
    request: {
      kind: "visitor",
      ...identifierResult.identifier,
      visitDate: payload.visitDate,
      visitWindow: visitationWindow,
      visitors: visitors as ValidatedVisitorRequest["visitors"],
      visitTypeConfirmed: true,
    },
  };
}

function hasLiveConfiguration(): boolean {
  return (
    process.env.HILLSIDE_PATIENT_REQUESTS_ENABLED === "true" &&
    isAllowedPatientRequestUrl(
      process.env.HILLSIDE_PATIENT_REQUESTS_WEB_APP_URL,
    ) &&
    Boolean(
      process.env.HILLSIDE_PATIENT_REQUESTS_SHARED_SECRET &&
        process.env.HILLSIDE_PATIENT_REQUESTS_SHARED_SECRET.length >=
          32,
    )
  );
}

export function getPatientRequestMode(): PatientRequestMode {
  if (process.env.HILLSIDE_DEMO_MODE === "true") {
    return "test";
  }

  if (
    process.env.NODE_ENV === "development" &&
    process.env.HILLSIDE_PATIENT_REQUESTS_LOCAL_LIVE_TEST !== "true"
  ) {
    return "test";
  }

  return hasLiveConfiguration() ? "live" : "unavailable";
}

export function getMaximumPatientRequestCharacters(): number {
  return maximumRequestCharacters;
}

export function isAllowedPatientRequestUrl(
  value: string | undefined,
): boolean {
  if (!value) {
    return false;
  }

  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      url.hostname === "script.google.com" &&
      url.pathname.startsWith("/macros/s/") &&
      url.pathname.endsWith("/exec")
    );
  } catch {
    return false;
  }
}

export function validatePatientRequest(
  payload: PatientRequestPayload,
  now = new Date(),
): PatientRequestValidationResult {
  if (!isPatientRequestKind(payload.kind)) {
    return {
      ok: false,
      status: 400,
      message: "The request type is not supported.",
    };
  }

  switch (payload.kind) {
    case "grievance":
      return validateGrievance(payload);
    case "package":
      return validatePackageRequest(payload);
    case "visitor":
      return validateVisitorRequest(payload, now);
  }
}

export async function sendPatientRequestToDestination(
  patientRequest: ValidatedPatientRequest,
): Promise<PatientRequestDestinationResult> {
  const destinationUrl =
    process.env.HILLSIDE_PATIENT_REQUESTS_WEB_APP_URL;
  const sharedSecret =
    process.env.HILLSIDE_PATIENT_REQUESTS_SHARED_SECRET;

  if (
    !destinationUrl ||
    !isAllowedPatientRequestUrl(destinationUrl) ||
    !sharedSecret
  ) {
    return { ok: false };
  }

  try {
    const response = await fetch(destinationUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        apiVersion: 1,
        requestId: crypto.randomUUID(),
        sharedSecret,
        request: patientRequest,
      }),
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(8_000),
    });

    if (!response.ok) {
      return { ok: false };
    }

    const responseText = await response.text();

    if (responseText.length > maximumDestinationResponseCharacters) {
      return { ok: false };
    }

    const value: unknown = JSON.parse(responseText);

    if (
      typeof value !== "object" ||
      value === null ||
      !("ok" in value) ||
      value.ok !== true ||
      !("receipt" in value) ||
      typeof value.receipt !== "string" ||
      !/^(?:GRV|PKG|VIS)-[A-Z0-9-]{8,40}$/.test(value.receipt) ||
      !("submittedAt" in value) ||
      typeof value.submittedAt !== "string" ||
      Number.isNaN(Date.parse(value.submittedAt))
    ) {
      return { ok: false };
    }

    return {
      ok: true,
      receipt: value.receipt,
      submittedAt: value.submittedAt,
    };
  } catch {
    return { ok: false };
  }
}
