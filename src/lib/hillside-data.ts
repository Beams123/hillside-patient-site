import "server-only";

import {
  programCodes,
  weekDays,
  type HillsideDataResult,
  type HillsidePublicData,
  type MenuDay,
  type ProgramCode,
  type ProgramSchedule,
  type ScheduleGroup,
  type WeekDay,
} from "@/types/hillside-data";

const feedRevalidationSeconds = 300;
const maximumResponseCharacters = 100_000;
const maximumGroupsPerProgram = 12;

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timeValuePattern = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(
  value: unknown,
  maximumLength: number,
  allowEmpty = false,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if ((!allowEmpty && normalized.length === 0) || normalized.length > maximumLength) {
    return null;
  }

  return normalized;
}

function parseScheduleGroup(value: unknown): ScheduleGroup | null {
  if (!isRecord(value)) {
    return null;
  }

  const time = readString(value.time, 20);
  const timeValue = readString(value.timeValue, 5);
  const topic = readString(value.topic, 140);

  if (
    time === null ||
    timeValue === null ||
    !timeValuePattern.test(timeValue) ||
    topic === null
  ) {
    return null;
  }

  return {
    time,
    timeValue,
    topic,
  };
}

function parseProgramSchedule(
  code: ProgramCode,
  value: unknown,
): ProgramSchedule | null {
  if (!Array.isArray(value) || value.length > maximumGroupsPerProgram) {
    return null;
  }

  const groups = value.map(parseScheduleGroup);

  if (
    !groups.every(
      (group): group is ScheduleGroup => group !== null,
    )
  ) {
    return null;
  }

  return {
    id: code.toLowerCase() as Lowercase<ProgramCode>,
    label: "Program schedule",
    title: code,
    groups,
  };
}

function parseMenuDay(value: unknown): MenuDay | null {
  if (!isRecord(value)) {
    return null;
  }

  const day = readString(value.day, 9);
  const date = readString(value.date, 10);
  const breakfast = readString(value.breakfast, 240, true);
  const lunch = readString(value.lunch, 240, true);
  const dinner = readString(value.dinner, 240, true);
  const snack = readString(value.snack, 240, true);

  if (
    day === null ||
    !weekDays.includes(day as WeekDay) ||
    date === null ||
    !datePattern.test(date) ||
    breakfast === null ||
    lunch === null ||
    dinner === null ||
    snack === null
  ) {
    return null;
  }

  return {
    day: day as WeekDay,
    date,
    breakfast,
    lunch,
    dinner,
    snack,
  };
}

function parsePublicData(value: unknown): HillsidePublicData | null {
  if (!isRecord(value) || value.ok !== true || value.version !== 1) {
    return null;
  }

  const generatedAt = readString(value.generatedAt, 40);
  const scheduleDate = readString(value.scheduleDate, 10);
  const weekLabel = readString(value.weekLabel, 40);
  const schedulesValue = value.schedules;
  const menuValue = value.menu;

  if (
    generatedAt === null ||
    Number.isNaN(Date.parse(generatedAt)) ||
    scheduleDate === null ||
    !datePattern.test(scheduleDate) ||
    weekLabel === null ||
    !isRecord(schedulesValue) ||
    !Array.isArray(menuValue) ||
    (menuValue.length !== 0 && menuValue.length !== weekDays.length)
  ) {
    return null;
  }

  const schedules = programCodes.map((code) =>
    parseProgramSchedule(code, schedulesValue[code]),
  );
  const menu = menuValue.map(parseMenuDay);

  if (
    schedules.some((schedule) => schedule === null) ||
    menu.some((day) => day === null) ||
    menu.some((day, index) => day?.day !== weekDays[index])
  ) {
    return null;
  }

  return {
    generatedAt,
    scheduleDate,
    weekLabel,
    schedules: schedules as ProgramSchedule[],
    menu: menu as MenuDay[],
  };
}

function isAllowedFeedUrl(value: string): boolean {
  try {
    const url = new URL(value);

    if (
      process.env.NODE_ENV !== "production" &&
      (url.hostname === "127.0.0.1" || url.hostname === "localhost")
    ) {
      return url.protocol === "http:" || url.protocol === "https:";
    }

    return (
      url.protocol === "https:" &&
      url.hostname === "script.google.com" &&
      url.pathname.startsWith("/macros/s/")
    );
  } catch {
    return false;
  }
}

export async function getHillsidePublicData(): Promise<HillsideDataResult> {
  const feedUrl = process.env.HILLSIDE_DATA_FEED_URL;

  if (!feedUrl || !isAllowedFeedUrl(feedUrl)) {
    return { status: "not-configured", data: null };
  }

  try {
    const response = await fetch(feedUrl, {
      headers: { Accept: "application/json" },
      next: { revalidate: feedRevalidationSeconds },
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) {
      return { status: "unavailable", data: null };
    }

    const declaredLength = Number(response.headers.get("content-length"));

    if (
      Number.isFinite(declaredLength) &&
      declaredLength > maximumResponseCharacters
    ) {
      return { status: "unavailable", data: null };
    }

    const responseText = await response.text();

    if (responseText.length > maximumResponseCharacters) {
      return { status: "unavailable", data: null };
    }

    const data = parsePublicData(JSON.parse(responseText));

    return data
      ? { status: "available", data }
      : { status: "unavailable", data: null };
  } catch {
    return { status: "unavailable", data: null };
  }
}

export function getEmptyProgramSchedules(): ProgramSchedule[] {
  return programCodes.map((code) => ({
    id: code.toLowerCase() as Lowercase<ProgramCode>,
    label: "Program schedule",
    title: code,
    groups: [],
  }));
}
