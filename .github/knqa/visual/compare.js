// KNQA CI: compare "before" and "after" screenshots.
// Usage: node compare.js <beforeDir> <afterDir> <diffDir> <thresholdPercent> <summary.md>
// Exits 2 when any screenshot differs by more than the threshold (or is missing).
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

const [A, B, D, THRESHOLD = '0.2', SUMMARY] = process.argv.slice(2);
const limit = parseFloat(THRESHOLD);
fs.mkdirSync(D, { recursive: true });

const pad = (img, w, h) => {
  if (img.width === w && img.height === h) { return img; }
  const out = new PNG({ width: w, height: h });
  out.data.fill(255);
  PNG.bitblt(img, out, 0, 0, img.width, img.height, 0, 0);
  return out;
};

const rows = [];
const names = [...new Set([...fs.readdirSync(A), ...fs.readdirSync(B)].filter((f) => f.endsWith('.png')))].sort();
for (const f of names) {
  const pa = path.join(A, f);
  const pb = path.join(B, f);
  if (!fs.existsSync(pa) || !fs.existsSync(pb)) {
    rows.push({ f, pct: 100, note: fs.existsSync(pa) ? 'missing after' : 'missing before' });
    continue;
  }
  const a = PNG.sync.read(fs.readFileSync(pa));
  const b = PNG.sync.read(fs.readFileSync(pb));
  const w = Math.max(a.width, b.width);
  const h = Math.max(a.height, b.height);
  const diff = new PNG({ width: w, height: h });
  const n = pixelmatch(pad(a, w, h).data, pad(b, w, h).data, diff.data, w, h, { threshold: 0.1 });
  const pct = (100 * n) / (w * h);
  if (n > 0) { fs.writeFileSync(path.join(D, f), PNG.sync.write(diff)); }
  rows.push({ f, pct, note: a.height === b.height ? '' : `height ${a.height} → ${b.height}px` });
}

rows.sort((x, y) => y.pct - x.pct);
const failing = rows.filter((r) => r.pct > limit);
const md = [
  `### KNQA visual comparison: ${failing.length ? `❌ ${failing.length} screenshot(s) over ${limit}%` : `✅ all ${rows.length} screenshots within ${limit}%`}`,
  '',
  '| Screenshot | Pixels changed | Note |',
  '|---|---|---|',
  ...rows.filter((r) => r.pct > 0).slice(0, 40).map((r) => `| ${r.f} | ${r.pct.toFixed(3)}% | ${r.note} |`),
  '',
  `${rows.filter((r) => r.pct === 0).length} of ${rows.length} screenshots are pixel-identical.`,
].join('\n');
console.log(md);
if (SUMMARY) { fs.appendFileSync(SUMMARY, md + '\n'); }
process.exit(failing.length ? 2 : 0);
