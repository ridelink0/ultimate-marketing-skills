// Lists the pinned integrations and prints the commands that install them.
// It never runs an install: a person (or Claude, after the person says yes)
// runs the printed command.

import { loadIntegrations } from './lib/data.mjs';

export function listPacks({ only } = {}) {
  const d = loadIntegrations();
  const pick = (arr) => (only ? arr.filter((x) => x.id === only) : arr);
  const packs = pick(d.packs).map((p) => ({ ...p, install: installFor(p) }));
  const mcp = pick(d.mcp).map((m) => ({ ...m, install: m.url ? `claude mcp add --transport http ${m.id} ${m.url}` : m.repo ? `see ${m.repo} (pinned ${String(m.commit).slice(0, 12)})` : `see ${m.docs}` }));
  const tooling = pick(d.mcpTooling);
  if (only && !packs.length && !mcp.length && !tooling.length) throw new Error(`no integration "${only}"`);
  return { checked: d.checked, packs, mcp, tooling };
}

function installFor(p) {
  const short = p.commit.slice(0, 12);
  if (p.id === 'ultimate-frontend-skills') return 'claude plugin marketplace add ridelink0/ultimate-frontend-skills && claude plugin install ultimate-frontend-skills@ultimate-frontend-skills';
  if (p.id === 'anthropic-marketing') return 'claude plugin marketplace add anthropics/knowledge-work-plugins && claude plugin install marketing@knowledge-work-plugins';
  if (p.kind === 'skills' && p.skills) {
    const dir = `ums-packs/${p.id}`;
    const base = p.path ? `${p.path}/skills` : p.id === 'ecc-social' ? 'skills' : 'skills';
    return [
      `git clone --filter=blob:none ${p.repo} ${dir} && git -C ${dir} checkout ${short}`,
      `then copy only the skills you want from ${dir}/${base}/ into ~/.claude/skills/: ${p.skills.join(', ')}`,
    ].join('\n');
  }
  return `git clone ${p.repo} && git -C ${p.repo.split('/').pop()} checkout ${short}`;
}

export function formatPacks(r) {
  const lines = [`Integrations pinned ${r.checked}. UMS prints installs; it never runs them.`, '', 'Skills and plugins'];
  for (const p of r.packs) {
    lines.push(`  ${p.id} (${p.license}) ${p.domain}`);
    lines.push(`    route: ${p.routes}`);
    for (const l of p.install.split('\n')) lines.push(`    $ ${l}`);
  }
  if (r.mcp.length) lines.push('', 'MCP servers');
  for (const m of r.mcp) lines.push(`  ${m.id.padEnd(17)} ${m.official ? 'official ' : 'community'} ${m.access}: ${m.use}\n    $ ${m.install}`);
  if (r.tooling.length) lines.push('', 'Making MCP servers work better');
  for (const t of r.tooling) lines.push(`  ${t.name}: ${t.what}`);
  return lines.join('\n');
}
