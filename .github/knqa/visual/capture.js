// KNQA CI: screenshot every page at 4 widths and run quick content checks.
// Usage: node capture.js <pages.json> <outDir> <path to en.json5 for raw-key detection>
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-core');

const [PAGES, OUT, I18N] = process.argv.slice(2);
const UI = process.env.KNQA_UI_URL || 'http://127.0.0.1:4000';
const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';
const WIDTHS = [375, 768, 1280, 1440];
const NO_MOTION = '*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}';

const pages = JSON.parse(fs.readFileSync(PAGES, 'utf8'));
// Translation keys with at least two dots: if one shows up as page text, a label is missing
const i18nKeys = new Set([...fs.readFileSync(I18N, 'utf8').matchAll(/^\s*"([a-z0-9_-]+(?:\.[a-z0-9_-]+){2,})"\s*:/gm)].map((m) => m[1]));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function settle(page) {
  await page.addStyleTag({ content: NO_MOTION }).catch(() => {});
  await page.waitForNetworkIdle({ idleTime: 1000, timeout: 15000 }).catch(() => {});
  // Scroll through the page so lazy-loaded images and sections render, then return to the top
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 100)); }
    window.scrollTo(0, 0);
  });
  await page.waitForNetworkIdle({ idleTime: 1000, timeout: 10000 }).catch(() => {});
  await sleep(1500);
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--hide-scrollbars', '--font-render-hinting=none', '--force-color-profile=srgb'],
  });
  const report = { registerLinkSeen: [], rawKeys: {}, consoleErrors: {}, loggedIn: false };
  const page = await browser.newPage();
  let current = '';
  page.on('console', (m) => {
    if (m.type() === 'error') { (report.consoleErrors[current] ||= []).push(m.text().slice(0, 200)); }
  });

  const shoot = async (name, url) => {
    for (const w of WIDTHS) {
      current = `${name}@${w}`;
      await page.setViewport({ width: w, height: 900 });
      await page.goto(UI + url, { waitUntil: 'domcontentloaded', timeout: 90000 });
      await settle(page);
      const text = await page.evaluate(() => document.body.innerText);
      if (/new user\?/i.test(text)) { report.registerLinkSeen.push(current); }
      const raw = [...new Set((text.match(/[a-z0-9_-]+(?:\.[a-z0-9_-]+){2,}/g) || []).filter((t) => i18nKeys.has(t)))];
      if (raw.length) { report.rawKeys[current] = raw.slice(0, 10); }
      await page.screenshot({ path: path.join(OUT, `${name}@${w}.png`), fullPage: true });
    }
  };

  for (const [n, u] of pages.public) { await shoot(n, u); }

  // Header login dropdown (desktop): must not offer self-registration
  current = 'login-dropdown@1280';
  await page.setViewport({ width: 1280, height: 900 });
  await page.goto(UI + '/', { waitUntil: 'domcontentloaded' });
  await settle(page);
  await page.evaluate(() => {
    const b = [...document.querySelectorAll('header a, header button')].find((x) => /log\s*in/i.test(x.textContent || ''));
    if (b) { b.click(); }
  });
  await sleep(1500);
  if (/new user\?/i.test(await page.evaluate(() => document.body.innerText))) { report.registerLinkSeen.push(current); }
  await page.screenshot({ path: path.join(OUT, 'login-dropdown@1280.png') });

  // Log in through the UI, then photograph the logged-in pages
  await page.goto(UI + '/login', { waitUntil: 'domcontentloaded' });
  await settle(page);
  await page.type('input[type="email"]', pages.admin);
  await page.type('input[type="password"]', pages.password);
  await Promise.all([page.waitForNavigation({ timeout: 60000 }).catch(() => {}), page.click('button[type="submit"]')]);
  await settle(page);
  report.loggedIn = await page.evaluate(() => !/log\s*in/i.test(document.querySelector('header')?.innerText || 'log in'));
  for (const [n, u] of pages.authed) { await shoot(n, u); }

  fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    screenshots: fs.readdirSync(OUT).filter((f) => f.endsWith('.png')).length,
    loggedIn: report.loggedIn,
    registerLinkSeen: report.registerLinkSeen,
    pagesWithRawKeys: Object.keys(report.rawKeys).length,
  }));
  await browser.close();
})().catch((e) => { console.error(e); process.exit(1); });
