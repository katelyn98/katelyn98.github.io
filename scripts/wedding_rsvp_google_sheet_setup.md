# Wedding RSVP Google Sheet Setup

This setup keeps your custom RSVP + registry tracking pages and sends each submission into one Google Sheet with six tabs:

- `Invites`: private guest list used for phone lookup (not stored in GitHub)
- `Responses`: every RSVP submission
- `Summary`: live totals for ceremony, reception, full accepts, partials, declines, and dietary notes, based on the latest RSVP for each phone number
- `Dietary`: only the latest responses with notes or dietary restrictions
- `Contributions`: each contribution update submitted from the registry page
- `Contribution Summary`: live totals for registry contributions (overall + by method)

If a guest submits the RSVP again with the same phone number, their existing row is updated instead of creating a duplicate row.
If you already have responses from an older version of the script, running the setup step again will update the sheet headers for the new format.

## 1. Create the Google Sheet

1. Create a new Google Sheet.
2. Copy the sheet ID from the URL.

Example:

```text
https://docs.google.com/spreadsheets/d/THIS_PART_IS_THE_SHEET_ID/edit
```

## 2. Add the Apps Script

1. In the Google Sheet, open `Extensions` -> `Apps Script`.
2. Replace the default code with the contents of:

[`scripts/wedding_rsvp_google_sheet.gs`](/Users/katelynmorrison/Documents/GitHub/katelyn98.github.io/scripts/wedding_rsvp_google_sheet.gs)

3. Replace:

```javascript
const SHEET_ID = 'PASTE_YOUR_GOOGLE_SHEET_ID_HERE';
const WEBSITE_HOME_URL = 'https://YOUR_DOMAIN/a-k-wedding2026/';
```

with your real Google Sheet ID and your wedding home page URL.

If the script is attached directly to the Google Sheet you want to use, you can leave `SHEET_ID` as the placeholder and just run `setupWeddingRsvpSheet()` once. The script will remember the active sheet automatically.

## 3. Initialize the tabs

1. In Apps Script, run `setupWeddingRsvpSheet`.
2. Approve the permissions Google asks for.
3. Confirm the Sheet now has:
   - `Invites`
   - `Responses`
   - `Summary`
   - `Dietary`
   - `Contributions`
   - `Contribution Summary`

## 3b. Fill the Invites tab (private lookup source)

In `Invites`, add one row per invitation:

- Column A (`Invited Party`): e.g. `Seba and Maka`
- Column B (`Phone Numbers`): one or more numbers, separated by commas
- Column C (`Ceremony Allowed`): allowed ceremony count
- Column D (`Reception Allowed`): allowed reception count

Example row:

```text
Seba and Maka | 4126991909, 4125550000 | 2 | 2
```

The website now checks this private `Invites` tab through Apps Script when guests enter their phone number.

## 4. Deploy the script as a web app

1. Click `Deploy` -> `New deployment`.
2. Choose `Web app`.
3. Execute as: `Me`
4. Who has access: `Anyone`
5. Deploy and copy the web app URL.

It will look something like:

```text
https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec
https://script.google.com/macros/s/AKfycbzEVkP-PSpH6dHfQ85ErvbvS7LOHXdTQmRnhv3SBZphzpdpc4W3aPwENKuOV6u1qiad/exec
```

## 5. Connect the wedding RSVP page

In:

[`_pages/a-k-wedding2026/rsvp.md`](/Users/katelynmorrison/Documents/GitHub/katelyn98.github.io/_pages/a-k-wedding2026/rsvp.md)

replace the form action with your Apps Script URL.

## 5b. Connect the registry tracking form + progress bar

In:

[`_pages/a-k-wedding2026/registry.md`](/Users/katelynmorrison/Documents/GitHub/katelyn98.github.io/_pages/a-k-wedding2026/registry.md)

set:

```yaml
registry_tracking_endpoint: "YOUR_APPS_SCRIPT_WEB_APP_URL"
```

The registry page uses this same endpoint to:

- submit `PayPal` / `Venmo` / `Zelle` contribution logs
- fetch `contribution_summary` and refresh the progress bar automatically

## 6. Share the Sheet with helpers

Share the Google Sheet with your wedding party helpers so they can:

- check live ceremony totals
- check live reception totals
- review dietary restrictions in one place
- review registry contribution logs and totals

## Notes

- The RSVP page already sends:
  - phone number used for lookup
  - invited party (resolved from `Invites` when possible)
  - ceremony allowed / attending
  - reception allowed / attending
  - attendance status
  - dietary notes / message
- The registry tracking form sends:
  - contributor name (optional)
  - payment method (`paypal`, `venmo`, `zelle`, or `other`)
  - contribution amount
  - transaction reference (optional)
  - note (optional)
- The `Responses` tab keeps both `Submitted At` and `Last Updated` so you can tell when a guest changed their RSVP.
- Keep phone numbers out of this repo; store them only in the private Google Sheet `Invites` tab.
- Registry totals are based on the submitted contribution logs; they do not automatically sync from PayPal, Venmo, or Zelle APIs.
- If you update the script later, redeploy the web app so the latest version is live.
