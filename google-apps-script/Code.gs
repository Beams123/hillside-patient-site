/**
 * Hillside public schedule and menu bridge.
 *
 * This script is deliberately read-only. It reads only fixed schedule cells
 * and fixed menu cells, then creates a small allowlisted JSON response.
 */

const SOURCE_SCHEDULE_SPREADSHEET_ID =
  "16_vNk2TcNbZheXvCEuRpUHGzVNYQ_DC_Ku6Pg5YifFE";
const MENU_SPREADSHEET_ID =
  "1qUxUFHaCBmZP5ygjMNX49Q1Kxjbx2QjU3MUQj5KSQdA";
const FACILITY_TIME_ZONE = "America/New_York";
const CACHE_SECONDS = 300;
const PUBLIC_PAYLOAD_VERSION = 3;
const MENU_ITEMS_RANGE = "D4:K31";
const MENU_ITEMS_PER_MEAL = 8;
const MEALS_PER_DAY = 4;

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
  return buildPayload_();
}

function getCachedPayload_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get("public-payload-v3");

  if (cached) {
    return JSON.parse(cached);
  }

  const payload = buildPayload_();
  cache.put("public-payload-v3", JSON.stringify(payload), CACHE_SECONDS);
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
