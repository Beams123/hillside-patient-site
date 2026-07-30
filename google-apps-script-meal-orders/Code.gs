/**
 * Hillside private alternative-meal order destination.
 *
 * Deploy this as a separate Apps Script project from the public schedule,
 * menu, and staff bridge. The public bridge must remain read-only.
 */

const FACILITY_TIME_ZONE = "America/New_York";
const RETENTION_DAYS = 30;
const CUTOFF_MINUTES = 120;
const API_VERSION = 1;
const KITCHEN_WORKBOOK_NAME =
  "Hillside Kitchen Menu & Alternative Meal Orders (Private)";
const ORDERS_SHEET_NAME = "Orders";
const PRINTOUT_SHEET_NAME = "Kitchen Printout";
const KITCHEN_MENU_SHEET_NAME = "Weekly Menu";
const README_SHEET_NAME = "Read Me";
const WEBSITE_MENU_FEED_SPREADSHEET_ID =
  "1qUxUFHaCBmZP5ygjMNX49Q1Kxjbx2QjU3MUQj5KSQdA";
const WEBSITE_MENU_FEED_SHEET_NAME = "Menu Items";
const WEEKLY_MENU_RANGE = "A1:K31";
const WEEKLY_MENU_HEADER_ROWS = 3;
const WEEKLY_MENU_ROWS_PER_DAY = 4;
const WEEKLY_MENU_COLUMN_COUNT = 11;
const WORKBOOK_ID_PROPERTY = "MEAL_ORDER_SPREADSHEET_ID";
const SHARED_SECRET_PROPERTY = "MEAL_ORDER_SHARED_SECRET";
const MAXIMUM_SPECIAL_REQUEST_LENGTH = 200;
const MAXIMUM_FIRST_NAME_LENGTH = 40;
const DUPLICATE_CACHE_SECONDS = 120;
const KITCHEN_MENU_DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const KITCHEN_MENU_MEAL_NAMES = [
  "Breakfast",
  "Lunch",
  "Dinner",
  "Soup of the Day",
];
const ALTERNATIVE_MENU_MAIN_ITEMS = [
  "Hamburger",
  "Cheeseburger",
  "All-beef hot dog",
  "Grilled cheese",
  "Flat grilled chicken breast",
  "Baked cod loin",
  "Chicken fingers (3)",
  "Mozzarella sticks (5)",
  "French fries",
  "Veggie burger",
  "Lentils",
  "Fresh fruit cup",
];
const BURGER_BACON_SELECTION = "Burger add-on: Bacon";
const GRILLED_CHEESE_CHEESE_OPTIONS = [
  "Grilled cheese cheese: American",
  "Grilled cheese cheese: Cheddar",
  "Grilled cheese cheese: Provolone",
  "Grilled cheese cheese: Swiss",
];
const GRILLED_CHEESE_BREAD_OPTIONS = [
  "Grilled cheese bread: Texas Toast",
  "Grilled cheese bread: Wheat Bread",
];
const GRILLED_CHEESE_ADD_ON_OPTIONS = [
  "Grilled cheese add-on: Bacon",
  "Grilled cheese add-on: Ham",
  "Grilled cheese add-on: Turkey",
  "Grilled cheese add-on: Tomato",
];
const GLUTEN_FREE_REQUEST_OPTIONS = [
  "Gluten-free bread requested",
  "Gluten-free snack requested",
];
const ALTERNATIVE_MENU_ITEMS = ALTERNATIVE_MENU_MAIN_ITEMS.concat(
  [BURGER_BACON_SELECTION],
  GRILLED_CHEESE_CHEESE_OPTIONS,
  GRILLED_CHEESE_BREAD_OPTIONS,
  GRILLED_CHEESE_ADD_ON_OPTIONS,
  GLUTEN_FREE_REQUEST_OPTIONS,
);
const PROGRAM_MEAL_TIMES = {
  ATS: {
    lunch: { label: "Lunch", time: "12:30 PM", timeValue: "12:30" },
    dinner: { label: "Dinner", time: "5:30 PM", timeValue: "17:30" },
  },
  CSS: {
    lunch: { label: "Lunch", time: "12:00 PM", timeValue: "12:00" },
    dinner: { label: "Dinner", time: "5:00 PM", timeValue: "17:00" },
  },
};
const ORDER_HEADERS = [
  "Receipt",
  "Submitted at",
  "First name",
  "Last initial",
  "Program",
  "Target date",
  "Meal",
  "Serving time",
  "Items",
  "Special requests",
  "Status",
  "Delete after",
];

function doGet() {
  return jsonOutput_({
    ok: true,
    service: "Hillside private meal-order destination",
  });
}

function doPost(event) {
  try {
    const payload = parsePayload_(event);
    const properties = PropertiesService.getScriptProperties();
    const expectedSecret = properties.getProperty(SHARED_SECRET_PROPERTY);
    const workbookId = properties.getProperty(WORKBOOK_ID_PROPERTY);

    if (
      !expectedSecret ||
      !workbookId ||
      payload.sharedSecret !== expectedSecret
    ) {
      return jsonOutput_({
        ok: false,
        message: "Request authorization failed.",
      });
    }

    const order = validateOrder_(payload);
    const duplicateKey = getDuplicateCacheKey_(order);
    const cache = CacheService.getScriptCache();
    const cachedSubmission = readCachedSubmission_(
      cache.get(duplicateKey),
    );

    if (cachedSubmission) {
      return jsonOutput_({
        ok: true,
        receipt: cachedSubmission.receipt,
        submittedAt: cachedSubmission.submittedAt,
      });
    }

    const lock = LockService.getScriptLock();
    lock.waitLock(5000);

    try {
      const secondCachedSubmission = readCachedSubmission_(
        cache.get(duplicateKey),
      );

      if (secondCachedSubmission) {
        return jsonOutput_({
          ok: true,
          receipt: secondCachedSubmission.receipt,
          submittedAt: secondCachedSubmission.submittedAt,
        });
      }

      const submittedAt = new Date();
      const receipt = createReceipt_(order.targetDate);
      const servingAt = parseFacilityDateTime_(
        order.targetDate,
        order.servingTimeValue,
      );
      const targetDate = parseFacilityDateTime_(
        order.targetDate,
        "12:00",
      );
      const deleteAfter = new Date(
        servingAt.getTime() + RETENTION_DAYS * 24 * 60 * 60 * 1000,
      );
      const workbook = SpreadsheetApp.openById(workbookId);
      const ordersSheet = workbook.getSheetByName(ORDERS_SHEET_NAME);

      if (!ordersSheet) {
        throw new Error("Private order sheet is not configured.");
      }

      ordersSheet.appendRow([
        receipt,
        submittedAt,
        protectCellText_(order.firstName),
        protectCellText_(order.lastInitial),
        order.program,
        targetDate,
        order.mealLabel,
        order.servingTime,
        protectCellText_(order.items.join(", ")),
        protectCellText_(order.specialRequests),
        "Active",
        deleteAfter,
      ]);

      const appendedRow = ordersSheet.getLastRow();
      ordersSheet
        .getRange(appendedRow, 2)
        .setNumberFormat("mmm d, yyyy h:mm AM/PM");
      ordersSheet
        .getRange(appendedRow, 6)
        .setNumberFormat("mmm d, yyyy");
      ordersSheet
        .getRange(appendedRow, 12)
        .setNumberFormat("mmm d, yyyy h:mm AM/PM");
      cache.put(
        duplicateKey,
        JSON.stringify({
          receipt: receipt,
          submittedAt: submittedAt.toISOString(),
        }),
        DUPLICATE_CACHE_SECONDS,
      );

      return jsonOutput_({
        ok: true,
        receipt: receipt,
        submittedAt: submittedAt.toISOString(),
      });
    } finally {
      lock.releaseLock();
    }
  } catch (error) {
    return jsonOutput_({
      ok: false,
      message: getSafeErrorMessage_(error),
    });
  }
}

/**
 * Run once from the Apps Script editor before deploying the web app.
 * It creates the private kitchen workbook, makes its weekly menu the editable
 * source of truth, prepares the current-meal printout, installs
 * publishing/deletion triggers, and generates a random shared secret.
 */
function setupMealOrderSystem() {
  const properties = PropertiesService.getScriptProperties();
  let workbookId = properties.getProperty(WORKBOOK_ID_PROPERTY);
  let workbook;

  if (workbookId) {
    workbook = SpreadsheetApp.openById(workbookId);
  } else {
    workbook = SpreadsheetApp.create(KITCHEN_WORKBOOK_NAME);
    workbookId = workbook.getId();
    properties.setProperty(WORKBOOK_ID_PROPERTY, workbookId);
  }

  if (!properties.getProperty(SHARED_SECRET_PROPERTY)) {
    properties.setProperty(
      SHARED_SECRET_PROPERTY,
      Utilities.getUuid().replace(/-/g, "") +
        Utilities.getUuid().replace(/-/g, ""),
    );
  }

  workbook.rename(KITCHEN_WORKBOOK_NAME);
  workbook.setSpreadsheetTimeZone(FACILITY_TIME_ZONE);
  workbook.setRecalculationInterval(
    SpreadsheetApp.RecalculationInterval.MINUTE,
  );
  configureOrdersSheet_(workbook);
  configurePrintoutSheet_(workbook);
  configureKitchenMenuSheet_(workbook);
  configureReadMeSheet_(workbook);
  ensurePurgeTrigger_();
  migrateLegacyMenuRefreshTriggers_();
  ensureMenuPublishTrigger_();
  publishKitchenMenu_(workbook);

  console.log("Private order workbook created: " + workbook.getUrl());
  console.log(
    "The shared secret is available under Project Settings → Script Properties.",
  );

  return {
    workbookUrl: workbook.getUrl(),
    retentionDays: RETENTION_DAYS,
    cutoffMinutes: CUTOFF_MINUTES,
  };
}

/**
 * Run after setup or any deployment change to confirm required private
 * properties, sheets, and automatic triggers are present.
 */
function verifyMealOrderSystem() {
  const properties = PropertiesService.getScriptProperties();
  const workbookId = properties.getProperty(WORKBOOK_ID_PROPERTY);
  const sharedSecret = properties.getProperty(SHARED_SECRET_PROPERTY);

  if (!workbookId || !sharedSecret || sharedSecret.length < 32) {
    throw new Error("Meal-order Script Properties are incomplete.");
  }

  const workbook = SpreadsheetApp.openById(workbookId);
  const requiredSheets = [
    ORDERS_SHEET_NAME,
    PRINTOUT_SHEET_NAME,
    KITCHEN_MENU_SHEET_NAME,
    README_SHEET_NAME,
  ];

  requiredSheets.forEach(function (sheetName) {
    if (!workbook.getSheetByName(sheetName)) {
      throw new Error("Missing private workbook tab: " + sheetName);
    }
  });

  const hasPurgeTrigger = ScriptApp.getProjectTriggers().some(function (
    trigger,
  ) {
    return trigger.getHandlerFunction() === "purgeExpiredMealOrders";
  });

  if (!hasPurgeTrigger) {
    throw new Error("The automatic 30-day deletion trigger is missing.");
  }

  const hasMenuPublishTrigger = ScriptApp.getProjectTriggers().some(function (
    trigger,
  ) {
    return trigger.getHandlerFunction() === "publishKitchenMenu";
  });

  if (!hasMenuPublishTrigger) {
    throw new Error(
      "The automatic kitchen-menu publishing trigger is missing.",
    );
  }

  configureKitchenMenuSheet_(workbook);
  publishKitchenMenu_(workbook);
  console.log("Meal-order system verified: " + workbook.getUrl());

  return true;
}

/**
 * Runs automatically each morning and may also be run manually.
 * Orders are deleted 30 days after the requested meal's serving time.
 */
function purgeExpiredMealOrders() {
  const workbookId = PropertiesService.getScriptProperties().getProperty(
    WORKBOOK_ID_PROPERTY,
  );

  if (!workbookId) {
    throw new Error("Private order workbook is not configured.");
  }

  const sheet = SpreadsheetApp.openById(workbookId).getSheetByName(
    ORDERS_SHEET_NAME,
  );

  if (!sheet || sheet.getLastRow() < 2) {
    return 0;
  }

  const deleteAfterValues = sheet
    .getRange(2, 12, sheet.getLastRow() - 1, 1)
    .getValues();
  const now = new Date();
  let deletedRows = 0;

  for (let index = deleteAfterValues.length - 1; index >= 0; index -= 1) {
    const deleteAfter = deleteAfterValues[index][0];

    if (
      deleteAfter instanceof Date &&
      !Number.isNaN(deleteAfter.getTime()) &&
      deleteAfter.getTime() <= now.getTime()
    ) {
      sheet.deleteRow(index + 2);
      deletedRows += 1;
    }
  }

  console.log("Expired meal orders deleted: " + deletedRows);

  return deletedRows;
}

/**
 * Runs automatically every five minutes and may also be run manually.
 * It publishes only the approved Weekly Menu cells to the separate website
 * menu feed. It never reads or copies patient order rows.
 */
function publishKitchenMenu() {
  const workbookId = PropertiesService.getScriptProperties().getProperty(
    WORKBOOK_ID_PROPERTY,
  );

  if (!workbookId) {
    throw new Error("Private order workbook is not configured.");
  }

  const workbook = SpreadsheetApp.openById(workbookId);
  publishKitchenMenu_(workbook);

  console.log("Kitchen menu published to the website feed.");

  return true;
}

/**
 * Compatibility handler for the former source-to-kitchen refresh trigger.
 * Existing triggers become safe immediately after this code is saved: they
 * publish outward instead of overwriting the editable kitchen menu.
 */
function refreshKitchenMenu() {
  return publishKitchenMenu();
}

function configureOrdersSheet_(workbook) {
  let sheet = workbook.getSheetByName(ORDERS_SHEET_NAME);

  if (!sheet) {
    const sheets = workbook.getSheets();
    sheet =
      sheets.length === 1 && sheets[0].getLastRow() === 0
        ? sheets[0].setName(ORDERS_SHEET_NAME)
        : workbook.insertSheet(ORDERS_SHEET_NAME);
  }

  sheet
    .getRange(1, 1, 1, ORDER_HEADERS.length)
    .setValues([ORDER_HEADERS])
    .setBackground("#b8913f")
    .setFontColor("#0e0e0c")
    .setFontWeight("bold");
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(1, 160);
  sheet.setColumnWidth(2, 190);
  sheet.setColumnWidth(3, 130);
  sheet.setColumnWidth(4, 90);
  sheet.setColumnWidth(5, 80);
  sheet.setColumnWidth(6, 130);
  sheet.setColumnWidth(7, 90);
  sheet.setColumnWidth(8, 110);
  sheet.setColumnWidth(9, 260);
  sheet.setColumnWidth(10, 300);
  sheet.setColumnWidth(11, 90);
  sheet.setColumnWidth(12, 190);
  sheet.getRange("B:B").setNumberFormat("mmm d, yyyy h:mm AM/PM");
  sheet.getRange("F:F").setNumberFormat("mmm d, yyyy");
  sheet.getRange("L:L").setNumberFormat("mmm d, yyyy h:mm AM/PM");
}

function configurePrintoutSheet_(workbook) {
  let sheet = workbook.getSheetByName(PRINTOUT_SHEET_NAME);

  if (!sheet) {
    sheet = workbook.insertSheet(PRINTOUT_SHEET_NAME, 0);
  }

  sheet.clear();
  sheet.getRange("A1:F1").merge();
  sheet
    .getRange("A1")
    .setValue("Hillside Alternative Meal Orders")
    .setFontSize(18)
    .setFontWeight("bold")
    .setFontColor("#0e0e0c")
    .setBackground("#d9b968")
    .setHorizontalAlignment("center");
  sheet.getRange("A2").setValue("Current meal").setFontWeight("bold");
  sheet
    .getRange("B2")
    .setFormula('=IF(HOUR(NOW())<15,"Lunch","Dinner")')
    .setFontWeight("bold");
  sheet.getRange("A3").setValue("Date").setFontWeight("bold");
  sheet
    .getRange("B3")
    .setFormula("=TODAY()")
    .setNumberFormat("dddd, mmmm d, yyyy")
    .setFontWeight("bold");
  sheet
    .getRange("A5:F5")
    .setValues([
      [
        "Program",
        "Serving time",
        "First name",
        "Last initial",
        "Items",
        "Special requests",
      ],
    ])
    .setBackground("#b8913f")
    .setFontColor("#0e0e0c")
    .setFontWeight("bold");
  sheet
    .getRange("A6")
    .setFormula(
      '=IFERROR(SORT(FILTER({Orders!E2:E,Orders!H2:H,Orders!C2:C,Orders!D2:D,Orders!I2:I,Orders!J2:J},Orders!F2:F=$B$3,Orders!G2:G=$B$2,Orders!K2:K="Active"),1,TRUE,2,TRUE,3,TRUE),{"No active orders","","","","",""})',
    );
  sheet.setFrozenRows(5);
  sheet.setColumnWidth(1, 90);
  sheet.setColumnWidth(2, 110);
  sheet.setColumnWidth(3, 130);
  sheet.setColumnWidth(4, 90);
  sheet.setColumnWidth(5, 280);
  sheet.setColumnWidth(6, 320);
  sheet.getRange("A:F").setVerticalAlignment("top").setWrap(true);
  sheet.getRange("A2:B3").setBackground("#f5f0e4");
  sheet.getRange("A1:F200").setFontFamily("Arial");
}

function configureKitchenMenuSheet_(workbook) {
  let sheet = workbook.getSheetByName(KITCHEN_MENU_SHEET_NAME);

  if (!sheet) {
    sheet = workbook.insertSheet(KITCHEN_MENU_SHEET_NAME, 1);
  }

  const expectedWeeklyRows =
    KITCHEN_MENU_DAY_NAMES.length * WEEKLY_MENU_ROWS_PER_DAY;
  const dayValues = [];
  const dateFormulas = [];
  const mealValues = [];

  for (let rowIndex = 0; rowIndex < expectedWeeklyRows; rowIndex += 1) {
    const dayIndex = Math.floor(rowIndex / WEEKLY_MENU_ROWS_PER_DAY);
    const mealIndex = rowIndex % WEEKLY_MENU_ROWS_PER_DAY;

    dayValues.push([KITCHEN_MENU_DAY_NAMES[dayIndex]]);
    dateFormulas.push([
      rowIndex === 0
        ? "=TODAY()-WEEKDAY(TODAY(),1)+1"
        : "=$B$4+" + dayIndex,
    ]);
    mealValues.push([KITCHEN_MENU_MEAL_NAMES[mealIndex]]);
  }

  sheet.getRange(1, 1, 2, WEEKLY_MENU_COLUMN_COUNT).breakApart();
  sheet.getRange("A1").setValue("KITCHEN WEEKLY MENU");
  sheet
    .getRange("D1")
    .setValue("EDIT THIS MENU — WEBSITE PUBLISHES AUTOMATICALLY");
  sheet.getRange("A2").setValue("EDITABLE SOURCE");
  sheet
    .getRange("D2")
    .setValue(
      "Enter one food in each yellow cell. Changes reach the website feed within five minutes.",
    );
  sheet
    .getRange("A3:K3")
    .setValues([
      [
        "Day",
        "Date",
        "Meal",
        "Item 1",
        "Item 2",
        "Item 3",
        "Item 4",
        "Item 5",
        "Item 6",
        "Item 7",
        "Item 8",
      ],
    ]);
  sheet.getRange(4, 1, expectedWeeklyRows, 1).setValues(dayValues);
  sheet.getRange(4, 2, expectedWeeklyRows, 1).setFormulas(dateFormulas);
  sheet.getRange(4, 3, expectedWeeklyRows, 1).setValues(mealValues);
  sheet
    .getRange(
      1,
      1,
      WEEKLY_MENU_HEADER_ROWS + expectedWeeklyRows,
      WEEKLY_MENU_COLUMN_COUNT,
    )
    .setFontFamily("Arial")
    .setVerticalAlignment("middle")
    .setWrap(true);
  sheet.getRange("A1:C1").merge();
  sheet.getRange("D1:K1").merge();
  sheet.getRange("A2:C2").merge();
  sheet.getRange("D2:K2").merge();
  sheet
    .getRange("A1:K1")
    .setBackground("#171612")
    .setFontColor("#e0c27f")
    .setFontSize(14)
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  sheet
    .getRange("A2:K2")
    .setBackground("#f5efe2")
    .setFontColor("#28261f")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  sheet
    .getRange("A3:K3")
    .setBackground("#d2b067")
    .setFontColor("#0a0a09")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  sheet
    .getRange("A4:C31")
    .setBackground("#f5efe2")
    .setFontColor("#28261f")
    .setFontWeight("bold")
    .setHorizontalAlignment("center");
  sheet
    .getRange("D4:K31")
    .setBackground("#fff3c4")
    .setFontColor("#28261f")
    .setHorizontalAlignment("left");
  sheet.getRange("B4:B31").setNumberFormat("mmm d");
  sheet.setFrozenRows(3);
  sheet.setFrozenColumns(3);
  sheet.setHiddenGridlines(true);
  sheet.setColumnWidth(1, 110);
  sheet.setColumnWidth(2, 90);
  sheet.setColumnWidth(3, 130);

  for (let column = 4; column <= WEEKLY_MENU_COLUMN_COUNT; column += 1) {
    sheet.setColumnWidth(column, 150);
  }

  sheet.setRowHeight(1, 34);
  sheet.setRowHeight(2, 44);
  sheet.setRowHeights(3, 29, 34);
}

function publishKitchenMenu_(workbook) {
  const sourceSheet = workbook.getSheetByName(KITCHEN_MENU_SHEET_NAME);

  if (!sourceSheet) {
    throw new Error("The editable kitchen menu tab is not available.");
  }

  const sourceValues = sourceSheet.getRange(WEEKLY_MENU_RANGE).getValues();
  const expectedWeeklyRows =
    KITCHEN_MENU_DAY_NAMES.length * WEEKLY_MENU_ROWS_PER_DAY;

  if (
    sourceValues.length !== WEEKLY_MENU_HEADER_ROWS + expectedWeeklyRows ||
    sourceValues.some(function (row) {
      return row.length !== WEEKLY_MENU_COLUMN_COUNT;
    })
  ) {
    throw new Error("The editable kitchen menu has an unexpected layout.");
  }

  const weeklyRows = sourceValues.slice(WEEKLY_MENU_HEADER_ROWS);
  const sundayRows = weeklyRows.slice(0, WEEKLY_MENU_ROWS_PER_DAY);
  const mondayThroughSaturdayRows = weeklyRows.slice(
    WEEKLY_MENU_ROWS_PER_DAY,
  );
  const websiteOrderRows = mondayThroughSaturdayRows.concat(sundayRows);
  const websiteDayNames = KITCHEN_MENU_DAY_NAMES.slice(1).concat("Sunday");
  const currentSunday = getCurrentFacilitySunday_();
  const publishedRows = websiteOrderRows.map(function (row, rowIndex) {
    const dayIndex = Math.floor(rowIndex / WEEKLY_MENU_ROWS_PER_DAY);
    const mealIndex = rowIndex % WEEKLY_MENU_ROWS_PER_DAY;
    const dateOffset = dayIndex === 6 ? 0 : dayIndex + 1;
    const itemValues = row
      .slice(3, WEEKLY_MENU_COLUMN_COUNT)
      .map(sanitizeMenuFeedItem_);

    return [
      websiteDayNames[dayIndex],
      addDaysToDate_(currentSunday, dateOffset),
      KITCHEN_MENU_MEAL_NAMES[mealIndex],
    ].concat(itemValues);
  });
  const headerRow = [
    "Day",
    "Date",
    "Meal",
    "Item 1",
    "Item 2",
    "Item 3",
    "Item 4",
    "Item 5",
    "Item 6",
    "Item 7",
    "Item 8",
  ];

  const targetWorkbook = SpreadsheetApp.openById(
    WEBSITE_MENU_FEED_SPREADSHEET_ID,
  );
  const targetSheet = targetWorkbook.getSheetByName(
    WEBSITE_MENU_FEED_SHEET_NAME,
  );

  if (!targetSheet) {
    throw new Error("The website menu feed tab is not available.");
  }

  targetSheet.getRange("A1").setValue("PUBLIC WEBSITE MENU FEED");
  targetSheet
    .getRange("D1")
    .setValue("AUTOMATICALLY PUBLISHED FROM THE PRIVATE KITCHEN MENU");
  targetSheet.getRange("A2").setValue("READ-ONLY FEED");
  targetSheet
    .getRange("D2")
    .setValue(
      "Edit Weekly Menu in the private kitchen workbook; do not edit this feed.",
    );
  targetSheet
    .getRange(
      3,
      1,
      1 + publishedRows.length,
      WEEKLY_MENU_COLUMN_COUNT,
    )
    .setValues([headerRow].concat(publishedRows));
  SpreadsheetApp.flush();
}

function getCurrentFacilitySunday_() {
  const currentDateText = Utilities.formatDate(
    new Date(),
    FACILITY_TIME_ZONE,
    "yyyy-MM-dd",
  );
  const currentDate = parseFacilityDateTime_(currentDateText, "12:00");
  const dayNumber = Number(
    Utilities.formatDate(currentDate, FACILITY_TIME_ZONE, "u"),
  );

  return addDaysToDate_(currentDate, -(dayNumber % 7));
}

function addDaysToDate_(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function sanitizeMenuFeedItem_(value) {
  const normalized = String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 120);

  return protectCellText_(normalized);
}

function configureReadMeSheet_(workbook) {
  let sheet = workbook.getSheetByName(README_SHEET_NAME);

  if (!sheet) {
    sheet = workbook.insertSheet(README_SHEET_NAME);
  }

  sheet.clear();
  sheet.getRange("A1").setValue("Private Hillside meal-order workbook");
  sheet.getRange("A1").setFontSize(18).setFontWeight("bold");
  sheet.getRange("A3:A13").setValues([
    [
      "This workbook contains identifiable patient meal requests. Share it only with staff approved for this workflow.",
    ],
    [
      "Kitchen staff: edit the yellow cells in Weekly Menu. That tab is the only menu staff need to maintain.",
    ],
    [
      "Weekly Menu publishes only its approved menu cells to the website feed every five minutes. It never publishes patient order rows.",
    ],
    [
      "RS staff: open the Kitchen Printout tab and print the current sheet at lunch or dinner.",
    ],
    [
      "The Kitchen Printout changes from Lunch to Dinner automatically at 3:00 PM Eastern.",
    ],
    [
      "Orders are sorted by program, serving time, and first name. Future orders remain in Orders until their meal date.",
    ],
    [
      "Patients must submit alternative-meal requests at least 2 hours before serving time; the website enforces this deadline automatically.",
    ],
    [
      "Do not copy orders into email, personal drives, chat systems, or the public schedule/menu workbooks.",
    ],
    [
      "Do not enter allergies, diagnoses, medications, or other clinical information in this workbook.",
    ],
    [
      "The automatic purge permanently deletes an order 30 days after its requested meal.",
    ],
    [
      "If the website cannot record an order, use the paper process and notify the designated website administrator.",
    ],
  ]);
  sheet.setColumnWidth(1, 850);
  sheet.getRange("A1:A13").setWrap(true).setVerticalAlignment("top");
  sheet.getRange("A3:A13").setFontSize(11);
}

function ensurePurgeTrigger_() {
  const hasTrigger = ScriptApp.getProjectTriggers().some(function (trigger) {
    return trigger.getHandlerFunction() === "purgeExpiredMealOrders";
  });

  if (!hasTrigger) {
    ScriptApp.newTrigger("purgeExpiredMealOrders")
      .timeBased()
      .everyDays(1)
      .atHour(4)
      .create();
  }
}

function migrateLegacyMenuRefreshTriggers_() {
  ScriptApp.getProjectTriggers().forEach(function (trigger) {
    if (trigger.getHandlerFunction() === "refreshKitchenMenu") {
      ScriptApp.deleteTrigger(trigger);
    }
  });
}

function ensureMenuPublishTrigger_() {
  const hasTrigger = ScriptApp.getProjectTriggers().some(function (trigger) {
    return trigger.getHandlerFunction() === "publishKitchenMenu";
  });

  if (!hasTrigger) {
    ScriptApp.newTrigger("publishKitchenMenu")
      .timeBased()
      .everyMinutes(5)
      .create();
  }
}

function parsePayload_(event) {
  if (
    !event ||
    !event.postData ||
    typeof event.postData.contents !== "string" ||
    event.postData.contents.length > 8000
  ) {
    throw new Error("The meal request could not be read.");
  }

  const payload = JSON.parse(event.postData.contents);

  if (!payload || typeof payload !== "object") {
    throw new Error("The meal request could not be read.");
  }

  return payload;
}

function validateOrder_(payload) {
  if (payload.apiVersion !== API_VERSION) {
    throw new Error("The meal request version is not supported.");
  }

  const firstName = readRequiredText_(
    payload.firstName,
    MAXIMUM_FIRST_NAME_LENGTH,
  );
  const lastInitial = readRequiredText_(payload.lastInitial, 1).toUpperCase();
  const program = payload.program;
  const targetDate = payload.targetDate;
  const meal = payload.meal;
  const specialRequests = readOptionalText_(
    payload.specialRequests,
    MAXIMUM_SPECIAL_REQUEST_LENGTH,
  );

  if (
    !/^[\p{L}][\p{L}\p{M}' -]{0,39}$/u.test(firstName) ||
    !/^\p{L}$/u.test(lastInitial) ||
    !PROGRAM_MEAL_TIMES[program] ||
    !PROGRAM_MEAL_TIMES[program][meal] ||
    !isValidDate_(targetDate)
  ) {
    throw new Error("The meal request details are invalid.");
  }

  if (
    !Array.isArray(payload.items) ||
    payload.items.length === 0 ||
    payload.items.length > ALTERNATIVE_MENU_ITEMS.length
  ) {
    throw new Error("Choose at least one alternative-menu item.");
  }

  const items = payload.items.map(function (item) {
    const normalized = readRequiredText_(item, 40);

    if (ALTERNATIVE_MENU_ITEMS.indexOf(normalized) < 0) {
      throw new Error("An alternative-menu item is invalid.");
    }

    return normalized;
  });
  const uniqueItems = items.filter(function (item, index) {
    return items.indexOf(item) === index;
  });

  if (uniqueItems.length !== items.length) {
    throw new Error("The requested items contain duplicates.");
  }

  const hasMainItem = items.some(function (item) {
    return ALTERNATIVE_MENU_MAIN_ITEMS.indexOf(item) >= 0;
  });

  if (!hasMainItem) {
    throw new Error("Choose at least one alternative-menu item.");
  }

  const hasBurger =
    items.indexOf("Hamburger") >= 0 ||
    items.indexOf("Cheeseburger") >= 0;

  if (
    items.indexOf(BURGER_BACON_SELECTION) >= 0 &&
    !hasBurger
  ) {
    throw new Error(
      "Bacon can be added to a hamburger or cheeseburger.",
    );
  }

  const hasGrilledCheese = items.indexOf("Grilled cheese") >= 0;
  const selectedCheeses = items.filter(function (item) {
    return GRILLED_CHEESE_CHEESE_OPTIONS.indexOf(item) >= 0;
  });
  const selectedBreads = items.filter(function (item) {
    return GRILLED_CHEESE_BREAD_OPTIONS.indexOf(item) >= 0;
  });
  const selectedGrilledCheeseAddOns = items.filter(function (item) {
    return GRILLED_CHEESE_ADD_ON_OPTIONS.indexOf(item) >= 0;
  });

  if (
    hasGrilledCheese &&
    (selectedCheeses.length !== 1 || selectedBreads.length !== 1)
  ) {
    throw new Error(
      "Choose one cheese and one bread for the grilled cheese.",
    );
  }

  if (
    !hasGrilledCheese &&
    (selectedCheeses.length > 0 ||
      selectedBreads.length > 0 ||
      selectedGrilledCheeseAddOns.length > 0)
  ) {
    throw new Error(
      "Choose grilled cheese before adding its cheese, bread, or add-ons.",
    );
  }

  const mealConfiguration = PROGRAM_MEAL_TIMES[program][meal];
  const servingAt = parseFacilityDateTime_(
    targetDate,
    mealConfiguration.timeValue,
  );
  const cutoffAt = new Date(
    servingAt.getTime() - CUTOFF_MINUTES * 60 * 1000,
  );
  const maximumTarget = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  );

  if (Date.now() >= cutoffAt.getTime()) {
    throw new Error(
      "Online requests for this meal closed 2 hours before serving time.",
    );
  }

  if (servingAt.getTime() > maximumTarget.getTime()) {
    throw new Error("That meal is outside the current request window.");
  }

  return {
    firstName: firstName,
    lastInitial: lastInitial,
    program: program,
    targetDate: targetDate,
    meal: meal,
    mealLabel: mealConfiguration.label,
    servingTime: mealConfiguration.time,
    servingTimeValue: mealConfiguration.timeValue,
    items: items,
    specialRequests: specialRequests,
  };
}

function readRequiredText_(value, maximumLength) {
  if (typeof value !== "string") {
    throw new Error("A required meal request field is invalid.");
  }

  const normalized = value.trim().replace(/\s+/g, " ");

  if (!normalized || normalized.length > maximumLength) {
    throw new Error("A required meal request field is invalid.");
  }

  return normalized;
}

function readOptionalText_(value, maximumLength) {
  if (typeof value !== "string") {
    throw new Error("The special request is invalid.");
  }

  const normalized = value.trim().replace(/\r\n?/g, "\n");

  if (normalized.length > maximumLength) {
    throw new Error("The special request is too long.");
  }

  return normalized;
}

function isValidDate_(value) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  try {
    return (
      Utilities.formatDate(
        parseFacilityDateTime_(value, "12:00"),
        FACILITY_TIME_ZONE,
        "yyyy-MM-dd",
      ) === value
    );
  } catch (error) {
    return false;
  }
}

function parseFacilityDateTime_(date, time) {
  return Utilities.parseDate(
    date + " " + time,
    FACILITY_TIME_ZONE,
    "yyyy-MM-dd HH:mm",
  );
}

function protectCellText_(value) {
  if (!value) {
    return "";
  }

  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function createReceipt_(targetDate) {
  return (
    "AMR-" +
    targetDate.replace(/-/g, "") +
    "-" +
    Utilities.getUuid().replace(/-/g, "").slice(0, 8).toUpperCase()
  );
}

function getDuplicateCacheKey_(order) {
  const fingerprint = [
    order.firstName.toLowerCase(),
    order.lastInitial,
    order.program,
    order.targetDate,
    order.meal,
    order.items.join(","),
    order.specialRequests,
  ].join("|");
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    fingerprint,
  );

  return (
    "meal-order-" +
    Utilities.base64EncodeWebSafe(digest).replace(/=+$/, "").slice(0, 40)
  );
}

function readCachedSubmission_(value) {
  if (!value) {
    return null;
  }

  try {
    const submission = JSON.parse(value);

    if (
      submission &&
      typeof submission.receipt === "string" &&
      typeof submission.submittedAt === "string"
    ) {
      return submission;
    }
  } catch (error) {
    return null;
  }

  return null;
}

function getSafeErrorMessage_(error) {
  const message =
    error && typeof error.message === "string" ? error.message : "";
  const allowedMessages = [
    "The meal request could not be read.",
    "The meal request version is not supported.",
    "The meal request details are invalid.",
    "Choose at least one alternative-menu item.",
    "An alternative-menu item is invalid.",
    "The requested items contain duplicates.",
    "Bacon can be added to a hamburger or cheeseburger.",
    "Choose one cheese and one bread for the grilled cheese.",
    "Choose grilled cheese before adding its cheese, bread, or add-ons.",
    "Online requests for this meal closed 2 hours before serving time.",
    "That meal is outside the current request window.",
    "A required meal request field is invalid.",
    "The special request is invalid.",
    "The special request is too long.",
  ];

  return allowedMessages.indexOf(message) >= 0
    ? message
    : "The meal request could not be safely recorded.";
}

function jsonOutput_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
