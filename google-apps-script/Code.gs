/**
 * Hillside public schedule, menu, and staff-directory bridge.
 *
 * This script is deliberately read-only. It reads only fixed schedule cells
 * and fixed public-content cells, then creates a small allowlisted JSON
 * response.
 */

const SOURCE_SCHEDULE_SPREADSHEET_ID =
  "16_vNk2TcNbZheXvCEuRpUHGzVNYQ_DC_Ku6Pg5YifFE";
const MENU_SPREADSHEET_ID =
  "1qUxUFHaCBmZP5ygjMNX49Q1Kxjbx2QjU3MUQj5KSQdA";
const STAFF_SPREADSHEET_ID =
  "1CpGOnpZda9GMkGfs3iZnmxPMJ9hRR0xfD6hRk5fFi-g";
const FACILITY_TIME_ZONE = "America/New_York";
const CACHE_SECONDS = 300;
const PUBLIC_PAYLOAD_VERSION = 4;
const MENU_ITEMS_RANGE = "D4:K31";
const MENU_ITEMS_PER_MEAL = 8;
const MEALS_PER_DAY = 4;
const STAFF_DIRECTORY_RANGE = "A4:F53";
const MAXIMUM_STAFF_MEMBERS = 50;
const MAXIMUM_DEPARTMENTS_PER_STAFF_MEMBER = 2;
const PUBLIC_STAFF_DEPARTMENTS = ["Clinical"];

const PROGRAM_CONFIGS = [
  {
    code: "CSS",
    timeColumn: "A",
    contentColumns: ["B", "D", "F", "H", "J", "L", "N"],
    timeRows: [3, 5, 7, 9, 11],
  },
  {
    code: "ATS",
    timeColumn: "Q",
    contentColumns: ["R", "T", "V", "X", "Z", "AB", "AD"],
    timeRows: [3, 5, 7, 9],
  },
];

const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function doGet() {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    output.setContent(JSON.stringify(getCachedPayload_()));
  } catch (error) {
    output.setContent(
      JSON.stringify({
        ok: false,
        version: PUBLIC_PAYLOAD_VERSION,
        generatedAt: new Date().toISOString(),
        message: "Public information is temporarily unavailable.",
      }),
    );
  }

  return output;
}

/**
 * Run this once in the Apps Script editor to approve read-only access.
 * It returns the same sanitized payload as the public web endpoint.
 */
function authorizeBridge() {
  const payload = buildPayload_();
  const cssGroupCount = countWeeklyGroups_(payload.schedules.CSS);
  const atsGroupCount = countWeeklyGroups_(payload.schedules.ATS);

  console.log(
    "Bridge verified: " +
      payload.staff.length +
      " published staff members, " +
      cssGroupCount +
      " CSS groups, and " +
      atsGroupCount +
      " ATS groups.",
  );

  return payload;
}

/**
 * Run this from the Apps Script editor when staff entries do not appear.
 * A permissions error here identifies access to the separate staff workbook
 * without taking the schedule and menu feed offline.
 */
function verifyStaffDirectoryAccess() {
  const staff = readStaff_();

  console.log(
    "Staff directory verified: " +
      staff.length +
      " published staff members.",
  );

  return staff;
}

function countWeeklyGroups_(schedule) {
  return (schedule || []).reduce(function (total, day) {
    return total + (day.groups || []).length;
  }, 0);
}

function getCachedPayload_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get("public-payload-v4");

  if (cached) {
    return JSON.parse(cached);
  }

  const payload = buildPayload_();
  cache.put("public-payload-v4", JSON.stringify(payload), CACHE_SECONDS);
  return payload;
}

function buildPayload_() {
  const now = new Date();
  const scheduleDate = Utilities.formatDate(
    now,
    FACILITY_TIME_ZONE,
    "yyyy-MM-dd",
  );
  const week = getWeekDetails_(now);

  const schedules = {};

  PROGRAM_CONFIGS.forEach(function (config) {
    schedules[config.code] = readWeeklyProgramSchedule_(
      week.label,
      config,
      week,
    );
  });

  return {
    ok: true,
    version: PUBLIC_PAYLOAD_VERSION,
    generatedAt: now.toISOString(),
    scheduleDate: scheduleDate,
    weekLabel: week.label,
    schedules: schedules,
    menu: readMenu_(week),
    staff: readStaffSafely_(),
  };
}

function getWeekDetails_(date) {
  const dayNumber =
    Number(Utilities.formatDate(date, FACILITY_TIME_ZONE, "u")) - 1;
  const monday = new Date(date.getTime() - dayNumber * 24 * 60 * 60 * 1000);
  const sunday = new Date(monday.getTime() + 6 * 24 * 60 * 60 * 1000);

  return {
    label:
      Utilities.formatDate(monday, FACILITY_TIME_ZONE, "MM/dd/yy") +
      " - " +
      Utilities.formatDate(sunday, FACILITY_TIME_ZONE, "MM/dd/yy"),
    monday: monday,
  };
}

function readWeeklyProgramSchedule_(sheetName, config, week) {
  const cellReferences = [];
  const sheetReference = quoteSheetName_(sheetName) + "!";

  config.timeRows.forEach(function (row) {
    cellReferences.push(sheetReference + config.timeColumn + row);
  });

  config.contentColumns.forEach(function (contentColumn) {
    config.timeRows.forEach(function (row) {
      cellReferences.push(sheetReference + contentColumn + row);
      cellReferences.push(sheetReference + contentColumn + (row + 1));
    });
  });

  const values = getFormattedRanges_(
    SOURCE_SCHEDULE_SPREADSHEET_ID,
    cellReferences,
  ).map(function (valueRange) {
    return getFirstCellValue_(valueRange);
  });

  const times = values.slice(0, config.timeRows.length).map(function (value) {
    return parseTime_(value);
  });
  let contentIndex = config.timeRows.length;

  return DAY_NAMES.map(function (day, dayIndex) {
    const groups = config.timeRows.reduce(function (
      dayGroups,
      timeRow,
      timeIndex,
    ) {
      const content = normalizeScheduleContent_(
        sanitizePublicText_(values[contentIndex], 140),
        sanitizePublicText_(values[contentIndex + 1], 100),
      );
      const time = times[timeIndex];
      contentIndex += 2;

      if (time && content.topic) {
        dayGroups.push({
          time: time.display,
          topic: content.topic,
          facilitator: content.facilitator,
        });
      }

      return dayGroups;
    }, []);
    const date = new Date(
      week.monday.getTime() + dayIndex * 24 * 60 * 60 * 1000,
    );

    return {
      day: day,
      date: Utilities.formatDate(date, FACILITY_TIME_ZONE, "yyyy-MM-dd"),
      groups: groups,
    };
  });
}

function normalizeScheduleContent_(topic, facilitator) {
  const coverageFacilitatorPattern =
    /^[A-Za-z][A-Za-z .'-]{0,80}\s*\([^)]*\bcovering\b[^)]*\)$/i;

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

  return {
    topic: topic,
    facilitator: facilitator,
  };
}

function readMenu_(week) {
  const menuValueRange = getFormattedRanges_(MENU_SPREADSHEET_ID, [
    quoteSheetName_("Menu Items") + "!" + MENU_ITEMS_RANGE,
  ])[0];
  const values = menuValueRange.values || [];

  return DAY_NAMES.map(function (day, index) {
    const firstMealRow = index * MEALS_PER_DAY;
    const date = new Date(
      week.monday.getTime() + index * 24 * 60 * 60 * 1000,
    );

    return {
      day: day,
      date: Utilities.formatDate(date, FACILITY_TIME_ZONE, "yyyy-MM-dd"),
      breakfast: sanitizeMenuItems_(values[firstMealRow]),
      lunch: sanitizeMenuItems_(values[firstMealRow + 1]),
      dinner: sanitizeMenuItems_(values[firstMealRow + 2]),
      soupOfTheDay: sanitizeMenuItems_(values[firstMealRow + 3]),
    };
  });
}

function sanitizeMenuItems_(row) {
  return Array.from({ length: MENU_ITEMS_PER_MEAL }, function (_, index) {
    return sanitizePublicText_((row || [])[index], 120);
  }).filter(function (item) {
    return item.length > 0;
  });
}

function readStaffSafely_() {
  try {
    return readStaff_();
  } catch (error) {
    console.error("Staff directory read failed", error);
    return [];
  }
}

function readStaff_() {
  const staffValueRange = getFormattedRanges_(STAFF_SPREADSHEET_ID, [
    quoteSheetName_("Staff Directory") + "!" + STAFF_DIRECTORY_RANGE,
  ])[0];
  const values = staffValueRange.values || [];
  const publishedSlugs = {};

  return values
    .reduce(function (publishedStaff, row) {
      if (publishedStaff.length >= MAXIMUM_STAFF_MEMBERS) {
        return publishedStaff;
      }

      const isPublished =
        sanitizePublicText_((row || [])[0], 5).toUpperCase() === "TRUE";
      const name = sanitizePublicText_((row || [])[1], 80);
      const title = sanitizePublicText_((row || [])[2], 100);
      const department = sanitizePublicText_((row || [])[3], 60);
      const isLeadership =
        sanitizePublicText_((row || [])[4], 5).toUpperCase() === "TRUE";
      const departments = sanitizeStaffDepartments_(
        department,
        isLeadership,
      );
      const bio = sanitizePublicText_((row || [])[5], 1200);
      const slug = createStaffSlug_(name);

      if (isPublished && name && title && slug && !publishedSlugs[slug]) {
        publishedSlugs[slug] = true;
        publishedStaff.push({
          slug: slug,
          name: name,
          title: title,
          departments: departments,
          bio: bio,
        });
      }

      return publishedStaff;
    }, []);
}

function sanitizeStaffDepartments_(department, isLeadership) {
  const approvedDepartment =
    PUBLIC_STAFF_DEPARTMENTS.indexOf(department) >= 0 ? department : "";
  const departments = approvedDepartment ? [approvedDepartment] : [];

  if (
    isLeadership &&
    departments.length < MAXIMUM_DEPARTMENTS_PER_STAFF_MEMBER &&
    approvedDepartment.toLowerCase() !== "leadership"
  ) {
    departments.push("Leadership");
  }

  return departments;
}

function createStaffSlug_(name) {
  return name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}

function getFormattedRanges_(spreadsheetId, ranges) {
  const response = Sheets.Spreadsheets.Values.batchGet(spreadsheetId, {
    ranges: ranges,
    majorDimension: "ROWS",
    valueRenderOption: "FORMATTED_VALUE",
  });
  const valueRanges = response.valueRanges || [];

  if (valueRanges.length !== ranges.length) {
    throw new Error("Expected spreadsheet ranges were not returned");
  }

  return valueRanges;
}

function getFirstCellValue_(valueRange) {
  const values = valueRange.values || [];

  if (!values[0] || values[0][0] === undefined) {
    return "";
  }

  return String(values[0][0]);
}

function quoteSheetName_(sheetName) {
  return "'" + sheetName.replace(/'/g, "''") + "'";
}

function parseTime_(value) {
  const text = sanitizePublicText_(value, 20).toUpperCase();
  const match = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/);

  if (!match) {
    return null;
  }

  let hour = Number(match[1]);
  const minute = Number(match[2] || "0");
  const period = match[3] || "";

  if (
    minute < 0 ||
    minute > 59 ||
    (period && (hour < 1 || hour > 12)) ||
    (!period && (hour < 0 || hour > 23))
  ) {
    return null;
  }

  if (period === "AM" && hour === 12) {
    hour = 0;
  } else if (period === "PM" && hour !== 12) {
    hour += 12;
  }

  const displayHour = hour % 12 || 12;
  const displayPeriod = hour >= 12 ? "PM" : "AM";
  const paddedMinute = String(minute).padStart(2, "0");

  return {
    display: displayHour + ":" + paddedMinute + " " + displayPeriod,
  };
}

function sanitizePublicText_(value, maximumLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximumLength);
}
