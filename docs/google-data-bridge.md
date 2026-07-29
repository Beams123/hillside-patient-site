# Google Sheets data bridge

The website must not read the internal workbook directly. The source workbook
contains operational material that is not intended for a public patient site,
and the Hillside work account has view-only access.

The bridge in `google-apps-script/` solves both constraints:

1. It runs under `sahearn@hillsidedetox.com`, which can view the schedule.
2. It never edits the source workbook.
3. It reads only the current week’s fixed CSS and ATS schedule ranges.
4. It reads meal descriptions from the separate Hillside Website Menu sheet.
5. It reads only checked rows from the separate Hillside Website Staff
   Directory sheet.
6. It returns a new JSON object containing only approved public fields.
7. The Next.js server validates and projects those fields again before render.

## Public-data boundary

The bridge can return only:

- current schedule date and week label;
- Monday–Sunday CSS and ATS group time, topic, and facilitator;
- Monday–Sunday breakfast, lunch, dinner, and soup-of-the-day item lists.
- checked staff display name, job title, selected departments, and public
  biography, plus a URL-safe profile slug derived from the display name.

It does not read or return patient names, Kipu data, staffing assignments,
recovery-specialist posts, management lists, notes, formulas, comments, or any
schedule cells outside the current week’s fixed allowlist.

Facilitator cells are included. Hillside confirmed that names in parenthetical
peer-led entries identify the staff member supervising the group.

The public JSON endpoint is intentionally accessible to the website. The
schedule, menu, and staff Google Sheets remain private; only the sanitized JSON
result is public.

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
4. Select `verifyStaffDirectoryAccess` in the function menu and click **Run**.
   Approve the read-only spreadsheet permission for the work account. Confirm
   the execution log says `Staff directory verified` with the expected number
   of checked public staff rows. Then run `authorizeBridge` and confirm its
   execution log reports the expected staff, CSS-group, and ATS-group counts.
5. Click **Deploy → New deployment → Web app**.
6. Set **Execute as** to **Me** and **Who has access** to **Anyone**. If the
   Hillside Google Workspace policy does not allow this option, stop here; the
   feed needs a different hosting path rather than broader workbook sharing.
7. Deploy and copy the URL ending in `/exec`.
8. Open the `/exec` URL in a private browser window. Confirm the response
   contains only `generatedAt`, `scheduleDate`, `weekLabel`, `schedules`,
   `menu`, and `staff`, plus the `ok` and `version` markers.
9. Copy the deployed Web app URL ending in `/exec`. Send that URL to the person
   configuring the website (or paste it into the Codex task). They will add it
   as the server-only environment variable `HILLSIDE_DATA_FEED_URL`.

   To configure it manually for local development, open the hidden `.env.local`
   file in the repository root and replace its existing
   `HILLSIDE_DATA_FEED_URL` line with:

   ```text
   HILLSIDE_DATA_FEED_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
   ```

   Use the complete URL copied from Apps Script, without quotation marks. The
   `.env.local` file is intentionally excluded from Git.
10. Restart the local development server so Next.js reads the new value. In the
    terminal running the site, press **Control+C**, then run `npm run dev`
    again. Codex can perform steps 9 and 10 after receiving the `/exec` URL.

Do not prefix the variable with `NEXT_PUBLIC_`. The browser does not need the
bridge URL; only the Next.js server fetches it.

## Menu editing

The separate menu workbook is:

[Hillside Website Menu](https://docs.google.com/spreadsheets/d/1qUxUFHaCBmZP5ygjMNX49Q1Kxjbx2QjU3MUQj5KSQdA/)

Share edit access only with specific staff who maintain public menu content.
They should use the `Menu Items` tab and edit only the yellow Item 1–Item 8
cells. Each row is one meal, and each food goes in its own ordinary cell.
No keyboard shortcut or separator is required. Dates update automatically.
Blank meals display as “Not posted” on the site.

Never enter patient names, allergies, preferences, diagnoses, medications,
appointments, or other personal or clinical information in this workbook.

## Staff-directory editing

The separate staff workbook is:

[Hillside Website Staff Directory](https://docs.google.com/spreadsheets/d/1CpGOnpZda9GMkGfs3iZnmxPMJ9hRR0xfD6hRk5fFi-g/)

Use its `Staff Directory` tab. Add the exact approved display name, job title,
and public-facing biography. Choose a fixed option in `Department`, then check
`Leadership?` when that person should also appear in the Leadership directory
section. Leadership-only staff can leave `Department` blank and check
`Leadership?`. The department dropdown rejects unapproved text. Check
`Publish` only when the complete row is ready for the public website. Unchecked
rows and rows without both a name and job title are excluded from the feed.
The website creates the profile URL from the display name; coworkers do not
need to manage a technical slug column.

Department names are allowlisted in both the bridge and website parser. Adding
a new dropdown option therefore requires a matching reviewed code change
before that category can reach the public site.

Do not add phone numbers, email addresses, private schedules, patient
assignments, or clinical information. Biographies must be approved for public
display and must not mention patients or confidential work. Uncheck `Publish`
to remove a staff member and profile from the next refreshed feed.

## Range allowlist

The bridge reads these ranges and no others:

| Workbook | Tab | Cells | Use |
| --- | --- | --- | --- |
| Group Schedules and RS Posts | current weekly tab | CSS time cells `A3`, `A5`, `A7`, `A9`, `A11` plus the matching Monday–Sunday topic and following facilitator cells in `B`, `D`, `F`, `H`, `J`, `L`, and `N` | Weekly CSS schedule |
| Group Schedules and RS Posts | current weekly tab | ATS time cells `Q3`, `Q5`, `Q7`, `Q9` plus the matching Monday–Sunday topic and following facilitator cells in `R`, `T`, `V`, `X`, `Z`, `AB`, and `AD` | Weekly ATS schedule |
| Hillside Website Menu | `Menu Items` | `D4:K31` | Breakfast, lunch, dinner, and soup-of-the-day items |
| Hillside Website Staff Directory | `Staff Directory` | `A4:F53` | Publish checkbox, display name, job title, controlled department choice, leadership checkbox, and public biography |

For menu rows, the bridge constructs the public day, date, and meal assignment
itself. It reads only the yellow item cells in columns D–K, so accidental text
in the Day, Date, or Meal columns cannot be exposed.

For staff rows, the bridge reads only the six directory columns, filters for
the checked `Publish` value, adds `Leadership` to the public department list
when its checkbox is selected, and emits only the derived slug, name, title,
departments, and bio. Neither checkbox is returned. The site uses departments
only to filter the directory; they are not printed on each staff card.

If the staff workbook becomes unavailable, the bridge returns an empty staff
list while continuing to serve the schedule and menu. Run
`verifyStaffDirectoryAccess` in the Apps Script editor to surface the exact
staff-workbook permission error without exposing it through the public
endpoint.

## Updating the bridge

Code edits are not live until a new Apps Script deployment version is created.
After changing `Code.gs` or `appsscript.json`, use **Deploy → Manage
deployments → Edit**, choose **New version**, and deploy. The `/exec` URL can
remain the same.
