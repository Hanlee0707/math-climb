// Open the stage preview host for the canvas and walk the first screens (real host, real db if it has one).
import { chromium } from '/Users/hanlee/workspace/resources/sprout-app/.worktrees/slot-2/node_modules/playwright-core/index.mjs';
const [url, out = '/tmp/mc-preview'] = process.argv.slice(2);
import fs from 'node:fs'; fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/Users/hanlee/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errors = [], logs = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => logs.push(m.type() + ': ' + m.text().slice(0, 160)));
await page.goto(url, { waitUntil: 'load', timeout: 60000 });
await page.waitForTimeout(2500);
await page.screenshot({ path: out + '/p1.png', fullPage: true });
const frames = page.frames().map(f => f.url().slice(0, 100));
let inner = page.frames().find(f => f !== page.mainFrame()) || page.mainFrame();
const has = await inner.evaluate(() => ({ title: document.title, start: !!document.getElementById('bStart'), sprout: typeof sprout, db: typeof sprout === 'object' && sprout && typeof sprout.use })).catch(e => ({ err: String(e) }));
let after = null;
try { await inner.click('#bStart', { timeout: 5000 }); await page.waitForTimeout(1200); await page.screenshot({ path: out + '/p2.png', fullPage: true }); after = await inner.evaluate(() => ({ q: document.getElementById('qText').textContent, level: document.getElementById('playLvl').textContent, self: typeof db !== 'undefined' && db ? (db.self ? 'has-self' : 'no-self') : 'no-db' })); } catch (e) { after = { err: String(e).slice(0, 200) }; }
console.log(JSON.stringify({ frames, has, after, errors, logs: logs.slice(0, 15) }, null, 1));
await browser.close();
