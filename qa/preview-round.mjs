// Play one full round on the stage preview host and report the kid id and session id the canvas used.
import { chromium } from '/Users/hanlee/workspace/resources/sprout-app/.worktrees/slot-2/node_modules/playwright-core/index.mjs';
const [url, out = '/tmp/mc-preview'] = process.argv.slice(2);
import fs from 'node:fs'; fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ executablePath: '/Users/hanlee/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errors = []; page.on('pageerror', e => errors.push(String(e)));
await page.goto(url, { waitUntil: 'load', timeout: 60000 }); await page.waitForTimeout(2500);
const f = page.frames().find(x => x !== page.mainFrame());
await f.click('#bStart'); await page.waitForTimeout(800);
const ids = await f.evaluate(() => ({ self: db && db.self, sid: S.sid, task: db && db.task }));
for (let i = 0; i < 5; i++) {
  const it = await f.evaluate(() => { const it = curItem(); return { ans: it.ans, i: S.cur.i }; });
  const btns = await f.$$('#choices .ch'); for (const b of btns) if ((await b.textContent()).trim() === (i === 1 ? (await f.evaluate(() => curItem().choices.find(c => c.v !== curItem().ans).v)) : it.ans)) { await b.click(); break; }
  await page.waitForTimeout(300); if (i === 1) { await f.click('#bShow'); await page.waitForTimeout(800); await page.screenshot({ path: out + '/r-showme.png', fullPage: true }); }
  await f.click('#bNext'); await page.waitForTimeout(300);
}
await page.waitForTimeout(800);
const sheet = await f.evaluate(() => ({ visible: !document.getElementById('roundSheet').hidden, k: document.getElementById('rsK').textContent, score: document.getElementById('rsScore').textContent, verdict: document.getElementById('rsVerdict').textContent, rounds: S.rounds.length }));
await page.screenshot({ path: out + '/r-round.png', fullPage: true });
console.log(JSON.stringify({ ids, sheet, errors }));
await browser.close();
