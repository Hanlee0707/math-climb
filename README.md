# Math Climb

A Sprout canvas (stage) where a kid climbs rungs of math, Pre-K to Grade 5, in rounds of five questions. Four or five right moves up a rung, two or fewer moves down, three stays once. Every wrong choice carries a Learning Commons misconception tag, so the feedback names the trap; "Show me" draws the working while Sprout's voice explains. At the end the canvas draws the knowledge graph it walked (Learning Commons coherence map, one hop around the ladder standards is baked in).

- `canvas/index.html`: the kid page. Build: replace `__CLIMB_KEY__` with the hop key, upload with `canvas.prepare_upload` (over 50 KB).
- `vercel/climb.js`: the hop on read-along-eight.vercel.app that turns the canvas's approved GET into the POST that fires the Claude Code routine. Env: CLIMB_KEY, CLIMB_FIRE_URL, CLIMB_TOKEN, CLIMB_CANVAS_ID.
- `coach/ROUTINE_PROMPT.md`: the routine ("the coach"). It reads the session from the canvas db with `coach/sprout.mjs` (SPROUT_TOKEN, a family connection token; the claude.ai Sprout connector exposes no canvas tools to routines), walks the Learning Commons progression map with `coach/lc.mjs` (LC_API_KEY in the environment), and writes `coach/next` (the next round) and the grown-up report on `placement`.
- `coach/lc.mjs`: Learning Commons Knowledge Graph MCP over plain HTTP, for a routine that cannot mount MCP servers.
- `qa/walk.mjs`: headless walk with a stub Sprout host (playwright-core + a local Chromium).

Data (canvas db): `data/users/<kid>/profile {level}`, `data/users/<kid>/climb/sessions/<sid>` (rounds, items, tags), `.../coach/next`, `data/users/<kid>/placement`.

Secrets live in env, never here.
