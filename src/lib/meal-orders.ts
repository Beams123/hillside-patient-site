import {
  alternativeMenuSelections,
  getAlternativeMenuSelectionError,
} from "@/data/menu";
import {
  programMealTimes,
} from "@/data/master-schedule";
import {
  facilityTimeZone,
  mealOrderCutoffMinutes,
  type MealOrderMode,
  type RequestableMeal,
} from "@/data/meal-orders";
import { getHillsidePublicData } from "@/lib/hillside-data";
import type { ProgramCode } from "@/types/hillside-data";

export type MealOrderPayload = {
  firstName: unknown;
  lastInitial: unknown;
  program: unknown;
  targetDate: unknown;
  meal: unknown;
  items: unknown;
  specialRequests: unknown;
};

export type ValidatedMealOrder = {
  firstName: string;
  lastInitial: string;
  program: ProgramCode;
  targetDate: string;
  meal: RequestableMeal;
  servingTime: string;
  servingTimeValue: string;
  items: string[];
  specialRequests: string;
};

type MealOrderValidationResult =
  | { ok: true; order: ValidatedMealOrder }
  | { ok: false; status: number; message: string };

type MealOrderDestinationResult =
  | { ok: true; receipt: string; submittedAt: string }
  | { ok: false };

const firstNamePattern = /^[\p{L}][\p{L}\p{M}' -]{0,39}$/u;
const lastInitialPattern = /^\p{L}$/u;
const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const maximumRequestCharacters = 8_000;
const maximumDestinationResponseCharacters = 2_000;
const allowedAlternativeItems = new Set<string>(
  alternativeMenuSelections,
);

function isProgramCode(value: unknown): value is ProgramCode {
  return value === "ATS" || value === "CSS";
}

function isRequestableMeal(value: unknown): value is RequestableMeal {
  return value === "lunch" || value === "dinner";
}

function isValidCalendarDate(value: string): boolean {
  if (!datePattern.test(value)) {
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

function readTimeZoneParts(date: Date) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: facilityTimeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: parts.year,
    month: parts.month,
    day: parts.day,
    hour: parts.hour,
    minute: parts.minute,
    second: parts.second,
  };
}

function getServingInstant(
  targetDate: string,
  servingTimeValue: string,
): Date {
  const [year, month, day] = targetDate.split("-").map(Number);
  const [hour, minute] = servingTimeValue.split(":").map(Number);
  const referenceUtc = new Date(Date.UTC(year, month - 1, day, 12));
  const localReference = readTimeZoneParts(referenceUtc);
  const localReferenceAsUtc = Date.UTC(
    localReference.year,
    localReference.month - 1,
    localReference.day,
    localReference.hour,
    localReference.minute,
    localReference.second,
  );
  const timeZoneOffset = localReferenceAsUtc - referenceUtc.getTime();

  return new Date(
    Date.UTC(year, month - 1, day, hour, minute) - timeZoneOffset,
  );
}

function normalizeText(value: unknown, maximumLength: number): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim().replace(/\s+/g, " ");

  if (normalized.length === 0 || normalized.length > maximumLength) {
    return null;
  }

  return normalized;
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

function hasLiveConfiguration(): boolean {
  return (
    process.env.HILLSIDE_MEAL_ORDER_ENABLED === "true" &&
    isAllowedMealOrderUrl(process.env.HILLSIDE_MEAL_ORDER_WEB_APP_URL) &&
    Boolean(
      process.env.HILLSIDE_MEAL_ORDER_SHARED_SECRET &&
        process.env.HILLSIDE_MEAL_ORDER_SHARED_SECRET.length >= 32,
    )
  );
}

export function getMealOrderMode(): MealOrderMode {
  if (process.env.HILLSIDE_DEMO_MODE === "true") {
    return "test";
  }

  if (
    process.env.NODE_ENV === "development" &&
    process.env.HILLSIDE_MEAL_ORDER_LOCAL_LIVE_TEST !== "true"
  ) {
    return "test";
  }

  return hasLiveConfiguration() ? "live" : "unavailable";
}

export function getMaximumMealOrderRequestCharacters(): number {
  return maximumRequestCharacters;
}

export function isAllowedMealOrderUrl(value: string | undefined): boolean {
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

export async function validateMealOrder(
  payload: MealOrderPayload,
  now = new Date(),
): Promise<MealOrderValidationResult> {
  const firstName = normalizeText(payload.firstName, 40);
  const lastInitial = normalizeText(payload.lastInitial, 1)?.toUpperCase();
  const specialRequests = normalizeOptionalText(payload.specialRequests, 200);

  if (!firstName || !firstNamePattern.test(firstName)) {
    return {
      ok: false,
      status: 400,
      message:
        "Enter the patient’s first name using letters, spaces, apostrophes, or hyphens.",
    };
  }

  if (!lastInitial || !lastInitialPattern.test(lastInitial)) {
    return {
      ok: false,
      status: 400,
      message: "Enter one letter for the patient’s last initial.",
    };
  }

  if (
    !isProgramCode(payload.program) ||
    !isRequestableMeal(payload.meal) ||
    typeof payload.targetDate !== "string" ||
    !isValidCalendarDate(payload.targetDate)
  ) {
    return {
      ok: false,
      status: 400,
      message:
        "Return to the Schedule and choose a specific lunch or dinner.",
    };
  }

  if (
    !Array.isArray(payload.items) ||
    payload.items.length === 0 ||
    payload.items.length > alternativeMenuSelections.length ||
    !payload.items.every(
      (item): item is string =>
        typeof item === "string" && allowedAlternativeItems.has(item),
    )
  ) {
    return {
      ok: false,
      status: 400,
      message: "Choose at least one item from the alternative menu.",
    };
  }

  const items = [...new Set(payload.items)];
  const menuSelectionError = getAlternativeMenuSelectionError(items);

  if (
    items.length !== payload.items.length ||
    specialRequests === null ||
    menuSelectionError
  ) {
    return {
      ok: false,
      status: 400,
      message:
        menuSelectionError ??
        "Review the requested items and special request, then try again.",
    };
  }

  const dataResult = await getHillsidePublicData();

  if (dataResult.status !== "available") {
    return {
      ok: false,
      status: 503,
      message:
        "The current schedule could not be verified. Please use the paper request sheet for now.",
    };
  }

  const programSchedule = dataResult.data.schedules.find(
    (schedule) => schedule.title === payload.program,
  );
  const dateIsInCurrentSchedule = programSchedule?.days.some(
    (day) => day.date === payload.targetDate,
  );
  const mealConfiguration = programMealTimes[payload.program].find(
    (meal) => meal.key === payload.meal,
  );

  if (!dateIsInCurrentSchedule || !mealConfiguration) {
    return {
      ok: false,
      status: 400,
      message:
        "That meal is not in the current approved schedule. Return to the Schedule and choose it again.",
    };
  }

  const servingAt = getServingInstant(
    payload.targetDate,
    mealConfiguration.timeValue,
  );
  const cutoffAt = new Date(
    servingAt.getTime() - mealOrderCutoffMinutes * 60_000,
  );

  if (now.getTime() >= cutoffAt.getTime()) {
    return {
      ok: false,
      status: 409,
      message: `Online requests for this ${mealConfiguration.label.toLowerCase()} closed 2 hours before its serving time. Please speak with RS staff.`,
    };
  }

  return {
    ok: true,
    order: {
      firstName,
      lastInitial,
      program: payload.program,
      targetDate: payload.targetDate,
      meal: payload.meal,
      servingTime: mealConfiguration.time,
      servingTimeValue: mealConfiguration.timeValue,
      items,
      specialRequests,
    },
  };
}

export async function sendMealOrderToDestination(
  order: ValidatedMealOrder,
): Promise<MealOrderDestinationResult> {
  const destinationUrl = process.env.HILLSIDE_MEAL_ORDER_WEB_APP_URL;
  const sharedSecret = process.env.HILLSIDE_MEAL_ORDER_SHARED_SECRET;

  if (
    !destinationUrl ||
    !isAllowedMealOrderUrl(destinationUrl) ||
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
        sharedSecret,
        ...order,
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
      !/^AMR-[A-Z0-9-]{8,32}$/.test(value.receipt) ||
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
