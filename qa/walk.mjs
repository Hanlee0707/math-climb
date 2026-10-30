// Headless walk of the Math Climb canvas with a stub `sprout` host (db in memory, tts no-op).
// node qa/walk.mjs <policy> [out-dir]   policy: all-right | all-wrong | upto:<level> | mixed
import { chromium } from '/Users/hanlee/workspace/resources/sprout-app/.worktrees/slot-2/node_modules/playwright-core/index.mjs';
import fs from 'node:fs'; import path from 'node:path';
const [policy = 'all-right', out = '/tmp/mc-walk'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const html = fs.readFileSync(new URL('../canvas/index.html', import.meta.url), 'utf8');
const STUB = `
  window.__db = window.__db || {}; window.__log = []; window.__state = window.__state || {};
  const subs = {};
  const snap = (p) => ({ id: p.split('/').pop(), exists: p in __db, data: () => __db[p], metadata: { fromCache: false, hasPendingWrites: false } });
  const docRef = (p) => { if (p.split('/').length % 2) throw new TypeError('odd document path ' + p); return ({ id: p.split('/').pop(), path: p,
    async get(){ return snap(p); },
    async set(d){ __db[p] = JSON.parse(JSON.stringify(d)); __log.push(['set', p]); (subs[p] || []).forEach(f => f(snap(p))); },
    async update(d){ if (!(p in __db)) throw { code: 'invalid_argument' }; Object.assign(__db[p], d); (subs[p] || []).forEach(f => f(snap(p))); },
    async delete(){ delete __db[p]; },
    onSnapshot(f){ (subs[p] = subs[p] || []).push(f); setTimeout(() => f(snap(p)), 0); return () => { subs[p] = subs[p].filter(x => x !== f); }; } }); };
  window.__push = (p, d) => { __db[p] = d; (subs[p] || []).forEach(f => f(snap(p))); };
  window.__spoken = [];
  window.sprout = { state: window.__state, whoami: () => ({ childName: 'Kid', ageTier: 'early', principalType: 'child' }),
    use: async n => n === 'db' ? { self: 'kid-1', task: null, run: null, doc: docRef, collection(){ throw new Error('nope'); } } : null,
    tts: { speak: async ({ text }) => { __spoken.push(text); }, stop: async () => {} }, signal(s){ __log.push(['signal', s]); },
    progress: { setup(x){ __log.push(['progress.setup', x.total]); }, set(x){ __log.push(['progress.set', x.current]); } },
    complete(x){ window.__completed = x; __log.push(['complete']); }, actions: { register(name){ (window.__moves = window.__moves || []).push(typeof name === 'string' ? name : name.name); } },
    net: { fetch: async ({ url }) => { __log.push(['net', url.replace(/key=.*/, 'key=…')]); return { status: 'ok', body: { ok: true } }; } },
    loading: { begin: () => ({ ready(){ __log.push(['ready']); } }) }, onBackPress(f){ window.__back = f; } };
`;
const browser = await chromium.launch({ executablePath: '/Users/hanlee/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.setContent(html.replace('<script>', '<script>' + STUB + '</script><script>'), { waitUntil: 'load' });
await page.waitForTimeout(300);
const shot = async n => page.screenshot({ path: path.join(out, n + '.png'), fullPage: true });
await shot('01-home');
const rightFor = (level) => policy === 'all-right' ? true : policy === 'all-wrong' ? false : policy.startsWith('upto:') ? level <= +policy.slice(5) : policy === 'coach' ? level <= 1 : Math.random() < .6;
let coachPlanted = false, shots = 2, used = [];
await page.click('#bStart');
for (let guard = 0; guard < 80; guard++) {
  await page.waitForTimeout(80);
  if (await page.isVisible('#finSheet')) break;
  if (await page.isVisible('#roundSheet')) {
    if (shots < 9) await shot(String(shots++).padStart(2, '0') + '-round');
    if (policy === 'coach' && !coachPlanted) {
      coachPlanted = true;
      const sid = await page.evaluate(() => S.sid);
      await page.evaluate(({ sid }) => __push(`data/users/kid-1/climb/sessions/${sid}/coach/next`, { afterRound: 1, level: 1, note: 'Sprout here. Let us count a little higher together.', items: [
        { std: 'K.CC.B.5', lc: 'count up to 20 objects', text: 'How many stars?', say: 'How many stars are there?', pic: { kind: 'dots', n: 9, emoji: '⭐', arr: 'array' }, choices: [{ v: '9' }, { v: '8', tag: 'off-by-one' }, { v: '10', tag: 'off-by-one' }], ans: '9', why: 'Count them: nine.', hint: 'Count in rows.' },
        { std: 'K.OA.A.2', text: '4 frogs and 3 more. How many?', pic: { kind: 'dots', n: 7, groups: [4, 3], emoji: '🐸', arr: 'line' }, choices: ['7', '6', { v: '4', tag: 'part' }], ans: '7', why: 'Four and three more is seven.' },
        { std: 'K.CC.C.6', text: 'Which is more, 6 or 4?', choices: [{ v: '6' }, { v: '4', tag: 'reversed' }], ans: '6', why: 'Six is more than four.' },
        { std: 'bad', text: 'broken', choices: ['x'], ans: 'y' },
        { std: 'K.OA.A.5', text: '2 + 2 = ?', eq: true, choices: ['4', '3', '5', '22'], ans: '4', why: 'Two and two is four.' }
      ] }), { sid });
    }
    await page.click('#bRoundGo'); continue;
  }
  const it = await page.evaluate(() => { const it = curItem(); return it ? { ans: it.ans, level: S.cur.level, source: S.cur.source, i: S.cur.i, choices: it.choices.map(c => c.v), std: it.std } : null; });
  if (!it) { await page.waitForTimeout(100); continue; }
  used.push(it.std + '@' + it.source);
  if (it.i === 0 && shots < 9) await shot(String(shots++).padStart(2, '0') + '-q-L' + it.level);
  const right = rightFor(it.level);
  const pickV = right ? it.ans : (it.choices.find(v => v !== it.ans) || it.ans);
  if (!right && it.i === 1) { await page.click('#bHint'); await page.waitForTimeout(50); }
  const btns = await page.$$('#choices .ch'); let clicked = false;
  for (const b of btns) { if ((await b.textContent()).trim() === pickV) { await b.click(); clicked = true; break; } }
  if (!clicked) throw new Error('choice not found ' + pickV);
  await page.waitForTimeout(60);
  if (!right && it.i === 1) { await page.click('#bShow'); await page.waitForTimeout(900); if (shots < 9) await shot(String(shots++).padStart(2, '0') + '-showme'); }
  await page.click('#bNext');
}
if (!(await page.isVisible('#finSheet'))) throw new Error('never finished');
await shot('90-finish');
await page.evaluate(() => document.querySelector('#finSheet details').open = true); await page.waitForTimeout(50);
await (await page.$('#finMap')).screenshot({ path: path.join(out, '91-map-kid.png') }); await (await page.$('#finMapAll')).screenshot({ path: path.join(out, '91-map-all.png') });
const fin = await page.evaluate(() => ({ title: $('finTitle').textContent, sub: $('finSub').textContent, list: $('finList').textContent, report: $('finReport').textContent, placement: S.placement, rounds: S.rounds.map(r => [r.level, r.score, r.source]), moves: window.__moves, docs: Object.keys(window.__db), spoken: window.__spoken.length }));
await page.click('#bDone'); await page.waitForTimeout(50);
await shot('92-home-after');
const done = await page.evaluate(() => ({ completed: window.__completed, lastCard: !$('lastCard').hidden, homeMap: !!document.querySelector('#homeMap svg') }));
console.log(JSON.stringify({ policy, errors, rounds: fin.rounds, title: fin.title, sub: fin.sub, list: fin.list, placement: { level: fin.placement.level, label: fin.placement.label, can: fin.placement.can, next: fin.placement.next, states: fin.placement.states }, report: fin.report, moves: fin.moves, docs: fin.docs, spoken: fin.spoken, coachItemsUsed: used.filter(u => u.endsWith('@coach')).length, done }, null, 1));
await browser.close();
