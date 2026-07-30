import "server-only";

import {
  programCodes,
  staffDirectoryGroups,
  weekDays,
  type HillsideDataResult,
  type HillsidePublicData,
  type MenuDay,
  type ProgramCode,
  type ScheduleDay,
  type ScheduleActivity,
  type ScheduleGroup,
  type StaffDirectoryGroup,
  type StaffMember,
  type WeekDay,
  type WeeklyProgramSchedule,
} from "@/types/hillside-data";

const feedRevalidationSeconds = 300;
const feedRequestTimeoutMilliseconds = 15_000;
const maximumResponseCharacters = 500_000;
const maximumGroupsPerProgram = 12;
const maximumActivitiesPerDay = 8;
const maximumMenuItemsPerMeal = 8;
const maximumStaffMembers = 50;
const maximumDepartmentsPerStaffMember = 2;
const maximumStaffBioLength = 8_000;
const maximumStaffDisplayOrder = 9_999;
const publicStaffDepartments = new Set(["Clinical", "Leadership"]);
const publicStaffDirectoryGroups = new Set(staffDirectoryGroups);
const sundayFirstWeekDays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const satisfies readonly WeekDay[];
const cssRecurringActivities = [
  {
    time: "10:00 AM",
    timeValue: "10:00",
    title: "Gym",
  },
  {
    time: "8:00 PM",
    timeValue: "20:00",
    title: "Gym",
  },
] as const satisfies readonly ScheduleActivity[];

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const displayTimePattern = /^(\d{1,2}):([0-5]\d) (AM|PM)$/;
const staffSlugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const staffEmailPattern =
  /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@hillsidedetox\.com$/i;
const staffPhonePattern =
  /^(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}(?:\s*(?:x|ext\.?)\s*\d{1,6})?$/i;
const staffPortraitFileIdPattern = /^[A-Za-z0-9_-]{10,100}$/;
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

function readMultilineString(
  value: unknown,
  maximumLength: number,
  allowEmpty = false,
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const normalized = value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, " ")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter((line) => line.length > 0)
    .join("\n");

  if (
    (!allowEmpty && normalized.length === 0) ||
    normalized.length > maximumLength
  ) {
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

function parseScheduleActivity(
  value: unknown,
): ScheduleActivity | null {
  if (!isRecord(value)) {
    return null;
  }

  const time = readString(value.time, 20);
  const title = readString(value.title, 180);
  const timeValue = time === null ? null : getTimeValue(time);

  if (time === null || timeValue === null || title === null) {
    return null;
  }

  return {
    time,
    timeValue,
    title,
  };
}

function parseScheduleActivities(
  value: unknown,
): ScheduleActivity[] | null {
  if (
    !Array.isArray(value) ||
    value.length > maximumActivitiesPerDay
  ) {
    return null;
  }

  const activities = value.map(parseScheduleActivity);

  return activities.every(
    (activity): activity is ScheduleActivity => activity !== null,
  )
    ? activities
    : null;
}

function getWeekDates(scheduleDate: string, startsOnSunday = false) {
  const anchorDate = new Date(`${scheduleDate}T12:00:00Z`);

  if (Number.isNaN(anchorDate.getTime())) {
    return [];
  }

  const daysSinceStart = startsOnSunday
    ? anchorDate.getUTCDay()
    : (anchorDate.getUTCDay() + 6) % 7;
  const weekStart = new Date(anchorDate);
  weekStart.setUTCDate(anchorDate.getUTCDate() - daysSinceStart);
  const orderedWeekDays = startsOnSunday
    ? sundayFirstWeekDays
    : weekDays;

  return orderedWeekDays.map((day, index) => {
    const date = new Date(weekStart);
    date.setUTCDate(weekStart.getUTCDate() + index);

    return {
      day,
      date: date.toISOString().slice(0, 10),
    };
  });
}

function parseScheduleDay(
  value: unknown,
  supportsLocation: boolean,
  supportsActivities: boolean,
): ScheduleDay | null {
  if (!isRecord(value)) {
    return null;
  }

  const day = readString(value.day, 9);
  const date = readString(value.date, 10);
  const groups = parseScheduleGroups(value.groups, supportsLocation);
  const activities = supportsActivities
    ? parseScheduleActivities(value.activities)
    : [];

  if (
    day === null ||
    !weekDays.includes(day as WeekDay) ||
    date === null ||
    !datePattern.test(date) ||
    groups === null ||
    activities === null
  ) {
    return null;
  }

  return {
    day: day as WeekDay,
    date,
    groups,
    activities,
  };
}

function parseWeeklyProgramSchedule(
  code: ProgramCode,
  value: unknown,
  scheduleDate: string,
  supportsLocation: boolean,
  supportsActivities: boolean,
  startsOnSunday: boolean,
): WeeklyProgramSchedule | null {
  if (!Array.isArray(value) || value.length !== weekDays.length) {
    return null;
  }

  const days = value.map((day) =>
    parseScheduleDay(day, supportsLocation, supportsActivities),
  );
  const expectedWeek = getWeekDates(scheduleDate, startsOnSunday);

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

function addRecurringScheduleActivities(
  schedules: WeeklyProgramSchedule[],
): WeeklyProgramSchedule[] {
  return schedules.map((schedule) => {
    if (schedule.title !== "CSS") {
      return schedule;
    }

    return {
      ...schedule,
      days: schedule.days.map((day) => ({
        ...day,
        activities: [
          ...day.activities,
          ...cssRecurringActivities.filter(
            (recurringActivity) =>
              !day.activities.some(
                (activity) =>
                  activity.timeValue === recurringActivity.timeValue &&
                  activity.title.toLocaleLowerCase() ===
                    recurringActivity.title.toLocaleLowerCase(),
              ),
          ),
        ],
      })),
    };
  });
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
      activities: [],
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

function inferStaffDirectoryGroup(
  title: string,
  departments: string[],
): StaffDirectoryGroup {
  if (departments.includes("Leadership")) {
    return "Leadership";
  }

  if (/\bcase manager\b/i.test(title)) {
    return "Case Managers";
  }

  if (/\bcounselor\b/i.test(title)) {
    return "Counselors";
  }

  return "Staff";
}

function readStaffDisplayOrder(
  value: unknown,
  fallbackOrder: number,
): number | null {
  if (
    typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0 &&
    value <= maximumStaffDisplayOrder
  ) {
    return value;
  }

  if (typeof value === "string" && /^\d{1,4}$/.test(value.trim())) {
    const parsedValue = Number(value);

    return parsedValue <= maximumStaffDisplayOrder ? parsedValue : null;
  }

  return fallbackOrder;
}

function readStaffPortraitUrl(value: unknown): string | null {
  const portraitUrl = readString(value, 500, true);

  if (portraitUrl === null || portraitUrl.length === 0) {
    return portraitUrl;
  }

  try {
    const url = new URL(portraitUrl);
    const fileIds = url.searchParams.getAll("id");
    const sizes = url.searchParams.getAll("sz");
    const parameterNames = Array.from(url.searchParams.keys());

    if (
      url.protocol !== "https:" ||
      url.hostname !== "drive.google.com" ||
      url.port !== "" ||
      url.username !== "" ||
      url.password !== "" ||
      url.pathname !== "/thumbnail" ||
      url.hash !== "" ||
      fileIds.length !== 1 ||
      !staffPortraitFileIdPattern.test(fileIds[0]) ||
      sizes.length !== 1 ||
      sizes[0] !== "w800" ||
      parameterNames.length !== 2 ||
      !parameterNames.every((name) => name === "id" || name === "sz")
    ) {
      return null;
    }

    return `https://drive.google.com/thumbnail?id=${fileIds[0]}&sz=w800`;
  } catch {
    return null;
  }
}

function parseStaffMember(
  value: unknown,
  supportsDirectoryDetails: boolean,
  supportsPhone: boolean,
  fallbackOrder: number,
): StaffMember | null {
  if (!isRecord(value)) {
    return null;
  }

  const slug = readString(value.slug, 80);
  const name = readString(value.name, 80);
  const title = readString(value.title, 100);
  const departments = Array.isArray(value.departments)
    ? value.departments.map((department) => readString(department, 60))
    : null;
  const bio = readMultilineString(value.bio, maximumStaffBioLength, true);
  const directoryGroup = supportsDirectoryDetails
    ? readString(value.directoryGroup, 40)
    : null;
  const displayOrder = supportsDirectoryDetails
    ? readStaffDisplayOrder(value.displayOrder, fallbackOrder)
    : fallbackOrder;
  const email = supportsDirectoryDetails
    ? readString(value.email, 120, true)
    : "";
  const phone = supportsPhone
    ? readString(value.phone, 40, true)
    : "";
  const portraitUrl = supportsDirectoryDetails
    ? readStaffPortraitUrl(value.portraitUrl)
    : "";

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
    bio === null ||
    displayOrder === null ||
    email === null ||
    (email.length > 0 && !staffEmailPattern.test(email)) ||
    phone === null ||
    (phone.length > 0 && !staffPhonePattern.test(phone)) ||
    portraitUrl === null ||
    (supportsDirectoryDetails &&
      (directoryGroup === null ||
        !publicStaffDirectoryGroups.has(
          directoryGroup as StaffDirectoryGroup,
        )))
  ) {
    return null;
  }

  return {
    slug,
    name,
    title,
    departments,
    bio,
    directoryGroup: supportsDirectoryDetails
      ? (directoryGroup as StaffDirectoryGroup)
      : inferStaffDirectoryGroup(title, departments),
    displayOrder,
    email,
    phone,
    portraitUrl,
  };
}

function parseStaff(
  value: unknown,
  supportsDirectoryDetails: boolean,
  supportsPhone: boolean,
): StaffMember[] | null {
  if (!Array.isArray(value) || value.length > maximumStaffMembers) {
    return null;
  }

  const staff = value.map((member, index) =>
    parseStaffMember(
      member,
      supportsDirectoryDetails,
      supportsPhone,
      index + 1,
    ),
  );

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
      value.version !== 5 &&
      value.version !== 6 &&
      value.version !== 7 &&
      value.version !== 8 &&
      value.version !== 9)
  ) {
    return null;
  }

  const feedVersion = value.version;
  const legacyMenuVersion = feedVersion === 1;
  const startsOnSunday = feedVersion >= 8;
  const generatedAt = readString(value.generatedAt, 40);
  const scheduleDate = readString(value.scheduleDate, 10);
  const weekLabel = readString(value.weekLabel, 40);
  const schedulesValue = value.schedules;
  const menuValue = value.menu;
  const staff =
    feedVersion >= 4
      ? parseStaff(value.staff, feedVersion >= 6, feedVersion >= 9)
      : [];

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
          feedVersion >= 7,
          startsOnSunday,
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
  const expectedMenuWeek = getWeekDates(scheduleDate, startsOnSunday);

  if (
    schedules.some((schedule) => schedule === null) ||
    menu.some((day) => day === null) ||
    menu.some(
      (day, index) =>
        day?.day !== expectedMenuWeek[index]?.day ||
        day.date !== expectedMenuWeek[index]?.date,
    )
  ) {
    return null;
  }

  return {
    generatedAt,
    scheduleDate,
    weekLabel,
    schedules: addRecurringScheduleActivities(
      schedules as WeeklyProgramSchedule[],
    ),
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
      signal: AbortSignal.timeout(feedRequestTimeoutMilliseconds),
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
