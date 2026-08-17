# Collecting responses in a Google Sheet

**This is already set up and live.** The steps below are kept as a record of
how it was built, and for if you ever need to rebuild or change it.

- **Sheet:** "MOTION LESS responses" in your Google Drive, `responses` tab
- **Endpoint:** already pasted into `site-config.js`
- **Tested:** a test response was sent, landed correctly, and was then deleted,
  so the sheet is empty and ready for real data

To stop collecting at any point, blank out the URL in `site-config.js`.

**Before you start:** check with your supervisor about ethics approval.
You're collecting data from people, including whether they experience
discomfort from motion, which edges toward health information. That needs
sorting before the site is public, not after.

---

## 1. Make the sheet

Go to [sheets.new](https://sheets.new). Name it something like
`MOTION LESS responses`. Leave it empty. The script builds the columns itself.

## 2. Open the script editor

In the sheet: **Extensions → Apps Script**. A code window opens with a
nearly empty `Code.gs`.

## 3. Paste the script

Delete everything in that window. Open `google-apps-script.gs` from this
folder, copy all of it, paste it in. Click the save icon.

## 4. Deploy it

Click **Deploy → New deployment**.

- Click the gear next to "Select type" and choose **Web app**
- **Description:** anything, e.g. `motionless v1`
- **Execute as:** Me
- **Who has access:** **Anyone** ← this matters. Without it, responses are rejected.
- Click **Deploy**

Google will ask you to authorise it. It will warn that the app isn't verified.
That's expected for your own script: click **Advanced**, then
**Go to (your project name)**, then **Allow**.

Copy the **Web app URL** it gives you. It looks like:

```
https://script.google.com/macros/s/AKfy...long.../exec
```

## 5. Paste the URL into the site

Open `site-config.js` in this folder. Put the URL between the quotes:

```js
window.MOTIONLESS_ENDPOINT = 'https://script.google.com/macros/s/AKfy.../exec';
```

Save. That's it. One line, one file, and both the main page and the findings
page pick it up.

## 6. Check it works

Open `index.html`, move some dials, submit. Go back to your sheet: there
should be a new row. If there isn't, open the browser console
(**View → Developer → JavaScript Console**) and look for a red warning.

---

## What lands in the sheet

| column | what it is |
|---|---|
| `timestamp` | when they submitted |
| `fall` `bloom` `pulse` `flow` | the exact dial value, 0 to 3, to two decimals |
| `secondsToFirstMove` | how long before they touched any dial |
| `designer` | yes / no |
| `sensitive` | yes / sometimes / no |
| `reducedMotion` | whether their system asks for less motion |

Nothing identifying. No names, no emails, no IP addresses. Keep it that way.

## What the findings page shows

Once the endpoint is set, `findings.html` stops showing placeholder bars and
asks the script for totals: how many responses fell into each of five bands
per movement, plus the average. It only ever receives counts, never anyone's
individual answers.

## If you change the script later

Apps Script keeps serving the old version until you redeploy. Use
**Deploy → Manage deployments → edit (pencil) → Version: New version → Deploy**,
which keeps the same URL. Creating a *new* deployment gives you a different
URL and you'd have to update `site-config.js` again.

## Getting the data into your report

**File → Download → Comma-separated values** from the sheet. That opens in
Excel or Numbers, and the raw dial values are what you'd chart or run
statistics on for your write-up.
