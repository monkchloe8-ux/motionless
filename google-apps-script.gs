/* ══════════════════════════════════════════════════════════
   MOTION / LESS — the thing that catches responses
   This is NOT part of the website. It lives inside a Google
   Sheet. Setup instructions are in SETUP-responses.md.

   It does two jobs:
     doPost  — a visitor submits, a row is added to the sheet
     doGet   — findings.html asks for the totals, and gets back
               counts only, never individual responses
   ══════════════════════════════════════════════════════════ */

var SHEET_NAME = 'responses';
var MOVEMENTS  = ['fall', 'bloom', 'pulse', 'flow'];

/* ── a response arrives ── */
function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var dials = d.dials || {};
    getSheet().appendRow([
      new Date(),
      num(dials.fall), num(dials.bloom), num(dials.pulse), num(dials.flow),
      d.timeToFirstMove === null ? '' : d.timeToFirstMove,
      d.designer  || '',
      d.sensitive || '',
      d.reducedMotion ? 'yes' : 'no'
    ]);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

/* ── findings.html asks what everyone chose ── */
function doGet() {
  var rows = getSheet().getDataRange().getValues();
  rows.shift();                                   // drop the header row

  var out = { n: 0, hist: {}, avg: {} };
  MOVEMENTS.forEach(function (k) { out.hist[k] = [0,0,0,0,0]; out.avg[k] = 0; });

  var counted = 0;
  rows.forEach(function (r) {
    if (!r[0]) return;
    counted++;
    MOVEMENTS.forEach(function (k, i) {
      var v = Number(r[i + 1]);
      if (isNaN(v)) return;
      // five buckets, left = 00 static, right = 03 maximal
      var b = Math.min(4, Math.max(0, Math.floor((v / 3) * 5)));
      out.hist[k][b]++;
      out.avg[k] += v;
    });
  });

  out.n = counted;
  if (counted) {
    MOVEMENTS.forEach(function (k) { out.avg[k] = Math.round((out.avg[k] / counted) * 100) / 100; });
  }
  return json(out);
}

/* ── helpers ── */
function num(v) { return (v === undefined || v === null || v === '') ? '' : Number(v); }

function json(o) {
  return ContentService
    .createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(SHEET_NAME);
    sh.appendRow(['timestamp', 'fall', 'bloom', 'pulse', 'flow',
                  'secondsToFirstMove', 'designer', 'sensitive', 'reducedMotion']);
  }
  return sh;
}
