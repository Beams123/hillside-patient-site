# Private alternative-meal order workflow

## Current status

The website code and private workbook workflow are ready for end-to-end
testing. As of July 29, 2026, the configured Apps Script deployment URL does
not pass its public health check: opening the `/exec` URL returns Google Drive
“Page Not Found” instead of the expected JSON response. The local launch
switch therefore remains off and the form runs in synthetic test mode. No test
submission is sent to Google Sheets.

Redeploy the Apps Script web app, confirm the health check below, and replace
the server-only deployment URL before attempting another live synthetic test.

## Privacy boundary

Patient orders remain separate from the public schedule/menu/staff bridge.

- The public bridge remains read-only and never receives patient information.
- The browser sends an order only to the Hillside website's same-origin server
  endpoint.
- The website server verifies the current published schedule, meal time,
  2-hour cutoff, and request shape.
- Only then does the server send the minimum approved order fields to the
  separate private Apps Script destination.
- The Apps Script validates the request again before writing it.
- The private kitchen workbook is not public and must be shared only with
  approved Hillside staff.
- The private workbook’s `Weekly Menu` tab is the only editable menu source.
- Every five minutes, the private Apps Script publishes only the approved
  weekly-menu cells to the separate website feed. It never reads or copies
  order rows into that feed.
- Orders are permanently deleted 30 days after the requested meal.

The patient form is internet-accessible by design. A patient may submit from
outside Hillside. The schedule, meal deadline, request fields, and destination
secret are still validated, but the workflow does not verify the submitter's
physical location or identity.

The order contains only:

- first name and last initial;
- ATS or CSS;
- requested date, meal, and serving time;
- selected alternative-menu items;
- an optional non-clinical preparation request;
- an automatically generated receipt and submission timestamp.

Do not use the special-request field for allergies, diagnoses, medications, or
other medical or clinical information. Those needs must continue to go directly
to RS, dietary, or nursing staff through the approved clinical process.

## One-time private Apps Script setup

Complete these steps while signed in to the Hillside Google Workspace account
covered by Hillside's BAA:

1. Open [Google Apps Script](https://script.google.com/) and create a new
   standalone project named `Hillside Private Meal Orders`.
2. Open the Apps Script editor’s existing `Code.gs`. Click inside the code,
   press **Command+A**, and delete everything so the file is completely empty.
   Then copy and paste the entire contents of
   `google-apps-script-meal-orders/Code.gs` exactly once. Do not use either of
   the repository’s other `Code.gs` files and do not paste below the existing
   script.
3. In **Project Settings**, enable **Show "appsscript.json" manifest file in
   editor**, then replace that file with
   `google-apps-script-meal-orders/appsscript.json`.
4. Select `setupMealOrderSystem` in the function menu and click **Run**.
   Approve the spreadsheet and trigger permissions for the Hillside work
   account.
5. Open the private workbook URL shown in the execution log. Confirm it has:
   `Kitchen Printout`, `Weekly Menu`, `Orders`, and `Read Me`.
6. In the workbook's Share dialog, confirm it is **Restricted**. Add only the
   minimum approved RS/dietary administrators. Kitchen staff do not need direct
   access if RS staff will print the current sheet.
7. Return to Apps Script and run `verifyMealOrderSystem`. It must complete
   successfully.
8. In **Project Settings → Script Properties**, copy the generated
   `MEAL_ORDER_SHARED_SECRET`. Treat it as a password.
9. Click **Deploy → New deployment → Web app**. Set **Execute as** to **Me**
   and **Who has access** to **Anyone**, then deploy. The workbook remains
   private; the web endpoint rejects requests that do not contain the shared
   server secret.
10. Copy the deployment URL ending in `/exec`.
11. Open that exact `/exec` URL in a private browser window. It must display
    JSON containing `"ok":true` and
    `"service":"Hillside private meal-order destination"`. A Google sign-in
    page, permission error, HTML page, or “Page Not Found” means the deployment
    is not ready. Keep the website launch switch off and create or update the
    web-app deployment before continuing.

Never move the private `Orders` tab into the public menu workbook. Google Sheet
sharing applies to the entire spreadsheet file, not to individual tabs.

## Website host settings

Configure these as server-only environment variables. Do not prefix them with
`NEXT_PUBLIC_`.

```text
HILLSIDE_MEAL_ORDER_WEB_APP_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
HILLSIDE_MEAL_ORDER_SHARED_SECRET=THE_VALUE_FROM_SCRIPT_PROPERTIES
HILLSIDE_MEAL_ORDER_ENABLED=false
```

Keep the launch switch `false` until the checklist below passes. Changing a
server environment variable normally requires a new website deployment or
server restart. Spreadsheet order and menu changes do not require redeploying
the website.

## Kitchen printout

The private kitchen workbook is:

[Hillside Kitchen Menu & Alternative Meal Orders (Private)](https://docs.google.com/spreadsheets/d/1otVd9EV0Y9vwZRD38YnhtCKiUCTtKkwdAmRmWWUyZRw/)

Its `Weekly Menu` tab:

- is the editable source of truth for the menu used by the website;
- lists Sunday first;
- accepts one food per yellow Item cell;
- publishes only its menu cells to the website feed automatically every five
  minutes after the updated setup function has been run;
- is the only menu workbook kitchen staff need to open.

The separate `Hillside Website Menu` workbook is now a read-only technical feed.
Do not edit it. The public bridge continues to read only `Menu Items!D4:K31`,
so patient orders and the private workbook’s other tabs can never reach the
public site.

Its `Kitchen Printout` tab:

- shows only today's active Lunch orders before 3:00 PM Eastern;
- switches to today's active Dinner orders at 3:00 PM Eastern;
- groups and sorts orders by program, serving time, and first name;
- excludes future dates from the current printout while retaining them in the
  private `Orders` tab;
- is intended to be printed as the current sheet by approved RS staff.

The Apps Script creates a five-minute menu publishing trigger and a daily
trigger that permanently deletes each source order 30 days after that order's
requested serving time.

## Change an existing installation to kitchen-first editing

1. Replace the private meal-order Apps Script project’s `Code.gs` with the
   complete current file from `google-apps-script-meal-orders/Code.gs`.
2. Save the script.
3. Run `setupMealOrderSystem` once. This removes the old trigger that copied
   the website menu into the kitchen workbook, preserves the existing yellow
   menu-item cells, and installs the new outward publishing trigger.
4. Run `verifyMealOrderSystem`.
5. Open the private workbook and confirm `Weekly Menu` says `EDITABLE SOURCE`
   and `EDIT THIS MENU — WEBSITE PUBLISHES AUTOMATICALLY`.
6. Make one synthetic menu edit in an unused yellow cell, run
   `publishKitchenMenu`, and confirm the same value appears in the website
   preview within five minutes. Remove the synthetic value afterward.

The compatibility `refreshKitchenMenu` function also publishes outward. This
prevents an old trigger from overwriting the kitchen menu during the brief
period between saving the new code and rerunning setup.

## Safe launch checklist

Before changing `HILLSIDE_MEAL_ORDER_ENABLED` to `true`:

1. Confirm Hillside's BAA and vendor approval specifically cover the website
   hosting account that will transmit these requests. A Google Workspace BAA
   does not cover a separate website host.
2. Confirm management accepts that the request form can be opened and
   submitted from any internet connection.
3. Confirm the private workbook is Restricted and only approved staff have
   access.
4. Confirm `verifyMealOrderSystem` succeeds and the 30-day deletion trigger
   exists.
5. Open the configured `/exec` URL in a private browser window and confirm the
   expected JSON health response appears without signing in.
6. Use synthetic information to submit:
   - ATS lunch;
   - ATS dinner;
   - CSS lunch;
   - CSS dinner;
   - a future meal later in the current published week.
7. Confirm each submission appears correctly in `Orders`.
8. Confirm `Kitchen Printout` shows only today's current meal.
9. Confirm a request made less than 2 hours before serving is rejected.
10. Confirm a valid request can be submitted from both inside and outside
   Hillside.
11. Confirm no patient data appears in browser console output, hosting logs,
    analytics, error reports, or the public Apps Script project.
12. Set `HILLSIDE_MEAL_ORDER_ENABLED=true`, redeploy, and repeat one final
    synthetic end-to-end test.

Keep the existing paper process available as a downtime fallback.
