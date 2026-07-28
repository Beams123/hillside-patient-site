# Google Sheets data bridge

The website must not read the internal workbook directly. The source workbook
contains operational material that is not intended for a public patient site,
and the Hillside work account has view-only access.

The bridge in `google-apps-script/` solves both constraints:

1. It runs under `sahearn@hillsidedetox.com`, which can view the schedule.
2. It never edits the source workbook.
3. It reads only the current week’s fixed CSS and ATS schedule ranges.
4. It reads meal descriptions from the separate Hillside Website Menu sheet.
5. It returns a new JSON object containing only approved public fields.
6. The Next.js server validates and projects those fields again before render.

## Public-data boundary

The bridge can return only:

- current schedule date and week label;
- CSS and ATS group time, topic, and facilitator;
- Monday–Sunday breakfast, lunch, dinner, and snack text.

It does not read or return patient names, Kipu data, staffing assignments,
recovery-specialist posts, management lists, notes, formulas, comments, or any
schedule cells outside the current day’s fixed allowlist.

Facilitator cells are included. Hillside confirmed that names in parenthetical
peer-led entries identify the staff member supervising the group.

The public JSON endpoint is intentionally accessible to the website. The two
Google Sheets remain private; only the sanitized JSON result is public.

## One-time deployment

Complete these steps while signed in to `sahearn@hillsidedetox.com`:

1. Open [Google Apps Script](https://script.google.com/) and create a new
   standalone project named `Hillside Public Data Bridge`.
2. Replace the default `Code.gs` with the contents of
   `google-apps-script/Code.gs`.
3. In Project Settings, enable **Show "appsscript.json" manifest file in
   editor**, then replace that file with
   `google-apps-script/appsscript.json`.
   The manifest enables the Advanced Google Sheets service while retaining the
   `spreadsheets.readonly` OAuth scope. Confirm **Google Sheets API** appears
   under **Services** in the editor; if it does not, click **+** beside
   Services and add it.
4. Select `authorizeBridge` in the function menu and click **Run**. Approve the
   read-only spreadsheet permission for the work account.
5. Click **Deploy → New deployment → Web app**.
6. Set **Execute as** to **Me** and **Who has access** to **Anyone**. If the
   Hillside Google Workspace policy does not allow this option, stop here; the
   feed needs a different hosting path rather than broader workbook sharing.
7. Deploy and copy the URL ending in `/exec`.
8. Open the `/exec` URL in a private browser window. Confirm the response
   contains only `generatedAt`, `scheduleDate`, `weekLabel`, `schedules`, and
   `menu`, plus the `ok` and `version` markers.
9. Add the URL to the website host as the server-only environment variable
   `HILLSIDE_DATA_FEED_URL`. For local development, put it in `.env.local`:

   ```text
   HILLSIDE_DATA_FEED_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
   ```

10. Restart the local development server after adding the variable.

Do not prefix the variable with `NEXT_PUBLIC_`. The browser does not need the
bridge URL; only the Next.js server fetches it.

## Menu editing

The separate menu workbook is:

[Hillside Website Menu](https://docs.google.com/spreadsheets/d/1qUxUFHaCBmZP5ygjMNX49Q1Kxjbx2QjU3MUQj5KSQdA/)

Share edit access only with specific staff who maintain public menu content.
They should edit only the yellow Breakfast, Lunch, Dinner, and Snack cells.
Dates update automatically. Blank cells display as “Not posted” on the site.

Never enter patient names, allergies, preferences, diagnoses, medications,
appointments, or other personal or clinical information in this workbook.

## Range allowlist

The bridge reads these ranges and no others:

| Workbook | Tab | Cells | Use |
| --- | --- | --- | --- |
| Group Schedules and RS Posts | current weekly tab | CSS time cells `A3`, `A5`, `A7`, `A9`, `A11` plus the matching current-day topic and following facilitator cells in `B`, `D`, `F`, `H`, `J`, `L`, or `N` | CSS schedule |
| Group Schedules and RS Posts | current weekly tab | ATS time cells `Q3`, `Q5`, `Q7`, `Q9` plus the matching current-day topic and following facilitator cells in `R`, `T`, `V`, `X`, `Z`, `AB`, or `AD` | ATS schedule |
| Hillside Website Menu | `Menu` | `A3:F9` | Meal descriptions |

For menu rows, the bridge constructs the public day and date itself. It returns
only columns C–F, so accidental text in the day/date columns cannot be exposed.

## Updating the bridge

Code edits are not live until a new Apps Script deployment version is created.
After changing `Code.gs` or `appsscript.json`, use **Deploy → Manage
deployments → Edit**, choose **New version**, and deploy. The `/exec` URL can
remain the same.
