// `ums tools`: what else is on this bench and what changes because of it.
// Reports presence only; installs nothing and reads no credentials.

import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { loadJson } from './lib/data.mjs';

function listDirs(dir, depth = 1) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    out.push(e.name);
    if (depth > 1) for (const n of listDirs(join(dir, e.name), depth - 1)) out.push(n);
  }
  return out;
}

export function scan(home = homedir()) {
  const plugins = new Set([...listDirs(join(home, '.claude', 'plugins', 'cache'), 2), ...listDirs(join(home, '.claude', 'plugins', 'marketplaces'), 1)]);
  const skills = new Set([...listDirs(join(home, '.claude', 'skills')), ...listDirs(join(home, '.agents', 'skills'))]);
  for (const p of listDirs(join(home, '.claude', 'plugins', 'cache'), 1)) {
    for (const name of listDirs(join(home, '.claude', 'plugins', 'cache', p), 1)) {
      for (const ver of listDirs(join(home, '.claude', 'plugins', 'cache', p, name), 1)) {
        for (const s of listDirs(join(home, '.claude', 'plugins', 'cache', p, name, ver, 'skills'), 1)) skills.add(s);
      }
    }
  }
  return { plugins, skills };
}

function onPath(bin) {
  const r = spawnSync(bin, ['--version'], { encoding: 'utf8', windowsHide: true, shell: process.platform === 'win32' });
  if (r.status === 0) return true;
  return spawnSync(bin, ['-version'], { encoding: 'utf8', windowsHide: true, shell: process.platform === 'win32' }).status === 0;
}

export function bench({ home, binCheck = onPath } = {}) {
  const data = loadJson('bench.json');
  const { plugins, skills } = scan(home);
  const tools = data.tools.map((t) => {
    const d = t.detect || {};
    const found = (d.plugin || []).some((p) => plugins.has(p)) || (d.skill || []).some((s) => skills.has(s)) || (d.bin || []).some((b) => binCheck(b));
    return { id: t.id, job: t.job, installed: found, do: found ? t.use : t.without };
  });
  return { tools, seenByClaude: data.seenByClaude };
}

export function formatBench(r) {
  const lines = ['UMS bench: what is here and what to do with it', ''];
  for (const t of r.tools) lines.push(`${t.installed ? 'here   ' : 'absent '} ${t.id} (${t.job})`, `        ${t.do}`);
  lines.push('', 'Check your own tool list for these (a script cannot see them):');
  for (const s of r.seenByClaude) lines.push(`  ${s.id}: ${s.look} -> ${s.use}`);
  lines.push('', 'Anything absent that a job needs: ums needs <job> and ums packs --only <id> give the install, in order.');
  return lines.join('\n');
}
