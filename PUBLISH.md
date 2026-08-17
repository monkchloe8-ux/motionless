# Publishing checklist — 10 September 2026

Everything works locally already. This is only about putting it on the internet.
If the files were uploaded to GitHub in advance, the whole thing is two toggles
and about five minutes.

---

## Before the day

- [ ] Ethics approval confirmed with your supervisor, in writing if possible
- [ ] Files uploaded to the GitHub repo (see "Uploading" below). Doing this
      early is the single biggest time-saver, because it's the only fiddly step
- [ ] Decide whether the `responses` sheet should be empty on launch day. If
      you've been testing, delete the test rows so your real data starts clean

## On the day

### 1. Make the repo public

github.com/monkchloe8-ux/motionless → **Settings** → scroll to the bottom →
**Danger Zone** → **Change repository visibility** → **Make public**.

Pages will not work on a free account while the repo is private. This is the
step that unlocks it.

### 2. Turn on Pages

**Settings** → **Pages** (left sidebar) → under "Build and deployment":

- Source: **Deploy from a branch**
- Branch: **main**, folder: **/ (root)**
- **Save**

Wait two or three minutes. The URL appears at the top of that same page:

```
https://monkchloe8-ux.github.io/motionless/
```

### 3. Check it before you send it anywhere

- [ ] Open the URL. The landing page loads, dark, with MOTION/LESS
- [ ] Scroll through all four movements. Each one animates and has the paragraph
- [ ] Drag a dial to 00. That movement goes still and composed, not blank
- [ ] Move your cursor over **the flow**. The words lean toward it
- [ ] Submit the form. You get the reward screen
- [ ] Check the Google Sheet. A new row appeared
- [ ] Delete that row, so launch data is clean
- [ ] Open the **Research** and **About** pages from the footer
- [ ] Open it on your phone. Check the movements still fit their boxes

### 4. Send it out

The URL is safe to put in a slide, an email, or a QR code.

---

## Uploading (do this in advance)

GitHub's web uploader can't take folders, which is why the site is a single
flat folder with no subdirectories.

1. Go to github.com/monkchloe8-ux/motionless
2. **Add file** → **Upload files**
3. In Finder, open `ASSIGNMENT 02 / motionless-site`
4. Select these and drag them onto the page:

   `index.html` `about.html` `findings.html` `research.html`
   `style.css` `movements.js` `site.js` `site-config.js`

5. Commit message: something like `current build`
6. **Commit changes**

Uploading a file that already exists just replaces it. That's fine and expected.

**Do not upload:** `README.md`, `PUBLISH.md`, `SETUP-responses.md`,
`google-apps-script.gs`, `package.json`. They do no harm, but they're your
working notes rather than the site, and `google-apps-script.gs` in particular
is clearer kept out of a public repo.

---

## Things that will go wrong, and what they mean

**The page loads but is completely black, or has no styling.**
A file didn't upload, or its name changed. All eight files must be at the top
level of the repo, not inside a folder. Check the file list on the repo page.

**The movements don't animate.**
`movements.js` or `site.js` is missing. Same fix.

**Submitting does nothing / no row appears in the sheet.**
Open the browser console (View → Developer → JavaScript Console) and look for a
red warning. Most likely `site-config.js` didn't upload, or the Apps Script
deployment was changed without redeploying.

**Pages says the site is published but you get a 404.**
Give it five minutes. If it persists, check Settings → Pages is set to `main`
and `/ (root)`, and that `index.html` is spelled exactly that way, lower case.

---

## Turning it off

To stop collecting responses without taking the site down: blank the URL in
`site-config.js` and re-upload that one file.

To take the site down entirely: Settings → Pages → Source → **None**. Or set
the repo back to private, which unpublishes it.

---

## What's public once you publish

- All the site code, and `site-config.js` including the Apps Script URL
- Nobody can read your responses with that URL. `doGet` only ever returns
  counts and averages, never individual rows
- Someone could, in principle, post junk rows to your sheet. Unlikely for a
  student project, but if the data ever looks odd, check the timestamps in the
  sheet for a burst of entries
- Your responses themselves stay private, in your Drive
