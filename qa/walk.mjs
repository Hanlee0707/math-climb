// Headless walk of the Math Climb canvas with a stub `sprout` host (db in memory, tts no-op).
//   node qa/walk.mjs <policy> [out-dir]     policy: all-right | all-wrong | upto:<level> | coach | parent
// `parent` seeds a roster, a finished kid session and a placement, then opens the page as a parent and taps the map.
import { chromium } from '/Users/hanlee/workspace/resources/sprout-app/.worktrees/slot-2/node_modules/playwright-core/index.mjs';
import fs from 'node:fs'; import path from 'node:path';
const [policy = 'all-right', out = '/tmp/mc-walk'] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const html = fs.readFileSync(new URL('../canvas/index.html', import.meta.url), 'utf8');
const KID = '019fec86-09d1-7474-9196-01b3fdc70da7';
const STUB = (self, seed) => `
  window.__db = ${JSON.stringify(seed || {})}; window.__log = []; window.__spoken = [];
  const subs = {}, csubs = {};
  const snap = (p) => ({ id: p.split('/').pop(), exists: p in __db, data: () => __db[p], metadata: { fromCache: false, hasPendingWrites: false } });
  const fire = (p) => { (subs[p] || []).forEach(f => f(snap(p))); const col = p.split('/').slice(0, -1).join('/'); (csubs[col] || []).forEach(f => f(colSnap(col))); };
  const colSnap = (col) => { const docs = Object.keys(__db).filter(k => k.startsWith(col + '/') && k.split('/').length === col.split('/').length + 1).map(snap); return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: {} }; };
  const docRef = (p) => { if (p.split('/').length % 2) throw new TypeError('odd document path ' + p); return ({ id: p.split('/').pop(), path: p,
    async get(){ return snap(p); },
    async set(d){ __db[p] = JSON.parse(JSON.stringify(d)); __log.push(['set', p]); fire(p); },
    async update(d){ if (!(p in __db)) throw { code: 'invalid_argument' }; Object.assign(__db[p], d); fire(p); },
    async delete(){ delete __db[p]; },
    onSnapshot(f){ (subs[p] = subs[p] || []).push(f); setTimeout(() => f(snap(p)), 0); return () => { subs[p] = subs[p].filter(x => x !== f); }; } }); };
  const colRef = (col) => { if (!(col.split('/').length % 2)) throw new TypeError('even collection path ' + col); return { path: col, doc: (id) => docRef(col + '/' + id), async get(){ return colSnap(col); }, onSnapshot(f){ (csubs[col] = csubs[col] || []).push(f); setTimeout(() => f(colSnap(col)), 0); return () => {}; } }; };
  window.__push = (p, d) => { __db[p] = d; fire(p); };
  window.sprout = { state: {}, whoami: async () => (${JSON.stringify(self)} === 'parent-1' ? { principalType: 'parent' } : { childName: 'Kid', ageTier: 'tier1', principalType: 'child' }),
    use: async n => n === 'db' ? { self: ${JSON.stringify(self)}, task: null, run: null, doc: docRef, collection: colRef } : null,
    tts: { speak: async ({ text }) => { __spoken.push(text); }, stop: async () => {} },
    progress: { setup(x){ __log.push(['progress.setup', x.total]); }, set(x){ __log.push(['progress.set', x.current]); }, hide(){ __log.push(['progress.hide']); } },
    complete(x){ window.__completed = x; __log.push(['complete']); }, actions: { register(name){ (window.__moves = window.__moves || []).push(typeof name === 'string' ? name : name.name); } },
    net: { fetch: async ({ url }) => { __log.push(['net', url.replace(/key=.*/, 'key=…')]); return { status: 'ok', body: { ok: true } }; } },
    loading: { begin: () => ({ ready(){ __log.push(['ready']); } }) }, onBackPress(f){ window.__back = f; } };
`;
const browser = await chromium.launch({ executablePath: '/Users/hanlee/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const errors = []; page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
const shot = async n => page.screenshot({ path: path.join(out, n + '.png'), fullPage: true });
const roster = { 'family/roster': { kids: [{ id: KID, name: 'Little Tommy' }, { id: '019f72cc-f34e-7528-a88b-7eaa1d128b78', name: 'Viv' }] } };

if (policy === 'parent') {
  const seed = Object.assign({}, roster, {
    [`data/users/${KID}/climb/sessions/s1`]: { startedAt: '2026-10-30T08:25:56Z', updatedAt: '2026-10-30T08:28:00Z', status: 'done', level: 0, startLevel: 0, roundsDone: 2, rounds: [
      { level: 0, levelLabel: 'Pre-K', score: 4, of: 5, source: 'ladder', items: [{ std: 'K.CC.A.3', text: 'Tap the number four', picked: '4', ans: '4', ok: true, tag: null }, { std: 'K.CC.C.6', text: 'Which has more?', picked: 'cookies', ans: 'cookies', ok: true, tag: null }, { std: 'K.CC.C.6', text: 'Which has more?', picked: 'flowers', ans: 'flowers', ok: true, tag: null }, { std: 'K.CC.B.5', text: 'How many frogs?', picked: '3', ans: '3', ok: true, tag: null }, { std: 'K.CC.B.5', text: 'How many ducks?', picked: '4', ans: '3', ok: false, tag: 'off-by-one' }] },
      { level: 1, levelLabel: 'K', score: 2, of: 5, source: 'ladder', items: [{ std: 'K.CC.B.5', text: 'How many frogs?', picked: '11', ans: '12', ok: false, tag: 'off-by-one' }, { std: 'K.OA.A.5', text: '5 − 1 = ?', picked: '3', ans: '4', ok: false, tag: 'off-by-one' }, { std: 'K.OA.A.2', text: '5 frogs. 3 go away. How many are left?', picked: '8', ans: '2', ok: false, tag: 'adds' }, { std: 'K.CC.C.6', text: 'More flowers, more balloons, or the same?', picked: 'the same', ans: 'the same', ok: true, tag: null }, { std: 'K.CC.B.5', text: 'How many frogs?', picked: '8', ans: '8', ok: true, tag: null }] }] },
    [`data/users/${KID}/placement`]: { at: '2026-10-30T08:27:43Z', by: 'ladder', level: 0, label: 'Pre-K', can: ['more, fewer, same', 'counting how many', 'reading numerals'], next: ['adding and taking away within 5', 'adding and taking away within 10'], note: 'You count like a champ. Next time we take some away!', report: 'Pre-K rung after 2 rounds. Met K.CC.A.3 (numerals) and K.CC.C.6 (compare); K.CC.B.5 (counting to 20) was mixed, one off-by-one each round; K.OA.A.2 and K.OA.A.5 (adding and taking away within 10 and 5) not yet, with an adds-instead-of-subtracts pick. Next: K.OA.A.5 within 5 with objects, the prerequisite the SAP map gives for K.OA.A.2.', graph: { states: { 'K.OA.A.5': 'next' } }, states: { 'K.CC.A.3': 'met', 'K.CC.B.5': 'mixed', 'K.CC.C.6': 'met', 'K.OA.A.2': 'missed', 'K.OA.A.5': 'missed' } }
  });
  await page.setContent(html.replace('<script>', '<script>' + STUB('parent-1', seed) + '</script><script>'), { waitUntil: 'load' });
  await page.waitForTimeout(500);
  const view = await page.evaluate(() => document.documentElement.dataset.view);
  await shot('p1-home');
  await page.click('#map .n[data-code="K.OA.A.2"]'); await page.waitForTimeout(200); await shot('p2-node');
  const ex1 = await page.evaluate(() => $('explain').innerText.slice(0, 400));
  const hop = await page.$('#explain .hops .act'); const hopText = hop ? await hop.textContent() : null; if (hop) { await hop.click(); await page.waitForTimeout(200); await shot('p3-hop'); }
  await page.click('#bScope'); await page.waitForTimeout(200); await shot('p4-whole');
  await page.click('#tabs .act:nth-child(2)'); await page.waitForTimeout(200); await shot('p5-kid2');
  console.log(JSON.stringify({ policy, view, errors, ex1, hopText, sel: await page.evaluate(() => PV.sel) }, null, 1));
  await browser.close(); process.exit(0);
}

await page.setContent(html.replace('<script>', '<script>' + STUB('kid-1', roster) + '</script><script>'), { waitUntil: 'load' });
await page.waitForTimeout(300);
await shot('01-home');
const rightFor = (level) => policy === 'all-right' ? true : policy === 'all-wrong' ? false : policy.startsWith('upto:') ? level <= +policy.slice(5) : policy === 'coach' ? level <= 1 : Math.random() < .6;
let coachPlanted = false, shots = 2, used = [];
const view = await page.evaluate(() => document.documentElement.dataset.view);
await page.click('#bStart');
for (let guard = 0; guard < 80; guard++) {
  await page.waitForTimeout(60);
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
  const it = await page.evaluate(() => { const it = curItem(); return it ? { ans: it.ans, level: S.cur.level, source: S.cur.source, i: S.cur.i, choices: it.choices.map(c => c.v), std: it.std, frozen: $('choices').classList.contains('frozen') } : null; });
  if (!it) { await page.waitForTimeout(100); continue; }
  used.push(it.std + '@' + it.source);
  if (it.i === 0 && shots < 9) await shot(String(shots++).padStart(2, '0') + '-q-L' + it.level);
  await page.evaluate(() => { clearTimeout(frozenT); $('choices').classList.remove('frozen'); });
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
const fin = await page.evaluate(() => ({ title: $('finTitle').textContent, note: $('finNote').textContent, can: $('finCan').textContent, next: $('finNext').textContent, placement: S.placement, rounds: S.rounds.map(r => [r.level, r.score, r.source]), moves: window.__moves, docs: Object.keys(window.__db), spoken: window.__spoken.slice(0, 12), signals: window.__log.filter(l => l[0] === 'signal').length }));
await page.click('#bDone'); await page.waitForTimeout(50);
await shot('92-home-after');
const done = await page.evaluate(() => ({ completed: window.__completed, startDisabled: $('bStart').disabled }));
console.log(JSON.stringify({ policy, view, errors, rounds: fin.rounds, title: fin.title, note: fin.note, can: fin.can, next: fin.next, states: fin.placement.states, moves: fin.moves, docs: fin.docs, spoken: fin.spoken, signals: fin.signals, coachItemsUsed: used.filter(u => u.endsWith('@coach')).length, done }, null, 1));
await browser.close();
