// Math Climb wake: the canvas can only GET an approved site through Sprout (sprout.net.fetch), so this hop
// turns that GET into the POST that fires Han's Claude Code routine ("the coach"). The routine then reads the
// session from the canvas db, walks the Learning Commons progression map and writes the next round and the
// report. Nothing from the kid rides the wake except the ids the canvas already holds and the round number.
// Env: CLIMB_KEY (shared with the canvas), CLIMB_FIRE_URL, CLIMB_TOKEN, CLIMB_CANVAS_ID.
const json = (body, status = 200) => Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
export async function GET(request) {
  const url = new URL(request.url), q = k => url.searchParams.get(k) || '';
  if (!process.env.CLIMB_KEY || q('key') !== process.env.CLIMB_KEY) return json({ ok: false, code: 'not_granted' }, 401);
  const sid = q('sid'), kid = q('kid'), round = q('round');
  if (!/^[a-z0-9_-]{4,40}$/i.test(sid) || !/^[0-9a-f-]{36}$/i.test(kid) || !/^[0-9]{1,2}$/.test(round)) return json({ ok: false, code: 'bad_request' }, 400);
  const fire = process.env.CLIMB_FIRE_URL, token = process.env.CLIMB_TOKEN;
  if (!fire || !token) return json({ ok: false, code: 'not_configured' });
  try {
    const r = await fetch(fire, { method: 'POST', headers: { authorization: `Bearer ${token}`, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' }, body: JSON.stringify({ text: `Math Climb: kid ${kid} finished round ${round} of session ${sid} on canvas ${process.env.CLIMB_CANVAS_ID || ''}. Run one wake now.` }), signal: AbortSignal.timeout(8000) });
    return json({ ok: r.ok, status: r.status });
  } catch (e) {
    return json({ ok: false, code: 'fire_failed', detail: String(e && e.message).slice(0, 80) });
  }
}
