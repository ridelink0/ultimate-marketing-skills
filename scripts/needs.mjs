// `ums needs <job>`: what a job needs, in setup order, with what is already
// here marked done. Checks local tools, environment variables (presence only)
// and plugins. MCP sign-in cannot be seen from a script; Claude sees it in its
// own tool list, so those steps are printed for Claude to check.

import { spawnSync } from 'node:child_process';
import { loadJson } from './lib/data.mjs';
import { doctor } from './doctor.mjs';

function onPath(bin) {
  const r = spawnSync(bin, ['-version'], { encoding: 'utf8', windowsHide: true, shell: process.platform === 'win32' });
  if (r.status === 0) return true;
  const r2 = spawnSync(bin, ['--version'], { encoding: 'utf8', windowsHide: true, shell: process.platform === 'win32' });
  return r2.status === 0;
}

export function needs(job, { mcpOff = false } = {}) {
  const data = loadJson('needs.json');
  const jobs = job ? [job] : Object.keys(data.jobs);
  const plugins = doctor().plugins;
  return jobs.map((id) => {
    const j = data.jobs[id];
    if (!j) throw new Error(`unknown job "${id}"; one of ${Object.keys(data.jobs).join(', ')}`);
    const steps = j.steps.map((s) => {
      let state = 'check';
      if (s.kind === 'mcp' && mcpOff) return { ...s, optional: true, state: 'off', how: `MCP is off for this workspace: ${s.manual || 'export the data by hand into .ums/research or .ums/reports'}. Claude may recommend turning it on (ums mcp on) if it would clearly change the result.` };
      if (s.kind === 'bin' || s.kind === 'optional-bin') state = onPath(s.id) ? 'ready' : 'missing';
      else if (s.kind === 'env') state = [].concat(s.id).every((k) => Boolean(process.env[k])) ? 'ready' : 'missing';
      else if (s.kind === 'plugin' && s.id in plugins) state = plugins[s.id] ? 'ready' : 'missing';
      const optional = s.optional || s.kind === 'optional-bin';
      return { ...s, optional, state };
    });
    const blocking = steps.filter((s) => !s.optional && s.state === 'missing');
    return { job: id, name: j.name, ready: blocking.length === 0, steps };
  });
}

export function formatNeeds(list) {
  const out = [];
  for (const j of list) {
    out.push(`${j.name} (${j.job}): ${j.ready ? 'ready, or only sign-in checks left' : 'not ready'}`);
    j.steps.forEach((s, i) => {
      const label = s.state === 'off' ? 'off    ' : s.state === 'ready' ? 'done   ' : s.state === 'missing' ? 'MISSING' : 'check  ';
      const ids = [].concat(s.id).join(', ');
      out.push(`  ${i + 1}. ${label} ${s.kind === 'mcp' ? `MCP server ${ids}` : ids}${s.optional ? ' (optional)' : ''}: ${s.why}`);
      if (s.state !== 'ready') out.push(`     how: ${s.how}`);
    });
  }
  out.push('', 'MCP servers ship with UMS. A server that shows as needing authentication is signed in with /mcp; nothing is sent to it until then. "ums mcp off" keeps Claude off them entirely.', 'Making MCP cheaper and safer: ums packs (Claude Code tool search, MCP Inspector, Docker MCP Gateway, Cisco MCP Scanner, code execution with MCP).');
  return out.join('\n');
}
