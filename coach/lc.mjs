#!/usr/bin/env node
// Learning Commons Knowledge Graph over plain HTTP (the MCP server at kg.mcp.learningcommons.org), for a
// Claude Code routine that cannot mount MCP servers of its own. Runs anywhere with node >= 20 and curl.
//   node coach/lc.mjs <tool> '<json arguments>'
//   node coach/lc.mjs standard 3.OA.A.3            (shortcut: find_standard_statement by code, math)
//   node coach/lc.mjs before <uuid> | after <uuid>   (shortcut: progression backward | forward)
//   node coach/lc.mjs parts <uuid>                   (shortcut: learning components)
//   node coach/lc.mjs traps <uuid>                   (shortcut: misconceptions, math)
// Prints the tool's JSON result on stdout, or {"error": "..."} and exit 2. The key comes from LC_API_KEY
// and is never printed.
import { spawnSync } from 'node:child_process';
const KEY = process.env.LC_API_KEY;
if (!KEY) { console.error('LC_API_KEY is not set'); process.exit(3); }
const [, , cmd, ...rest] = process.argv;
const SHORT = {
  standard: c => ['find_standard_statement', { code: c, academicSubject: 'Mathematics' }],
  find: w => ['find_standard_statement', { keywords: String(w).split(/\s+/), academicSubject: 'Mathematics' }],
  before: u => ['find_standards_progression_from_standard', { caseIdentifierUUID: u, direction: 'backward' }],
  after: u => ['find_standards_progression_from_standard', { caseIdentifierUUID: u, direction: 'forward' }],
  parts: u => ['find_learning_components_from_standard', { caseIdentifierUUID: u }],
  traps: u => ['find_misconceptions_for_standard', { caseIdentifierUUID: u, subject: 'Mathematics' }]
};
let name, args;
if (SHORT[cmd]) [name, args] = SHORT[cmd](rest[0]);
else { name = cmd; try { args = JSON.parse(rest[0] || '{}'); } catch { console.error('arguments must be JSON'); process.exit(2); } }
if (!name) { console.error('usage: lc.mjs <tool|standard|find|before|after|parts|traps> ...'); process.exit(2); }
const body = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name, arguments: args } });
const r = spawnSync('curl', ['-sS', '--max-time', '40', '-X', 'POST', 'https://kg.mcp.learningcommons.org/mcp', '-H', 'x-api-key: ' + KEY, '-H', 'content-type: application/json', '-H', 'accept: application/json, text/event-stream', '-d', body], { encoding: 'utf8' });
if (r.status !== 0) { console.log(JSON.stringify({ error: 'curl failed: ' + (r.stderr || '').trim().slice(0, 200) })); process.exit(2); }
const line = r.stdout.split('\n').find(l => l.startsWith('data: ')) || r.stdout;
let m; try { m = JSON.parse(line.replace(/^data: /, '')); } catch { console.log(JSON.stringify({ error: 'bad reply: ' + r.stdout.slice(0, 200) })); process.exit(2); }
if (m.error) { console.log(JSON.stringify({ error: m.error })); process.exit(2); }
const res = m.result || {};
if (res.isError) { console.log(JSON.stringify({ error: (res.content || []).map(c => c.text).join(' ') })); process.exit(2); }
const out = res.structuredContent ?? (() => { try { return JSON.parse(res.content[0].text); } catch { return { text: res.content.map(c => c.text).join('\n') }; } })();
delete out.session_id;
console.log(JSON.stringify(out));
