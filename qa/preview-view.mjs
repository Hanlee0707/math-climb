import { chromium } from '/Users/hanlee/workspace/resources/sprout-app/.worktrees/slot-2/node_modules/playwright-core/index.mjs';
const [url, out = '/tmp/mc-preview'] = process.argv.slice(2);
import fs from 'node:fs'; fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/Users/hanlee/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.goto(url, { waitUntil: 'load', timeout: 60000 }); await page.waitForTimeout(3000);
const f = page.frames().find(x => x !== page.mainFrame());
const info = await f.evaluate(async () => { let who = null; try { who = await sprout.whoami(); } catch (e) { who = 'throws: ' + (e && e.message); } return { view: document.documentElement.dataset.view, self: db && db.self, who, tabs: document.querySelectorAll('#tabs .act').length, stats: document.getElementById('pStats') ? document.getElementById('pStats').innerText.replace(/\n/g, ' ') : null }; });
await page.screenshot({ path: out + '/v3.png', fullPage: true });
if (info.view === 'parent') { try { await f.click('#map .n.missed, #map .n.mixed, #map .n.met', { timeout: 3000 }); await page.waitForTimeout(300); await page.screenshot({ path: out + '/v3-node.png', fullPage: true }); } catch (e) { info.nodeErr = String(e).slice(0, 120); } }
console.log(JSON.stringify({ info, errors }));
await browser.close();
