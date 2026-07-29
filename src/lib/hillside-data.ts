import "server-only";

import {
  programCodes,
  weekDays,
  type HillsideDataResult,
  type HillsidePublicData,
  type MenuDay,
  type ProgramCode,
  type ScheduleDay,
  type ScheduleGroup,
  type StaffMember,
  type WeekDay,
  type WeeklyProgramSchedule,
} from "@/types/hillside-data";

const feedRevalidationSeconds = 300;
const maximumResponseCharacters = 100_000;
const maximumGroupsPerProgram = 12;
const maximumMenuItemsPerMeal = 8;
const maximumStaffMembers = 50;
const maximumDepartmentsPerStaffMember = 2;
const publicStaffDepartments = new Set(["Clinical", "Leadership"]);

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const displayTimePattern = /^(\d{1,2}):([0-5]\d) (AM|PM)$/;
const staffSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const coverageFacilitatorPattern =
  /^[A-Za-z][A-Za-z .'-]{0,80}\s*\([^)]*\bcovering\b[^)]*\)$/i;

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

function getTimeValue(displayTime: string): string | null {
  const match = displayTime.match(displayTimePattern);

  if (!match) {
    return null;
  }

  let hour = Number(match[1]);
  const minute = match[2];
  const period = match[3];

  if (hour < 1 || hour > 12) {
    return null;
  }

  if (period === "AM" && hour === 12) {
    hour = 0;
  } else if (period === "PM" && hour !== 12) {
    hour += 12;
  }

  return `${String(hour).padStart(2, "0")}:${minute}`;
}

function normalizeScheduleContent(topic: string, facilitator: string) {
  if (
    facilitator &&
    coverageFacilitatorPattern.test(topic) &&
    !coverageFacilitatorPattern.test(facilitator)
  ) {
    return {
      topic: facilitator,
      facilitator: topic,
    };
  }

  return { topic, facilitator };
}

function parseScheduleGroup(
  value: unknown,
  supportsLocation: boolean,
): ScheduleGroup | null {
  if (!isRecord(value)) {
    return null;
  }

  const time = readString(value.time, 20);
  const topic = readString(value.topic, 140);
  const facilitator = readString(value.facilitator, 100, true);
  const location = supportsLocation
    ? readString(value.location, 80, true)
    : "";
  const timeValue = time === null ? null : getTimeValue(time);

  if (
    time === null ||
    timeValue === null ||
    topic === null ||
    facilitator === null ||
    location === null
  ) {
    return null;
  }

  const content = normalizeScheduleContent(topic, facilitator);

  return {
    time,
    timeValue,
    topic: content.topic,
    facilitator: content.facilitator,
    location,
  };
}

function parseScheduleGroups(
  value: unknown,
  supportsLocation: boolean,
): ScheduleGroup[] | null {
  if (!Array.isArray(value) || value.length > maximumGroupsPerProgram) {
    return null;
  }

  const groups = value.map((group) =>
    parseScheduleGroup(group, supportsLocation),
  );

  if (
    !groups.every(
      (group): group is ScheduleGroup => group !== null,
    )
  ) {
    return null;
  }

  return groups;
}

function getWeekDates(scheduleDate: string) {
  const anchorDate = new Date(`${scheduleDate}T12:00:00Z`);

  if (Number.isNaN(anchorDate.getTime())) {
    return [];
  }

  const daysSinceMonday = (anchorDate.getUTCDay() + 6) % 7;
  const monday = new Date(anchorDate);
  monday.setUTCDate(anchorDate.getUTCDate() - daysSinceMonday);

  return weekDays.map((day, index) => {
    const date = new Date(monday);
    date.setUTCDate(monday.getUTCDate() + index);

    return {
      day,
      date: date.toISOString().slice(0, 10),
    };
  });
}

function parseScheduleDay(
  value: unknown,
  supportsLocation: boolean,
): ScheduleDay | null {
  if (!isRecord(value)) {
    return null;
  }

  const day = readString(value.day, 9);
  const date = readString(value.date, 10);
  const groups = parseScheduleGroups(value.groups, supportsLocation);

  if (
    day === null ||
    !weekDays.includes(day as WeekDay) ||
    date === null ||
    !datePattern.test(date) ||
    groups === null
  ) {
    return null;
  }

  return {
    day: day as WeekDay,
    date,
    groups,
  };
}

function parseWeeklyProgramSchedule(
  code: ProgramCode,
  value: unknown,
  scheduleDate: string,
  supportsLocation: boolean,
): WeeklyProgramSchedule | null {
  if (!Array.isArray(value) || value.length !== weekDays.length) {
    return null;
  }

  const days = value.map((day) =>
    parseScheduleDay(day, supportsLocation),
  );
  const expectedWeek = getWeekDates(scheduleDate);

  if (
    expectedWeek.length !== weekDays.length ||
    days.some((day) => day === null) ||
    days.some(
      (day, index) =>
        day?.day !== expectedWeek[index].day ||
        day.date !== expectedWeek[index].date,
    )
  ) {
    return null;
  }

  return {
    id: code.toLowerCase() as Lowercase<ProgramCode>,
    label: "Program schedule",
    title: code,
    days: days as ScheduleDay[],
  };
}

function parseLegacyProgramSchedule(
  code: ProgramCode,
  value: unknown,
  scheduleDate: string,
): WeeklyProgramSchedule | null {
  const groups = parseScheduleGroups(value, false);
  const week = getWeekDates(scheduleDate);

  if (groups === null || week.length !== weekDays.length) {
    return null;
  }

  return {
    id: code.toLowerCase() as Lowercase<ProgramCode>,
    label: "Program schedule",
    title: code,
    days: week.map((day) => ({
      ...day,
      groups: day.date === scheduleDate ? groups : [],
    })),
  };
}

function parseMenuItems(
  value: unknown,
  legacyVersion: boolean,
): string[] | null {
  if (legacyVersion) {
    const legacyValue = readString(value, 240, true);

    return legacyValue === null
      ? null
      : legacyValue.length > 0
        ? [legacyValue]
        : [];
  }

  if (
    !Array.isArray(value) ||
    value.length > maximumMenuItemsPerMeal
  ) {
    return null;
  }

  const items = value.map((item) => readString(item, 120));

  return items.every((item): item is string => item !== null)
    ? items
    : null;
}

function parseMenuDay(value: unknown, legacyVersion: boolean): MenuDay | null {
  if (!isRecord(value)) {
    return null;
  }

  const day = readString(value.day, 9);
  const date = readString(value.date, 10);
  const breakfast = parseMenuItems(value.breakfast, legacyVersion);
  const lunch = parseMenuItems(value.lunch, legacyVersion);
  const dinner = parseMenuItems(value.dinner, legacyVersion);
  const soupOfTheDay = parseMenuItems(
    legacyVersion ? value.snack : value.soupOfTheDay,
    legacyVersion,
  );

  if (
    day === null ||
    !weekDays.includes(day as WeekDay) ||
    date === null ||
    !datePattern.test(date) ||
    breakfast === null ||
    lunch === null ||
    dinner === null ||
    soupOfTheDay === null
  ) {
    return null;
  }

  return {
    day: day as WeekDay,
    date,
    breakfast,
    lunch,
    dinner,
    soupOfTheDay,
  };
}

function parseStaffMember(value: unknown): StaffMember | null {
  if (!isRecord(value)) {
    return null;
  }

  const slug = readString(value.slug, 80);
  const name = readString(value.name, 80);
  const title = readString(value.title, 100);
  const departments = Array.isArray(value.departments)
    ? value.departments.map((department) => readString(department, 60))
    : null;
  const bio = readString(value.bio, 1_200, true);

  if (
    slug === null ||
    !staffSlugPattern.test(slug) ||
    name === null ||
    title === null ||
    departments === null ||
    departments.length > maximumDepartmentsPerStaffMember ||
    !departments.every(
      (department): department is string => department !== null,
    ) ||
    !departments.every(
      (department) =>
        department !== null && publicStaffDepartments.has(department),
    ) ||
    new Set(departments.map((department) => department.toLocaleLowerCase()))
      .size !== departments.length ||
    bio === null
  ) {
    return null;
  }

  return { slug, name, title, departments, bio };
}

function parseStaff(value: unknown): StaffMember[] | null {
  if (!Array.isArray(value) || value.length > maximumStaffMembers) {
    return null;
  }

  const staff = value.map(parseStaffMember);

  if (!staff.every((member): member is StaffMember => member !== null)) {
    return null;
  }

  const slugs = new Set(staff.map((member) => member.slug));

  return slugs.size === staff.length ? staff : null;
}

function parsePublicData(value: unknown): HillsidePublicData | null {
  if (
    !isRecord(value) ||
    value.ok !== true ||
    (value.version !== 1 &&
      value.version !== 2 &&
      value.version !== 3 &&
      value.version !== 4 &&
      value.version !== 5)
  ) {
    return null;
  }

  const feedVersion = value.version;
  const legacyMenuVersion = feedVersion === 1;
  const generatedAt = readString(value.generatedAt, 40);
  const scheduleDate = readString(value.scheduleDate, 10);
  const weekLabel = readString(value.weekLabel, 40);
  const schedulesValue = value.schedules;
  const menuValue = value.menu;
  const staff =
    feedVersion >= 4 ? parseStaff(value.staff) : [];

  if (
    generatedAt === null ||
    Number.isNaN(Date.parse(generatedAt)) ||
    scheduleDate === null ||
    !datePattern.test(scheduleDate) ||
    weekLabel === null ||
    !isRecord(schedulesValue) ||
    !Array.isArray(menuValue) ||
    staff === null ||
    (menuValue.length !== 0 && menuValue.length !== weekDays.length)
  ) {
    return null;
  }

  const schedules = programCodes.map((code) =>
    feedVersion >= 3
      ? parseWeeklyProgramSchedule(
          code,
          schedulesValue[code],
          scheduleDate,
          feedVersion >= 5,
        )
      : parseLegacyProgramSchedule(
          code,
          schedulesValue[code],
          scheduleDate,
        ),
  );
  const menu = menuValue.map((day) =>
    parseMenuDay(day, legacyMenuVersion),
  );

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
    schedules: schedules as WeeklyProgramSchedule[],
    menu: menu as MenuDay[],
    staff,
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
