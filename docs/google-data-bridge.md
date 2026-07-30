# Google Sheets data bridge

The website must not read the internal workbook directly. The source workbook
contains operational material that is not intended for a public patient site,
and the Hillside work account has view-only access.

The bridge in `google-apps-script/` solves both constraints:

1. It runs under `sahearn@hillsidedetox.com`, which can view the schedule.
2. It never edits the source workbook.
3. It reads only fixed CSS and ATS group and daily-activity cells from the two
   source tabs needed to assemble the public Sunday–Saturday week.
4. It reads meal descriptions from a separate, read-only website feed that is
   automatically published from the private kitchen workbook’s editable
   `Weekly Menu` tab.
5. It reads only checked rows from the separate Hillside Website Staff
   Directory sheet.
6. It returns a new JSON object containing only approved public fields.
7. The Next.js server validates and projects those fields again before render.

## Public-data boundary

The bridge can return only:

- current schedule date and Sunday–Saturday week label;
- Sunday–Saturday CSS and ATS group time, topic, facilitator, and approved
  location when a group is split across locations;
- Sunday–Saturday CSS and ATS daily-activity time and title;
- Sunday–Saturday breakfast, lunch, dinner, and soup-of-the-day item lists;
- checked staff display name, job title, selected departments, public
  biography, approved Hillside work email, directory section, display order,
  and an allowlisted public Google Drive portrait URL, plus a URL-safe profile
  slug derived from the display name.

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
2. Open the Apps Script editor’s existing `Code.gs`. Click inside the code,
   press **Command+A**, and delete everything so the file is completely empty.
   Then copy and paste the entire contents of `google-apps-script/Code.gs`
   exactly once. Do not use either of the repository’s private-request
   `Code.gs` files and do not paste below the existing script.
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
   execution log reports the expected staff, CSS-group, ATS-group,
   CSS-activity, and ATS-activity counts.
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

The only menu workbook staff should edit is:

[Hillside Kitchen Menu & Alternative Meal Orders (Private)](https://docs.google.com/spreadsheets/d/1otVd9EV0Y9vwZRD38YnhtCKiUCTtKkwdAmRmWWUyZRw/)

Share edit access only with specific staff approved for the private kitchen
workflow. They should use the `Weekly Menu` tab and edit only the yellow
Item 1–Item 8 cells. Each row is one meal, and each food goes in its own
ordinary cell. No keyboard shortcut or separator is required. Dates update
automatically. On the first five-minute publishing run after a new Sunday
begins, only the yellow food-entry cells are cleared for the new week. Blank
meals display as “Not posted” on the site.

The separate [Hillside Website Menu feed](https://docs.google.com/spreadsheets/d/1qUxUFHaCBmZP5ygjMNX49Q1Kxjbx2QjU3MUQj5KSQdA/)
is now a technical destination only. Staff should not open or edit it. The
private meal-order Apps Script publishes the kitchen menu there every five
minutes, and the public bridge reads only the yellow item cells from that
sanitized feed.

Never enter patient names, allergies, preferences, diagnoses, medications,
appointments, or other personal or clinical information in `Weekly Menu`.

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

The live workbook includes these four website-control columns after the
original six:

| Column | Heading | Editor control | Public use |
| --- | --- | --- | --- |
| G | Directory section | Dropdown: `Leadership`, `Counselors`, `Case Managers`, or `Staff` | Creates the labeled sections within each department |
| H | Display order | Whole number from 0–9999 | Lower numbers appear first within a section |
| I | Public work email | Text restricted to `@hillsidedetox.com` | Appears on the staff profile |
| J | Portrait Drive link | Google Drive share link | Supplies the portrait on the card and profile |

Use gaps in display order, such as 10, 20, and 30, so a person can be inserted
later without renumbering everyone. For the Clinical department, assign Kyle
and Sierra to `Leadership`, counselors to `Counselors`, and case managers to
`Case Managers`. Give the lead counselor and lead case manager the lowest
display-order number in their respective sections. A person appears only once
at a time even when `Leadership?` also places them in the Leadership department.

If `Directory section` is temporarily blank, the bridge infers Leadership from
the checkbox and otherwise recognizes counselor and case-manager job titles.
If `Display order` is blank, spreadsheet row order is used. Explicit dropdown
and order values are still recommended because they make the intended layout
clear.

In `Bio`, put each intended paragraph on its own line inside the same cell.
The bridge preserves those line breaks and the staff profile renders every line
as a separate paragraph. The column is set to wrap so longer biographies remain
readable in the workbook. Biographies may contain up to 8,000 characters; this
keeps the public feed bounded without cutting off normal multi-paragraph bios.

For a portrait, upload a staff-approved headshot to a dedicated public-portrait
folder in Google Drive, open the file’s Share dialog, set that individual image
to **Anyone with the link · Viewer**, and paste its Drive share link into
`Portrait Drive link`. The bridge extracts only the Drive file ID and constructs
the public image URL itself; non-Drive image URLs are discarded. Confirm the
photo contains no patients, documents, badges, screens, or other confidential
background information.

Department names are allowlisted in both the bridge and website parser. Adding
a new dropdown option therefore requires a matching reviewed code change
before that category can reach the public site.

Do not add phone numbers, personal email addresses, private schedules, patient
assignments, or clinical information. Use only a public Hillside work email
that the staff member and leadership have approved for website display.
Biographies and portraits must be approved for public display and must not
mention or show patients or confidential work. Uncheck `Publish` to remove a
staff member and profile from the next refreshed feed.

## Range allowlist

The bridge reads these ranges and no others:

| Workbook | Tab | Cells | Use |
| --- | --- | --- | --- |
| Group Schedules and RS Posts | source tab ending on the public week’s opening Sunday, plus the source tab beginning the following Monday | CSS time cells `A3`, `A5`, `A7`, `A9`, `A11` plus Sunday content in `N` from the first tab and Monday–Saturday content in `B`, `D`, `F`, `H`, `J`, and `L` from the second tab | Sunday–Saturday CSS schedule |
| Group Schedules and RS Posts | source tab ending on the public week’s opening Sunday, plus the source tab beginning the following Monday | ATS time cells `Q3`, `Q5`, `Q7`, `Q9` plus Sunday content in `AD` from the first tab and Monday–Saturday content in `R`, `T`, `V`, `X`, `Z`, and `AB` from the second tab | Sunday–Saturday ATS schedule |
| Group Schedules and RS Posts | same two source tabs | CSS Sunday activity cell `N13` from the first tab and Monday–Saturday activity cells `B13`, `D13`, `F13`, `H13`, `J13`, and `L13` from the second tab | Sunday–Saturday CSS activities |
| Group Schedules and RS Posts | same two source tabs | ATS Sunday activity cell `AD13` from the first tab and Monday–Saturday activity cells `R13`, `T13`, `V13`, `X13`, `Z13`, and `AB13` from the second tab | Sunday–Saturday ATS activities |
| Hillside Website Menu feed (automatically published from the private kitchen workbook) | `Menu Items` | `D4:K31` | Breakfast, lunch, dinner, and soup-of-the-day items |
| Hillside Website Staff Directory | `Staff Directory` | `A4:J53` | Publish checkbox, display name, job title, controlled department choice, leadership checkbox, public biography, controlled directory section, display order, approved work email, and portrait Drive link |

For menu rows, the bridge constructs the public day, date, and meal assignment
itself. It reads only the yellow item cells in columns D–K, so accidental text
in the Day, Date, or Meal columns cannot be exposed.

The editable private kitchen menu is Sunday-first. Its publishing function
reorders only the sanitized menu rows into the Monday–Sunday structure expected
by the existing public feed. From Monday through Saturday, the bridge leaves
the already-passed opening Sunday blank. On Sunday, that day’s menu remains
available and the not-yet-posted Monday–Saturday rows are blank. A future menu
archive can fill this historical gap without weakening the public-data
allowlist.

For daily activities, each published entry must begin with an explicit time
followed by a colon or dash, such as `8:30 PM: Movie Night`. A cell may contain
multiple time-prefixed activities. The bridge splits and sanitizes at most six
entries per program per day; unrelated cells and the row labels are not
published.

For staff rows, the bridge reads only the ten directory columns, filters for
the checked `Publish` value, adds `Leadership` to the public department list
when its checkbox is selected, validates the Hillside email domain, converts an
approved Drive share link to a narrowly allowlisted portrait URL, and emits
only the derived slug, name, title, departments, bio, directory section,
display order, email, and portrait URL. Neither checkbox is returned. The site
uses departments only to filter the directory; they are not printed on each
staff card.

If the staff workbook becomes unavailable, the bridge returns an empty staff
list while continuing to serve the schedule and menu. Run
`verifyStaffDirectoryAccess` in the Apps Script editor to surface the exact
staff-workbook permission error without exposing it through the public
endpoint.

On Friday, the approved schedule uses the CSS 1:00 PM topic/facilitator cell
pair to describe separate combined-program men’s and women’s groups, while the
embedded text identifies their actual 1:30 PM time, locations, and
facilitators. When both cells match that expected structure, the bridge
publishes two 1:30 PM groups with separate location fields in both the ATS and
CSS schedules. If either cell does not match, the bridge retains the ordinary
single-group interpretation rather than guessing.

## Updating the bridge

Code edits are not live until a new Apps Script deployment version is created.
After changing `Code.gs` or `appsscript.json`, use **Deploy → Manage
deployments → Edit**, choose **New version**, and deploy. The `/exec` URL can
remain the same.
