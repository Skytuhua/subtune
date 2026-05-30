// Phase 5 functional + visual QA harness.
// Drives the built app in headless Chromium, exercises every flow, asserts the
// results, and captures screenshots into review/shots/.
import { chromium, devices } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';

const BASE = process.env.QA_URL ?? 'http://localhost:4173/subtune/';
const OUT = 'review/shots';
mkdirSync(OUT, { recursive: true });

const SRT = `1
00:00:01,000 --> 00:00:03,000
Hello there

2
00:00:05,000 --> 00:00:07,500
General Kenobi

3
00:00:10,000 --> 00:00:12,000
You are a bold one`;

const results = [];
const ok = (name, cond, detail = '') => {
  results.push({ name, pass: !!cond, detail });
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  ...devices['Desktop Chrome'],
  viewport: { width: 1440, height: 1100 },
  colorScheme: 'dark', // app is dark-first; ensures the theme toggle starts at "dark"
});
await ctx.grantPermissions(['clipboard-read', 'clipboard-write']);

// Track any request that leaves localhost — proves no file data is uploaded.
const offHosts = new Set();
ctx.on('request', (req) => {
  const u = new URL(req.url());
  if (u.hostname !== 'localhost' && u.hostname !== '127.0.0.1') offHosts.add(u.hostname);
});

const page = await ctx.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

const firstStart = () => page.locator('input[aria-label="Cue 1 start time"]').inputValue();
const loadPaste = async (p, text) => {
  await p.getByRole('button', { name: /paste text instead/i }).click();
  await p.locator('textarea').first().fill(text);
  await p.getByRole('button', { name: /load pasted text/i }).click();
};

await page.goto(BASE, { waitUntil: 'networkidle' });

// --- Empty / landing state ---
ok('landing heading', await page.getByRole('heading', { name: /fix out-of-sync/i }).isVisible());
ok('dropzone present', await page.getByText(/drop a subtitle file here/i).isVisible());
await page.screenshot({ path: `${OUT}/01-landing-dark.png`, fullPage: true });

// --- Load via paste ---
await loadPaste(page, SRT);
await page.waitForSelector('text=/3 cues/');
ok('parsed 3 cues', await page.getByText(/3 cues/).isVisible());
await page.screenshot({ path: `${OUT}/02-editor-loaded.png`, fullPage: true });

// --- Constant shift ---
const before = await firstStart();
await page.locator('input[placeholder="+2.5"]').fill('+2');
await page.getByRole('button', { name: /apply shift/i }).click();
await page.waitForTimeout(150);
const afterShift = await firstStart();
ok('shift +2s', before === '00:00:01,000' && afterShift === '00:00:03,000', `${before} -> ${afterShift}`);
await page.screenshot({ path: `${OUT}/03-after-shift.png`, fullPage: true });

// --- Undo ---
await page.getByRole('button', { name: /^Undo$/i }).click();
await page.waitForTimeout(120);
ok('undo restores', (await firstStart()) === '00:00:01,000');

// --- Frame-rate conversion (25 -> 23.976 expands time) ---
await page.getByRole('tab', { name: /frame rate/i }).click();
await page.getByRole('button', { name: /convert frame rate/i }).click();
await page.waitForTimeout(150);
ok('fps convert applied', (await firstStart()) === '00:00:00,959', `now ${await firstStart()}`);
await page.screenshot({ path: `${OUT}/04-after-fps.png`, fullPage: true });
await page.getByRole('button', { name: /^Reset$/i }).click();
await page.waitForTimeout(120);

// --- Two-anchor linear resync ---
await page.getByRole('tab', { name: /resync/i }).click();
ok('resync anchors render', await page.getByText('First line', { exact: true }).isVisible());
const tsInputs = page.locator('input.font-mono');
// First line should stay at 1.000; last (currently 10.000) should become 20.000 -> ~2x stretch
await tsInputs.nth(1).fill('00:00:20.000');
await page.getByRole('button', { name: /apply linear resync/i }).click();
await page.waitForTimeout(150);
const lastStart = await page.locator('input[aria-label="Cue 3 start time"]').inputValue();
ok('resync stretched last cue to ~20s', lastStart === '00:00:20,000', `last=${lastStart}`);
await page.screenshot({ path: `${OUT}/05-after-resync.png`, fullPage: true });
await page.getByRole('button', { name: /^Reset$/i }).click();
await page.waitForTimeout(120);

// --- Cleanup tab ---
await page.getByRole('tab', { name: /clean up/i }).click();
await page.screenshot({ path: `${OUT}/06-cleanup-tab.png`, fullPage: true });
ok('cleanup toggles present', await page.getByText(/fix overlaps/i).isVisible());

// --- Export format toggle + download ---
await page.getByRole('button', { name: 'Export as VTT' }).click();
const [dl] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button', { name: /download/i }).click(),
]);
const fname = dl.suggestedFilename();
ok('download a .vtt file', /\.vtt$/.test(fname), fname);

// --- Copy to clipboard ---
await page.getByRole('button', { name: /^Copy$/i }).click();
await page.waitForTimeout(120);
const clip = await page.evaluate(() => navigator.clipboard.readText());
ok('clipboard has WEBVTT', clip.startsWith('WEBVTT'));

// --- Light mode ---
await page.getByRole('button', { name: /switch to light mode/i }).click();
await page.waitForTimeout(150);
ok('light mode', !((await page.locator('html').getAttribute('class')) ?? '').includes('dark'));
await page.screenshot({ path: `${OUT}/07-editor-light.png`, fullPage: true });
await page.getByRole('button', { name: /switch to dark mode/i }).click();

// --- Error handling: garbage input ---
await page.getByRole('button', { name: /^Close$/i }).click();
await page.waitForTimeout(120);
await loadPaste(page, 'this is not a subtitle file at all');
await page.waitForTimeout(150);
ok('garbage -> error alert', await page.getByRole('alert').isVisible());
await page.screenshot({ path: `${OUT}/08-error-state.png`, fullPage: true });

// --- Responsive: mobile 375 ---
const mobile = await ctx.newPage();
await mobile.setViewportSize({ width: 375, height: 800 });
await mobile.goto(BASE, { waitUntil: 'networkidle' });
await mobile.getByRole('button', { name: /try a sample file/i }).click();
await mobile.waitForTimeout(250);
await mobile.screenshot({ path: `${OUT}/09-mobile-375.png`, fullPage: true });
ok('mobile renders editor', await mobile.getByText(/cues/).first().isVisible());

// --- Responsive: tablet 768 ---
const tablet = await ctx.newPage();
await tablet.setViewportSize({ width: 768, height: 1024 });
await tablet.goto(BASE, { waitUntil: 'networkidle' });
await tablet.getByRole('button', { name: /try a sample file/i }).click();
await tablet.waitForTimeout(250);
await tablet.screenshot({ path: `${OUT}/10-tablet-768.png`, fullPage: true });

// --- Large file stress (5000 cues) ---
const f = (ms) => {
  const h = String(Math.floor(ms / 3600000)).padStart(2, '0');
  const m = String(Math.floor((ms % 3600000) / 60000)).padStart(2, '0');
  const sec = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
  const mm = String(ms % 1000).padStart(3, '0');
  return `${h}:${m}:${sec},${mm}`;
};
let big = '';
for (let i = 0; i < 5000; i++) big += `${i + 1}\n${f(i * 2000)} --> ${f(i * 2000 + 1500)}\nLine ${i + 1}\n\n`;
try {
  const big2 = await ctx.newPage();
  await big2.goto(BASE, { waitUntil: 'networkidle' });
  await big2.getByRole('button', { name: /paste text instead/i }).click();
  // Inject the large payload via the native value setter + a React-visible input
  // event. Playwright's .fill() simulates per-character entry and is far too slow
  // for a ~200 KB string; this measures real parse/render time, not typing speed.
  await big2.evaluate((text) => {
    const ta = document.querySelector('textarea');
    const setter = Object.getOwnPropertyDescriptor(
      window.HTMLTextAreaElement.prototype,
      'value',
    ).set;
    setter.call(ta, text);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }, big);
  const t0 = Date.now();
  await big2.getByRole('button', { name: /load pasted text/i }).click();
  await big2.waitForSelector('text=/5,000 cues/', { timeout: 30000 });
  ok('5000-cue file parses', Date.now() - t0 < 30000, `${Date.now() - t0}ms`);
} catch (e) {
  ok('5000-cue file parses', false, String(e).split('\n')[0]);
}

ok('no off-host requests', offHosts.size === 0, [...offHosts].join(',') || 'none');
ok('no console/page errors', errors.length === 0, errors.slice(0, 2).join(' | '));

writeFileSync('review/qa-results.json', JSON.stringify(results, null, 2));
const failed = results.filter((r) => !r.pass);
console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
await browser.close();
process.exit(failed.length === 0 ? 0 : 1);
