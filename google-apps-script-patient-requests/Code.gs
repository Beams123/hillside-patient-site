/**
 * Hillside private patient-request destination.
 *
 * Deploy this as a separate Apps Script project from both the public data
 * bridge and the alternative-meal destination. It creates separate private
 * workbooks for grievances, package requests, and visitor requests so access
 * can be granted by management role.
 */

const FACILITY_TIME_ZONE = "America/New_York";
const API_VERSION = 1;
const REQUESTS_SHEET_NAME = "Requests";
const README_SHEET_NAME = "Read Me";
const SHARED_SECRET_PROPERTY = "PATIENT_REQUESTS_SHARED_SECRET";
const GRIEVANCE_WORKBOOK_PROPERTY =
  "GRIEVANCE_REQUESTS_SPREADSHEET_ID";
const PACKAGE_WORKBOOK_PROPERTY =
  "PACKAGE_REQUESTS_SPREADSHEET_ID";
const VISITOR_WORKBOOK_PROPERTY =
  "VISITOR_REQUESTS_SPREADSHEET_ID";
const DUPLICATE_CACHE_SECONDS = 600;
const MAXIMUM_REQUEST_CHARACTERS = 25000;
const MAXIMUM_FUTURE_VISIT_DAYS = 35;
const VISIT_WINDOW = "2:00–5:00 PM";
const STATUS_OPTIONS = [
  "Pending",
  "In review",
  "Approved",
  "Denied",
  "Follow-up needed",
  "Complete",
];

const GRIEVANCE_HEADERS = [
  "Receipt",
  "Submitted at",
  "First name",
  "Last initial",
  "Incident date",
  "Incident time",
  "Staff members involved",
  "Grievance",
  "Status",
  "Reviewed by",
  "Reviewed at",
  "Follow-up notes",
];

const PACKAGE_HEADERS = [
  "Receipt",
  "Submitted at",
  "First name",
  "Last initial",
  "Requested item",
  "Retailer",
  "Quantity",
  "Reason needed",
  "Criteria confirmed",
  "Status",
  "Reviewed by",
  "Decision at",
  "Management notes",
];

const VISITOR_HEADERS = [
  "Receipt",
  "Submitted at",
  "First name",
  "Last initial",
  "Visit date",
  "Visit window",
  "Visitor 1 name",
  "Visitor 1 relationship",
  "Visitor 2 name",
  "Visitor 2 relationship",
  "Visitor 3 name",
  "Visitor 3 relationship",
  "Visitor 4 name",
  "Visitor 4 relationship",
  "Family visit confirmed",
  "Status",
  "Reviewed by",
  "Reviewed at",
  "Management notes",
];

function doGet() {
  return jsonOutput_({
    ok: true,
    service: "Hillside private patient-request destination",
  });
}

function doPost(event) {
  try {
    const payload = parsePayload_(event);
    const properties = PropertiesService.getScriptProperties();
    const expectedSecret = properties.getProperty(
      SHARED_SECRET_PROPERTY,
    );

    if (
      !expectedSecret ||
      payload.sharedSecret !== expectedSecret
    ) {
      return jsonOutput_({
        ok: false,
        message: "Request authorization failed.",
      });
    }

    const request = validateRequest_(payload.request);
    const duplicateKey = getDuplicateCacheKey_(
      payload.requestId,
      request.kind,
    );
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
      const receipt = createReceipt_(request.kind, submittedAt);
      appendRequest_(request, receipt, submittedAt, properties);
      const response = {
        receipt: receipt,
        submittedAt: submittedAt.toISOString(),
      };

      cache.put(
        duplicateKey,
        JSON.stringify(response),
        DUPLICATE_CACHE_SECONDS,
      );

      return jsonOutput_({
        ok: true,
        receipt: response.receipt,
        submittedAt: response.submittedAt,
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
 * Run once from the Apps Script editor. It creates three private workbooks,
 * configures their management-review sheets, and creates a random shared
 * secret in Script Properties.
 */
function setupPatientRequestSystem() {
  const properties = PropertiesService.getScriptProperties();

  if (!properties.getProperty(SHARED_SECRET_PROPERTY)) {
    properties.setProperty(
      SHARED_SECRET_PROPERTY,
      Utilities.getUuid().replace(/-/g, "") +
        Utilities.getUuid().replace(/-/g, ""),
    );
  }

  const grievanceWorkbook = getOrCreateWorkbook_(
    properties,
    GRIEVANCE_WORKBOOK_PROPERTY,
    "Hillside Grievances (Private)",
  );
  const packageWorkbook = getOrCreateWorkbook_(
    properties,
    PACKAGE_WORKBOOK_PROPERTY,
    "Hillside Package Requests (Private)",
  );
  const visitorWorkbook = getOrCreateWorkbook_(
    properties,
    VISITOR_WORKBOOK_PROPERTY,
    "Hillside Visitor Requests (Private)",
  );

  configureWorkbook_(
    grievanceWorkbook,
    GRIEVANCE_HEADERS,
    9,
    "Grievances",
    [
      "Share this workbook only with Jackson Roux and other specifically approved grievance reviewers.",
      "Patient identity is optional. The form stores only a first name and last initial when provided.",
      "Jackson or another approved reviewer follows up with the patient in person.",
      "Attachments are not accepted by the first secure release.",
    ],
  );
  configureWorkbook_(
    packageWorkbook,
    PACKAGE_HEADERS,
    10,
    "Package requests",
    [
      "Share this workbook only with Kyle Medeiros, Sierra Skaza, and other specifically approved clinical-leadership reviewers.",
      "A Pending row is a request for approval, not permission to place an order.",
      "Management records the decision and follow-up in the review columns.",
    ],
  );
  configureWorkbook_(
    visitorWorkbook,
    VISITOR_HEADERS,
    16,
    "Visitor requests",
    [
      "Share this workbook only with the management roles approved to review visitor requests.",
      "Visitor names and relationships are confidential and should not be copied to public calendars or documents.",
      "This form requests a family visit. Family sessions continue through the separate care-team process.",
    ],
  );

  console.log(
    "Private grievance workbook: " + grievanceWorkbook.getUrl(),
  );
  console.log(
    "Private package-request workbook: " +
      packageWorkbook.getUrl(),
  );
  console.log(
    "Private visitor-request workbook: " +
      visitorWorkbook.getUrl(),
  );
  console.log(
    "The shared secret is available under Project Settings → Script Properties.",
  );

  return {
    grievanceWorkbookUrl: grievanceWorkbook.getUrl(),
    packageWorkbookUrl: packageWorkbook.getUrl(),
    visitorWorkbookUrl: visitorWorkbook.getUrl(),
  };
}

/**
 * Run after setup and after deployment changes.
 */
function verifyPatientRequestSystem() {
  const properties = PropertiesService.getScriptProperties();
  const sharedSecret = properties.getProperty(SHARED_SECRET_PROPERTY);

  if (!sharedSecret || sharedSecret.length < 32) {
    throw new Error("The shared secret is missing or too short.");
  }

  [
    GRIEVANCE_WORKBOOK_PROPERTY,
    PACKAGE_WORKBOOK_PROPERTY,
    VISITOR_WORKBOOK_PROPERTY,
  ].forEach(function (propertyName) {
    const workbookId = properties.getProperty(propertyName);

    if (!workbookId) {
      throw new Error("Missing workbook property: " + propertyName);
    }

    const workbook = SpreadsheetApp.openById(workbookId);

    if (
      !workbook.getSheetByName(REQUESTS_SHEET_NAME) ||
      !workbook.getSheetByName(README_SHEET_NAME)
    ) {
      throw new Error(
        "Private workbook is missing a required sheet: " +
          workbook.getName(),
      );
    }
  });

  console.log("Private patient-request workbooks verified.");

  return true;
}

function getOrCreateWorkbook_(
  properties,
  propertyName,
  workbookName,
) {
  const workbookId = properties.getProperty(propertyName);

  if (workbookId) {
    return SpreadsheetApp.openById(workbookId);
  }

  const workbook = SpreadsheetApp.create(workbookName);
  properties.setProperty(propertyName, workbook.getId());

  return workbook;
}

function configureWorkbook_(
  workbook,
  headers,
  statusColumn,
  requestLabel,
  accessNotes,
) {
  workbook.setSpreadsheetTimeZone(FACILITY_TIME_ZONE);

  let requestsSheet = workbook.getSheetByName(
    REQUESTS_SHEET_NAME,
  );

  if (!requestsSheet) {
    const sheets = workbook.getSheets();
    requestsSheet =
      sheets.length === 1 && sheets[0].getLastRow() === 0
        ? sheets[0].setName(REQUESTS_SHEET_NAME)
        : workbook.insertSheet(REQUESTS_SHEET_NAME);
  }

  requestsSheet
    .getRange(1, 1, 1, headers.length)
    .setValues([headers])
    .setBackground("#b8913f")
    .setFontColor("#0e0e0c")
    .setFontWeight("bold");
  requestsSheet.setFrozenRows(1);
  requestsSheet
    .getRange(2, statusColumn, requestsSheet.getMaxRows() - 1, 1)
    .setDataValidation(
      SpreadsheetApp.newDataValidation()
        .requireValueInList(STATUS_OPTIONS, true)
        .setAllowInvalid(false)
        .build(),
    );
  requestsSheet
    .getRange(1, 1, requestsSheet.getMaxRows(), headers.length)
    .setVerticalAlignment("top")
    .setWrap(true);

  if (!requestsSheet.getFilter()) {
    requestsSheet
      .getRange(1, 1, requestsSheet.getMaxRows(), headers.length)
      .createFilter();
  }

  setRequestSheetWidths_(requestsSheet, headers);
  requestsSheet
    .getRange("B:B")
    .setNumberFormat("mmm d, yyyy h:mm AM/PM");

  let readMeSheet = workbook.getSheetByName(README_SHEET_NAME);

  if (!readMeSheet) {
    readMeSheet = workbook.insertSheet(README_SHEET_NAME);
  }

  readMeSheet.clear();
  readMeSheet
    .getRange("A1")
    .setValue("Private Hillside " + requestLabel + " workbook")
    .setFontSize(18)
    .setFontWeight("bold");
  readMeSheet
    .getRange(3, 1, accessNotes.length + 6, 1)
    .setValues(
      [
        "This workbook may contain information protected by HIPAA and 42 CFR Part 2.",
        "Keep sharing set to Restricted and grant access only to approved Hillside workforce roles.",
        "Do not publish, email, or copy rows into an unsecured system.",
      ]
        .concat(accessNotes)
        .concat([
          "The website protects against spreadsheet formulas in patient-entered text.",
          "The setup does not invent a records-retention period. Apply Hillside’s approved retention and secure-disposal schedule before live launch.",
          "Use Status, reviewer, date, and notes columns for management follow-up.",
        ])
        .map(function (line) {
          return [line];
        }),
    );
  readMeSheet.setColumnWidth(1, 800);
  readMeSheet.getRange("A:A").setWrap(true).setVerticalAlignment("top");
}

function setRequestSheetWidths_(sheet, headers) {
  headers.forEach(function (header, index) {
    let width = 150;

    if (
      header === "Grievance" ||
      header === "Reason needed" ||
      header === "Management notes" ||
      header === "Follow-up notes"
    ) {
      width = 360;
    } else if (
      header.indexOf("Visitor ") === 0 ||
      header === "Staff members involved" ||
      header === "Requested item"
    ) {
      width = 210;
    } else if (
      header.indexOf("date") >= 0 ||
      header.indexOf(" at") >= 0
    ) {
      width = 180;
    }

    sheet.setColumnWidth(index + 1, width);
  });
}

function appendRequest_(request, receipt, submittedAt, properties) {
  if (request.kind === "grievance") {
    appendGrievance_(request, receipt, submittedAt, properties);
    return;
  }

  if (request.kind === "package") {
    appendPackageRequest_(
      request,
      receipt,
      submittedAt,
      properties,
    );
    return;
  }

  appendVisitorRequest_(
    request,
    receipt,
    submittedAt,
    properties,
  );
}

function getRequestsSheet_(properties, propertyName) {
  const workbookId = properties.getProperty(propertyName);

  if (!workbookId) {
    throw new Error("Private request workbook is not configured.");
  }

  const sheet = SpreadsheetApp.openById(workbookId).getSheetByName(
    REQUESTS_SHEET_NAME,
  );

  if (!sheet) {
    throw new Error("Private request sheet is not configured.");
  }

  return sheet;
}

function appendGrievance_(
  request,
  receipt,
  submittedAt,
  properties,
) {
  const sheet = getRequestsSheet_(
    properties,
    GRIEVANCE_WORKBOOK_PROPERTY,
  );
  const incidentDate = request.incidentDate
    ? parseFacilityDate_(request.incidentDate)
    : "";

  sheet.appendRow([
    receipt,
    submittedAt,
    protectCellText_(request.firstName),
    protectCellText_(request.lastInitial),
    incidentDate,
    protectCellText_(request.incidentTime),
    protectCellText_(request.staffMembers),
    protectCellText_(request.grievance),
    "Pending",
    "",
    "",
    "",
  ]);

  const row = sheet.getLastRow();
  sheet
    .getRange(row, 2)
    .setNumberFormat("mmm d, yyyy h:mm AM/PM");

  if (incidentDate) {
    sheet.getRange(row, 5).setNumberFormat("mmm d, yyyy");
  }
}

function appendPackageRequest_(
  request,
  receipt,
  submittedAt,
  properties,
) {
  const sheet = getRequestsSheet_(
    properties,
    PACKAGE_WORKBOOK_PROPERTY,
  );

  sheet.appendRow([
    receipt,
    submittedAt,
    protectCellText_(request.firstName),
    protectCellText_(request.lastInitial),
    protectCellText_(request.item),
    protectCellText_(request.retailer),
    request.quantity,
    protectCellText_(request.reason),
    true,
    "Pending",
    "",
    "",
    "",
  ]);

  sheet
    .getRange(sheet.getLastRow(), 2)
    .setNumberFormat("mmm d, yyyy h:mm AM/PM");
}

function appendVisitorRequest_(
  request,
  receipt,
  submittedAt,
  properties,
) {
  const sheet = getRequestsSheet_(
    properties,
    VISITOR_WORKBOOK_PROPERTY,
  );
  const visitorCells = [];

  for (let index = 0; index < 4; index += 1) {
    const visitor = request.visitors[index];
    visitorCells.push(
      visitor ? protectCellText_(visitor.name) : "",
      visitor ? protectCellText_(visitor.relationship) : "",
    );
  }

  sheet.appendRow(
    [
      receipt,
      submittedAt,
      protectCellText_(request.firstName),
      protectCellText_(request.lastInitial),
      parseFacilityDate_(request.visitDate),
      request.visitWindow,
    ]
      .concat(visitorCells)
      .concat([
        true,
        "Pending",
        "",
        "",
        "",
      ]),
  );

  const row = sheet.getLastRow();
  sheet
    .getRange(row, 2)
    .setNumberFormat("mmm d, yyyy h:mm AM/PM");
  sheet.getRange(row, 5).setNumberFormat("dddd, mmm d, yyyy");
}

function parsePayload_(event) {
  if (
    !event ||
    !event.postData ||
    typeof event.postData.contents !== "string" ||
    event.postData.contents.length > MAXIMUM_REQUEST_CHARACTERS
  ) {
    throw new Error("The request body could not be read.");
  }

  const payload = JSON.parse(event.postData.contents);

  if (
    !payload ||
    typeof payload !== "object" ||
    Array.isArray(payload) ||
    payload.apiVersion !== API_VERSION ||
    typeof payload.requestId !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(payload.requestId) ||
    typeof payload.sharedSecret !== "string" ||
    !payload.request ||
    typeof payload.request !== "object" ||
    Array.isArray(payload.request)
  ) {
    throw new Error("The request body is invalid.");
  }

  return payload;
}

function validateRequest_(value) {
  const kind = readRequiredText_(value.kind, 20);

  if (kind === "grievance") {
    return validateGrievance_(value);
  }

  if (kind === "package") {
    return validatePackageRequest_(value);
  }

  if (kind === "visitor") {
    return validateVisitorRequest_(value);
  }

  throw new Error("The request type is not supported.");
}

function validateGrievance_(value) {
  const identifier = readPatientIdentifier_(value, true);
  const grievance = readRequiredText_(value.grievance, 4000);
  const incidentDate = readOptionalText_(value.incidentDate, 10);
  const incidentTime = readOptionalText_(value.incidentTime, 5);
  const staffMembers = readOptionalText_(value.staffMembers, 300);

  if (
    (incidentDate && !isValidCalendarDate_(incidentDate)) ||
    (incidentTime &&
      !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(incidentTime))
  ) {
    throw new Error("The incident details are invalid.");
  }

  return {
    kind: "grievance",
    firstName: identifier.firstName,
    lastInitial: identifier.lastInitial,
    grievance: grievance,
    incidentDate: incidentDate,
    incidentTime: incidentTime,
    staffMembers: staffMembers,
  };
}

function validatePackageRequest_(value) {
  const identifier = readPatientIdentifier_(value, false);
  const item = readRequiredText_(value.item, 200);
  const retailer = readOptionalText_(value.retailer, 120);
  const reason = readRequiredText_(value.reason, 1200);
  const quantity = Number(value.quantity);

  if (
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    quantity > 10 ||
    value.criteriaConfirmed !== true
  ) {
    throw new Error("The package request is invalid.");
  }

  return {
    kind: "package",
    firstName: identifier.firstName,
    lastInitial: identifier.lastInitial,
    item: item,
    retailer: retailer,
    quantity: quantity,
    reason: reason,
    criteriaConfirmed: true,
  };
}

function validateVisitorRequest_(value) {
  const identifier = readPatientIdentifier_(value, false);
  const visitDate = readRequiredText_(value.visitDate, 10);

  if (!isAllowedVisitDate_(visitDate)) {
    throw new Error("The visitation date is invalid.");
  }

  if (
    value.visitWindow !== VISIT_WINDOW ||
    !Array.isArray(value.visitors) ||
    value.visitors.length < 1 ||
    value.visitors.length > 4 ||
    value.visitTypeConfirmed !== true
  ) {
    throw new Error("The visitor request is invalid.");
  }

  const visitors = value.visitors.map(function (visitor) {
    if (
      !visitor ||
      typeof visitor !== "object" ||
      Array.isArray(visitor)
    ) {
      throw new Error("A visitor entry is invalid.");
    }

    return {
      name: readRequiredText_(visitor.name, 80),
      relationship: readRequiredText_(visitor.relationship, 80),
    };
  });

  return {
    kind: "visitor",
    firstName: identifier.firstName,
    lastInitial: identifier.lastInitial,
    visitDate: visitDate,
    visitWindow: VISIT_WINDOW,
    visitors: visitors,
    visitTypeConfirmed: true,
  };
}

function readPatientIdentifier_(value, optional) {
  const firstName = readOptionalText_(value.firstName, 40);
  const lastInitial = readOptionalText_(value.lastInitial, 1).toUpperCase();

  if (optional && !firstName && !lastInitial) {
    return { firstName: "", lastInitial: "" };
  }

  if (
    !/^[\p{L}][\p{L}\p{M}' -]{0,39}$/u.test(firstName) ||
    !/^\p{L}$/u.test(lastInitial)
  ) {
    throw new Error("The patient identifier is invalid.");
  }

  return {
    firstName: firstName,
    lastInitial: lastInitial,
  };
}

function readRequiredText_(value, maximumLength) {
  const normalized = readOptionalText_(value, maximumLength);

  if (!normalized) {
    throw new Error("A required field is missing.");
  }

  return normalized;
}

function readOptionalText_(value, maximumLength) {
  if (typeof value !== "string") {
    throw new Error("A text field is invalid.");
  }

  const normalized = value.trim().replace(/\r\n?/g, "\n");

  if (normalized.length > maximumLength) {
    throw new Error("A text field is too long.");
  }

  return normalized;
}

function isValidCalendarDate_(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parts = value.split("-").map(Number);
  const parsed = new Date(
    Date.UTC(parts[0], parts[1] - 1, parts[2], 12),
  );

  return (
    parsed.getUTCFullYear() === parts[0] &&
    parsed.getUTCMonth() === parts[1] - 1 &&
    parsed.getUTCDate() === parts[2]
  );
}

function isAllowedVisitDate_(value) {
  if (!isValidCalendarDate_(value)) {
    return false;
  }

  const visitDate = parseFacilityDate_(value);
  const todayValue = Utilities.formatDate(
    new Date(),
    FACILITY_TIME_ZONE,
    "yyyy-MM-dd",
  );
  const latestDate = parseFacilityDate_(todayValue);
  latestDate.setDate(
    latestDate.getDate() + MAXIMUM_FUTURE_VISIT_DAYS,
  );
  const day = visitDate.getDay();

  return (
    value >= todayValue &&
    visitDate.getTime() <= latestDate.getTime() &&
    [0, 2, 4, 6].indexOf(day) >= 0
  );
}

function parseFacilityDate_(value) {
  const parts = value.split("-").map(Number);

  return new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0);
}

function createReceipt_(kind, submittedAt) {
  const prefix =
    kind === "grievance"
      ? "GRV"
      : kind === "package"
        ? "PKG"
        : "VIS";
  const stamp = Utilities.formatDate(
    submittedAt,
    FACILITY_TIME_ZONE,
    "yyyyMMdd-HHmmss",
  );
  const suffix = Utilities.getUuid()
    .replace(/-/g, "")
    .slice(0, 6)
    .toUpperCase();

  return prefix + "-" + stamp + "-" + suffix;
}

function getDuplicateCacheKey_(requestId, kind) {
  const digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    kind + ":" + requestId,
  );

  return (
    "patient-request-" +
    Utilities.base64EncodeWebSafe(digest).slice(0, 40)
  );
}

function readCachedSubmission_(value) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value);

    return parsed &&
      typeof parsed.receipt === "string" &&
      typeof parsed.submittedAt === "string"
      ? parsed
      : null;
  } catch {
    return null;
  }
}

function protectCellText_(value) {
  const text = typeof value === "string" ? value : String(value || "");

  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function getSafeErrorMessage_(error) {
  console.error(
    error && error.stack ? error.stack : "Patient request failed.",
  );

  return "The request could not be safely recorded.";
}

function jsonOutput_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(
    ContentService.MimeType.JSON,
  );
}
