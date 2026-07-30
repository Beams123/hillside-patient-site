# Private grievance, package, and visitor requests

## Current status

The three website forms are functional in local synthetic-test mode. As of
July 29, 2026, the configured Apps Script deployment URL does not pass its
public health check: opening the `/exec` URL returns Google Drive “Page Not
Found” instead of the expected JSON response. The local launch switch
therefore remains off. Production submission remains fail-closed until the
private deployment is repaired and the remaining launch requirements are
completed.

Local test submissions:

- pass through the same website validation route used by production;
- return a synthetic receipt;
- are not sent to Google Sheets;
- are not retained.

The first secure release does not accept grievance attachments. Attachments
require a separately approved restricted-Drive design, file-type controls,
malware handling, access review, and a retention/disposal rule.

## Privacy boundary

These workflows are separate from the public schedule, menu, and staff bridge.

- The public data bridge never receives request information.
- A patient submits only to the Hillside website's same-origin server route.
- The server validates the request without attempting to verify the patient's
  location or identity.
- Only the server knows the private Apps Script URL and shared secret.
- Apps Script validates the request again and writes it to one of three
  separately restricted workbooks.
- The grievance, package, and visitor workbooks can be shared with different
  management roles.
- Patient-entered text is escaped before it reaches a spreadsheet cell so it
  cannot be interpreted as a formula.

The forms use a first name and last initial. The grievance identifier is
optional. Each workbook also receives an automatically generated receipt and
server submission time.

The forms are internet-accessible by design. Anyone who finds a form can
attempt to submit it. The workflow protects the private destination and
management data, but it does not prove that a submission came from a current
Hillside patient. Management must be prepared to review suspected mistakes or
spam.

## Management workbooks

Running the one-time setup creates:

1. `Hillside Grievances (Private)`
2. `Hillside Package Requests (Private)`
3. `Hillside Visitor Requests (Private)`

Each workbook contains:

- a `Requests` sheet with management status, reviewer, review date, and notes
  columns;
- a `Read Me` sheet with access and handling reminders;
- a filterable header row and status dropdown.

Recommended access scopes:

- Grievances: Jackson Roux and only other specifically approved grievance
  reviewers.
- Package requests: Kyle Medeiros, Sierra Skaza, and only other approved
  clinical-leadership reviewers.
- Visitor requests: only the management roles Hillside approves for visitor
  review.

Do not use a single workbook with three tabs for these workflows. Google Drive
sharing applies to the workbook, not to individual tabs, so separate workbooks
are required if reviewer access differs.

## One-time Google Apps Script setup

Complete these steps while signed in to the Hillside Google Workspace account
covered by Hillside's BAA:

1. Open [Google Apps Script](https://script.google.com/) and create a new
   standalone project named `Hillside Private Patient Requests`.
2. Open the Apps Script editor’s existing `Code.gs`. Click inside the code,
   press **Command+A**, and delete everything so the file is completely empty.
   Then copy and paste the entire contents of
   `google-apps-script-patient-requests/Code.gs` exactly once. Do not use
   either of the repository’s other `Code.gs` files and do not paste below the
   existing script.
3. In **Project Settings**, enable **Show "appsscript.json" manifest file in
   editor**, then replace that file with
   `google-apps-script-patient-requests/appsscript.json`.
4. Select `setupPatientRequestSystem` in the function menu and click **Run**.
   Approve the spreadsheet permission for the Hillside work account.
5. Open all three workbook URLs shown in the execution log.
6. In each workbook's Share dialog, confirm **General access** is
   **Restricted**. Remove anyone who does not need that request type, then add
   only the approved reviewers listed above.
7. Return to Apps Script and run `verifyPatientRequestSystem`. It must complete
   successfully.
8. In **Project Settings → Script Properties**, copy the generated
   `PATIENT_REQUESTS_SHARED_SECRET`. Treat it as a password.
9. Click **Deploy → New deployment → Web app**. Set **Execute as** to **Me**
   and **Who has access** to **Anyone**, then deploy. The workbooks remain
   private; the endpoint rejects requests without the server-only shared
   secret.
10. Copy the deployment URL ending in `/exec`.
11. Open that exact `/exec` URL in a private browser window. It must display
    JSON containing `"ok":true` and
    `"service":"Hillside private patient-request destination"`. A Google
    sign-in page, permission error, HTML page, or “Page Not Found” means the
    deployment is not ready. Keep the website launch switch off and create or
    update the web-app deployment before continuing.

Never reuse the public-data bridge or alternative-meal Apps Script project for
these requests.

## Website host settings

Configure these as server-only environment variables. Never prefix them with
`NEXT_PUBLIC_`.

```text
HILLSIDE_PATIENT_REQUESTS_WEB_APP_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
HILLSIDE_PATIENT_REQUESTS_SHARED_SECRET=THE_VALUE_FROM_SCRIPT_PROPERTIES
HILLSIDE_PATIENT_REQUESTS_ENABLED=false
```

Keep `HILLSIDE_PATIENT_REQUESTS_ENABLED=false` until the launch checklist
passes. Changing a server environment variable normally requires a website
redeployment or server restart. Reviewing or updating rows in the management
workbooks does not require redeploying the website.

## Records retention

The Apps Script does not automatically delete these three request types.
Hillside must approve a retention and secure-disposal schedule for each
workbook before production submission is enabled. Do not use “forever” as an
unreviewed default.

After management approves the rules, add and verify the corresponding
time-driven deletion process before launch.

## Safe launch checklist

Before changing `HILLSIDE_PATIENT_REQUESTS_ENABLED` to `true`:

1. Confirm the approved BAA/vendor arrangement covers both Google Workspace and
   the website hosting account that will transmit these requests.
2. Confirm management accepts that these forms can be opened and submitted
   from any internet connection and establish how suspected spam is handled.
3. Confirm every workbook is Restricted and has only the approved reviewers.
4. Approve and implement the retention/disposal rule for every request type.
5. Run `verifyPatientRequestSystem`.
6. Open the configured `/exec` URL in a private browser window and confirm the
   expected JSON health response appears without signing in.
7. Use synthetic information to submit one grievance, one package request, and
   one visitor request.
8. Confirm each request appears only in its intended workbook.
9. Confirm valid requests can be submitted from both inside and outside
   Hillside.
10. Confirm malformed, oversized, duplicate, and cross-origin requests are
    rejected without writing rows.
11. Confirm no request body appears in browser console output, hosting logs,
    analytics, error reports, or the public Apps Script project.
12. Set `HILLSIDE_PATIENT_REQUESTS_ENABLED=true`, redeploy, and repeat one
    final synthetic end-to-end test.

Keep the existing paper processes available as downtime fallbacks.
