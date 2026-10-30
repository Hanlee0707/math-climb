#!/usr/bin/env node
// Sprout canvas db over the stage MCP server with a family connection token, for a routine whose
// Sprout connector does not expose the canvas tools. Runs anywhere with node >= 20 and curl.
//   node coach/sprout.mjs get <canvasId> <docPath>
//   node coach/sprout.mjs set <canvasId> <docPath> <file.json>      (whole document)
//   node coach/sprout.mjs list <canvasId> <collectionPath> [limit]
// Prints the tool's JSON result on stdout, or {"error": "..."} and exit 2. SPROUT_TOKEN (env) is never printed.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
const TOKEN = process.env.SPROUT_TOKEN, MCP = process.env.SPROUT_MCP_URL || 'https://sprout-server-stage-606162082569.europe-west3.run.app/mcp';
if (!TOKEN) { console.error('SPROUT_TOKEN is not set'); process.exit(3); }
const [, , cmd, canvasId, path, extra] = process.argv;
let name, args;
if (cmd === 'get' && canvasId && path) { name = 'canvas_get_document'; args = { canvasId, path }; }
else if (cmd === 'set' && canvasId && path && extra) { name = 'canvas_set_document'; let data; try { data = JSON.parse(readFileSync(extra, 'utf8')); } catch (e) { console.log(JSON.stringify({ error: 'bad json file: ' + e.message })); process.exit(2); } args = { canvasId, path, data }; }
else if (cmd === 'list' && canvasId && path) { name = 'canvas_list_documents'; args = { canvasId, path, limit: Number(extra) || 50 }; }
else { console.error('usage: sprout.mjs get|set|list <canvasId> <path> [file.json|limit]'); process.exit(2); }
const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } });
const r = spawnSync('curl', ['-sS', '--max-time', '60', '-X', 'POST', MCP, '-H', 'authorization: Bearer ' + TOKEN, '-H', 'content-type: application/json', '-H', 'accept: application/json, text/event-stream', '-H', 'user-agent: math-climb-coach/1', '-d', body], { encoding: 'utf8' });
if (r.status !== 0) { console.log(JSON.stringify({ error: 'curl failed: ' + (r.stderr || '').trim().slice(0, 200) })); process.exit(2); }
const line = r.stdout.split('\n').find(l => l.startsWith('data: ')) || r.stdout;
let m; try { m = JSON.parse(line.replace(/^data: /, '')); } catch { console.log(JSON.stringify({ error: 'bad reply: ' + r.stdout.slice(0, 200) })); process.exit(2); }
if (m.error) { console.log(JSON.stringify({ error: m.error })); process.exit(2); }
const res = m.result || {};
let out; try { out = JSON.parse(res.content[0].text); } catch { out = res.structuredContent || { text: (res.content || []).map(c => c.text).join('\n') }; }
if (res.isError || out.error) { console.log(JSON.stringify({ error: out.error || out })); process.exit(2); }
delete out._sprout;
console.log(JSON.stringify(out));
