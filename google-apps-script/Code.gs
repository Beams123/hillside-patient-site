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
const PUBLIC_PAYLOAD_VERSION = 10;
const PUBLIC_CACHE_KEY = "public-payload-v10-staff-categories";
const MENU_ITEMS_RANGE = "D4:K31";
const MENU_ITEMS_PER_MEAL = 8;
const MEALS_PER_DAY = 4;
const STAFF_DIRECTORY_RANGE = "A4:K53";
const MAXIMUM_STAFF_MEMBERS = 50;
const MAXIMUM_DEPARTMENTS_PER_STAFF_MEMBER = 2;
const MAXIMUM_STAFF_BIO_LENGTH = 8000;
const PUBLIC_STAFF_DEPARTMENTS = ["Clinical", "Medical", "Admissions"];
const PUBLIC_STAFF_DIRECTORY_GROUPS = [
  "Leadership",
  "Medical",
  "Admissions",
  "Counselors",
  "Case Managers",
  "Staff",
];

const PROGRAM_CONFIGS = [
  {
    code: "CSS",
    timeColumn: "A",
    contentColumns: ["B", "D", "F", "H", "J", "L", "N"],
    timeRows: [3, 5, 7, 9, 11],
    activityRow: 13,
  },
  {
    code: "ATS",
    timeColumn: "Q",
    contentColumns: ["R", "T", "V", "X", "Z", "AB", "AD"],
    timeRows: [3, 5, 7, 9],
    activityRow: 13,
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
  const cssActivityCount = countWeeklyActivities_(payload.schedules.CSS);
  const atsActivityCount = countWeeklyActivities_(payload.schedules.ATS);

  console.log(
    "Bridge verified: " +
      payload.staff.length +
      " published staff members, " +
      cssGroupCount +
      " CSS groups, and " +
      atsGroupCount +
      " ATS groups; " +
      cssActivityCount +
      " CSS activities, and " +
      atsActivityCount +
      " ATS activities.",
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

function countWeeklyActivities_(schedule) {
  return (schedule || []).reduce(function (total, day) {
    return total + (day.activities || []).length;
  }, 0);
}

function getCachedPayload_() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(PUBLIC_CACHE_KEY);

  if (cached) {
    return JSON.parse(cached);
  }

  const payload = buildPayload_();
  cache.put(PUBLIC_CACHE_KEY, JSON.stringify(payload), CACHE_SECONDS);
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
    const sundaySourceSchedule = readWeeklyProgramScheduleSafely_(
      week.sundaySource.label,
      config,
      week.sundaySource,
      [6],
    );
    const weekdaySourceSchedule = readWeeklyProgramScheduleSafely_(
      week.weekdaySource.label,
      config,
      week.weekdaySource,
      [0, 1, 2, 3, 4, 5],
    );

    schedules[config.code] = sundaySourceSchedule.concat(
      weekdaySourceSchedule,
    );
  });

  applyFridayCombinedProgramGroups_(schedules);

  return {
    ok: true,
    version: PUBLIC_PAYLOAD_VERSION,
    generatedAt: now.toISOString(),
    scheduleDate: scheduleDate,
    weekLabel: week.label,
    schedules: schedules,
    menu: readMenu_(week, now),
    staff: readStaffSafely_(),
  };
}

function getWeekDetails_(date) {
  const dayNumber = Number(
    Utilities.formatDate(date, FACILITY_TIME_ZONE, "u"),
  );
  const sunday = addDays_(date, -(dayNumber % 7));
  const saturday = addDays_(sunday, 6);
  const sundaySourceMonday = addDays_(sunday, -6);
  const weekdaySourceMonday = addDays_(sunday, 1);

  return {
    label:
      Utilities.formatDate(sunday, FACILITY_TIME_ZONE, "MM/dd/yy") +
      " - " +
      Utilities.formatDate(saturday, FACILITY_TIME_ZONE, "MM/dd/yy"),
    sunday: sunday,
    sundaySource: getSourceWeekDetails_(sundaySourceMonday),
    weekdaySource: getSourceWeekDetails_(weekdaySourceMonday),
  };
}

function getSourceWeekDetails_(monday) {
  const sunday = addDays_(monday, 6);

  return {
    label:
      Utilities.formatDate(monday, FACILITY_TIME_ZONE, "MM/dd/yy") +
      " - " +
      Utilities.formatDate(sunday, FACILITY_TIME_ZONE, "MM/dd/yy"),
    monday: monday,
  };
}

function addDays_(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function readWeeklyProgramScheduleSafely_(
  sheetName,
  config,
  week,
  dayIndexes,
) {
  try {
    return readWeeklyProgramSchedule_(
      sheetName,
      config,
      week,
      dayIndexes,
    );
  } catch (error) {
    console.error(
      config.code + " schedule read failed for " + sheetName,
      error,
    );

    return createEmptySourceSchedule_(week, dayIndexes);
  }
}

function createEmptySourceSchedule_(week, dayIndexes) {
  return dayIndexes.map(function (dayIndex) {
    const date = addDays_(week.monday, dayIndex);

    return {
      day: DAY_NAMES[dayIndex],
      date: Utilities.formatDate(date, FACILITY_TIME_ZONE, "yyyy-MM-dd"),
      groups: [],
      activities: [],
    };
  });
}

function readWeeklyProgramSchedule_(
  sheetName,
  config,
  week,
  dayIndexes,
) {
  const cellReferences = [];
  const sheetReference = quoteSheetName_(sheetName) + "!";
  const contentColumns = dayIndexes.map(function (dayIndex) {
    return config.contentColumns[dayIndex];
  });

  config.timeRows.forEach(function (row) {
    cellReferences.push(sheetReference + config.timeColumn + row);
  });

  contentColumns.forEach(function (contentColumn) {
    config.timeRows.forEach(function (row) {
      cellReferences.push(sheetReference + contentColumn + row);
      cellReferences.push(sheetReference + contentColumn + (row + 1));
    });
  });

  contentColumns.forEach(function (contentColumn) {
    cellReferences.push(
      sheetReference + contentColumn + config.activityRow,
    );
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
  const activityStartIndex =
    config.timeRows.length +
    contentColumns.length * config.timeRows.length * 2;
  const activityValues = values.slice(
    activityStartIndex,
    activityStartIndex + contentColumns.length,
  );
  let contentIndex = config.timeRows.length;

  return dayIndexes.map(function (dayIndex, selectedDayIndex) {
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
          location: "",
        });
      }

      return dayGroups;
    }, []);
    const date = addDays_(week.monday, dayIndex);

    return {
      day: DAY_NAMES[dayIndex],
      date: Utilities.formatDate(date, FACILITY_TIME_ZONE, "yyyy-MM-dd"),
      groups: groups,
      activities: parseDailyActivities_(
        activityValues[selectedDayIndex],
      ),
    };
  });
}

function applyFridayCombinedProgramGroups_(schedules) {
  const cssFriday = getScheduleDay_(schedules.CSS, "Friday");
  const atsFriday = getScheduleDay_(schedules.ATS, "Friday");

  if (!cssFriday || !atsFriday) {
    return;
  }

  const cssCombinedIndex = cssFriday.groups.findIndex(function (group) {
    return Boolean(
      parseCombinedProgramGroupLine_(group.topic, group.time) &&
        parseCombinedProgramGroupLine_(group.facilitator, group.time),
    );
  });

  if (cssCombinedIndex < 0) {
    return;
  }

  const cssSourceGroup = cssFriday.groups[cssCombinedIndex];
  const firstGroup = parseCombinedProgramGroupLine_(
    cssSourceGroup.topic,
    cssSourceGroup.time,
  );
  const secondGroup = parseCombinedProgramGroupLine_(
    cssSourceGroup.facilitator,
    cssSourceGroup.time,
  );

  if (
    !firstGroup ||
    !secondGroup ||
    firstGroup.time !== secondGroup.time
  ) {
    return;
  }

  const sharedGroups = [firstGroup, secondGroup];
  cssFriday.groups.splice(cssCombinedIndex, 1, ...sharedGroups);

  const atsCombinedIndex = atsFriday.groups.findIndex(function (group) {
    return (
      group.time === firstGroup.time &&
      isCombinedProgramGroupSummary_(group.topic)
    );
  });

  if (atsCombinedIndex >= 0) {
    atsFriday.groups.splice(
      atsCombinedIndex,
      1,
      ...sharedGroups.map(function (group) {
        return {
          time: group.time,
          topic: group.topic,
          facilitator: group.facilitator,
          location: group.location,
        };
      }),
    );
  }
}

function getScheduleDay_(schedule, dayName) {
  return (schedule || []).find(function (day) {
    return day.day === dayName;
  });
}

function parseCombinedProgramGroupLine_(value, fallbackTime) {
  const text = sanitizePublicText_(value, 140);
  const match = text.match(
    /^(Men'?s|Women'?s)\s*,?\s*group\s+(?:(?:\(location\s+([^)]+)\))|(.+?))\s*(?:-\s*)?\(?(\d{1,2}:\d{2})(?:\s*(AM|PM))?\)?\s+(.+)$/i,
  );

  if (!match) {
    return null;
  }

  const fallbackPeriodMatch = fallbackTime.match(/\b(AM|PM)$/i);
  const period =
    (match[5] || (fallbackPeriodMatch && fallbackPeriodMatch[1]) || "")
      .toUpperCase();
  const parsedTime = parseTime_(match[4] + " " + period);
  const location = sanitizePublicText_(match[2] || match[3], 80);
  const facilitator = sanitizePublicText_(match[6], 100);

  if (!parsedTime || !location || !facilitator) {
    return null;
  }

  return {
    time: parsedTime.display,
    topic: /^men/i.test(match[1]) ? "Men's group" : "Women's group",
    facilitator: facilitator,
    location: location
      .split(" ")
      .map(function (word) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(" "),
  };
}

function isCombinedProgramGroupSummary_(topic) {
  const text = sanitizePublicText_(topic, 140);

  return (
    /\bgroup/i.test(text) &&
    (/\bmen\b.*\bwomen\b/i.test(text) ||
      /\bwomen\b.*\bmen\b/i.test(text))
  );
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

function readMenu_(week, currentDate) {
  const menuValueRange = getFormattedRanges_(MENU_SPREADSHEET_ID, [
    quoteSheetName_("Menu Items") + "!" + MENU_ITEMS_RANGE,
  ])[0];
  const values = menuValueRange.values || [];
  const isSunday =
    Number(
      Utilities.formatDate(currentDate, FACILITY_TIME_ZONE, "u"),
    ) === 7;
  const sundaySourceIndex = isSunday ? 6 : -1;
  const sunday = createMenuDay_(
    "Sunday",
    week.sunday,
    values,
    sundaySourceIndex,
  );
  const weekdays = DAY_NAMES.slice(0, 6).map(function (day, index) {
    return createMenuDay_(
      day,
      addDays_(week.weekdaySource.monday, index),
      values,
      isSunday ? -1 : index,
    );
  });

  return [sunday].concat(weekdays);
}

function createMenuDay_(day, date, values, sourceDayIndex) {
  const hasSource = sourceDayIndex >= 0;
  const firstMealRow = hasSource
    ? sourceDayIndex * MEALS_PER_DAY
    : -1;

  return {
    day: day,
    date: Utilities.formatDate(date, FACILITY_TIME_ZONE, "yyyy-MM-dd"),
    breakfast: hasSource
      ? sanitizeMenuItems_(values[firstMealRow])
      : [],
    lunch: hasSource
      ? sanitizeMenuItems_(values[firstMealRow + 1])
      : [],
    dinner: hasSource
      ? sanitizeMenuItems_(values[firstMealRow + 2])
      : [],
    soupOfTheDay: hasSource
      ? sanitizeMenuItems_(values[firstMealRow + 3])
      : [],
  };
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
    .reduce(function (publishedStaff, row, rowIndex) {
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
      const bio = sanitizePublicMultilineText_(
        (row || [])[5],
        MAXIMUM_STAFF_BIO_LENGTH,
      );
      const directoryGroup = sanitizeStaffDirectoryGroup_(
        (row || [])[6],
        title,
        isLeadership,
      );
      const displayOrder = sanitizeStaffDisplayOrder_(
        (row || [])[7],
        rowIndex + 1,
      );
      const email = sanitizeStaffEmail_((row || [])[8]);
      const portraitUrl = sanitizeStaffPortraitUrl_((row || [])[9]);
      const phone = sanitizeStaffPhone_((row || [])[10]);
      const slug = createStaffSlug_(name);

      if (isPublished && name && title && slug && !publishedSlugs[slug]) {
        publishedSlugs[slug] = true;
        publishedStaff.push({
          slug: slug,
          name: name,
          title: title,
          departments: departments,
          bio: bio,
          directoryGroup: directoryGroup,
          displayOrder: displayOrder,
          email: email,
          phone: phone,
          portraitUrl: portraitUrl,
        });
      }

      return publishedStaff;
    }, []);
}

function sanitizeStaffDirectoryGroup_(value, title, isLeadership) {
  const requestedGroup = sanitizePublicText_(value, 40);

  if (PUBLIC_STAFF_DIRECTORY_GROUPS.indexOf(requestedGroup) >= 0) {
    return requestedGroup;
  }

  if (isLeadership) {
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

function sanitizeStaffDisplayOrder_(value, fallbackOrder) {
  const text = sanitizePublicText_(value, 4);

  if (!/^\d{1,4}$/.test(text)) {
    return fallbackOrder;
  }

  const displayOrder = Number(text);

  return displayOrder <= 9999 ? displayOrder : fallbackOrder;
}

function sanitizeStaffEmail_(value) {
  const email = sanitizePublicText_(value, 120).toLowerCase();

  return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@hillsidedetox\.com$/.test(
    email,
  )
    ? email
    : "";
}

function sanitizeStaffPhone_(value) {
  const phone = sanitizePublicText_(value, 40);

  return /^(?:\+?1[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}(?:\s*(?:x|ext\.?)\s*\d{1,6})?$/i.test(
    phone,
  )
    ? phone
    : "";
}

function sanitizeStaffPortraitUrl_(value) {
  const portraitSource = sanitizePublicText_(value, 500);

  if (!portraitSource) {
    return "";
  }

  const driveFileMatch = portraitSource.match(
    /^https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]{10,100})(?:\/|$)/i,
  );
  const driveIdMatch = portraitSource.match(
    /^https:\/\/drive\.google\.com\/(?:open|thumbnail|uc)\?(?:[^#]*&)?id=([A-Za-z0-9_-]{10,100})(?:&|$)/i,
  );
  const fileId =
    (driveFileMatch && driveFileMatch[1]) ||
    (driveIdMatch && driveIdMatch[1]) ||
    "";

  return fileId
    ? "https://drive.google.com/thumbnail?id=" + fileId + "&sz=w800"
    : "";
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

function parseDailyActivities_(value) {
  const text = sanitizePublicText_(value, 500);

  if (!text) {
    return [];
  }

  const timePattern =
    /(\d{1,2}(?::\d{2})?\s*(?:AM|PM))\s*[:\-–—]\s*/gi;
  const matches = [];
  let match;

  while ((match = timePattern.exec(text)) !== null) {
    matches.push({
      index: match.index,
      contentIndex: timePattern.lastIndex,
      time: match[1],
    });
  }

  return matches
    .map(function (activityMatch, index) {
      const nextMatch = matches[index + 1];
      const title = sanitizePublicText_(
        text
          .slice(
            activityMatch.contentIndex,
            nextMatch ? nextMatch.index : text.length,
          )
          .replace(/^[\s:–—-]+|[\s:–—-]+$/g, ""),
        180,
      );
      const time = parseTime_(activityMatch.time);

      return time && title
        ? {
            time: time.display,
            title: title,
          }
        : null;
    })
    .filter(function (activity) {
      return activity !== null;
    })
    .slice(0, 6);
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

function sanitizePublicMultilineText_(value, maximumLength) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, " ")
    .split("\n")
    .map(function (line) {
      return line.replace(/[ \t]+/g, " ").trim();
    })
    .filter(function (line) {
      return line.length > 0;
    })
    .join("\n")
    .slice(0, maximumLength);
}
