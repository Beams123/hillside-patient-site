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
const MENU_RANGE = "A3:F9";

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
        version: 1,
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
  const cached = cache.get("public-payload-v1");

  if (cached) {
    return JSON.parse(cached);
  }

  const payload = buildPayload_();
  cache.put("public-payload-v1", JSON.stringify(payload), CACHE_SECONDS);
  return payload;
}

function buildPayload_() {
  const now = new Date();
  const scheduleDate = Utilities.formatDate(
    now,
    FACILITY_TIME_ZONE,
    "yyyy-MM-dd",
  );
  const dayIndex =
    Number(Utilities.formatDate(now, FACILITY_TIME_ZONE, "u")) - 1;
  const week = getWeekDetails_(now);

  const schedules = {};

  PROGRAM_CONFIGS.forEach(function (config) {
    schedules[config.code] = readProgramSchedule_(
      week.label,
      config,
      dayIndex,
    );
  });

  return {
    ok: true,
    version: 1,
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

function readProgramSchedule_(sheetName, config, dayIndex) {
  const contentColumn = config.contentColumns[dayIndex];
  const cellReferences = [];
  const sheetReference = quoteSheetName_(sheetName) + "!";

  config.timeRows.forEach(function (row) {
    cellReferences.push(sheetReference + config.timeColumn + row);
    cellReferences.push(sheetReference + contentColumn + row);
    cellReferences.push(sheetReference + contentColumn + (row + 1));
  });

  const values = getFormattedRanges_(
    SOURCE_SCHEDULE_SPREADSHEET_ID,
    cellReferences,
  ).map(function (valueRange) {
    return getFirstCellValue_(valueRange);
  });

  return config.timeRows.reduce(function (groups, timeRow, index) {
    const time = parseTime_(values[index * 3]);
    const content = normalizeScheduleContent_(
      sanitizePublicText_(values[index * 3 + 1], 140),
      sanitizePublicText_(values[index * 3 + 2], 100),
    );

    if (time && content.topic) {
      groups.push({
        time: time.display,
        topic: content.topic,
        facilitator: content.facilitator,
      });
    }

    return groups;
  }, []);
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
    quoteSheetName_("Menu") + "!" + MENU_RANGE,
  ])[0];
  const values = menuValueRange.values || [];

  return DAY_NAMES.map(function (day, index) {
    const row = values[index] || [];
    const date = new Date(
      week.monday.getTime() + index * 24 * 60 * 60 * 1000,
    );

    return {
      day: day,
      date: Utilities.formatDate(date, FACILITY_TIME_ZONE, "yyyy-MM-dd"),
      breakfast: sanitizePublicText_(row[2], 240),
      lunch: sanitizePublicText_(row[3], 240),
      dinner: sanitizePublicText_(row[4], 240),
      snack: sanitizePublicText_(row[5], 240),
    };
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
