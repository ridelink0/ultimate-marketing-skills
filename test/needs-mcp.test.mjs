import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { needs, formatNeeds } from '../scripts/needs.mjs';
import { auditText } from '../scripts/tells.mjs';
import { advise } from '../scripts/advise.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

test('bundled MCP servers: https, short names, each one has a needs entry or a packs entry', () => {
  const mcp = JSON.parse(readFileSync(join(ROOT, '.mcp.json'), 'utf8')).mcpServers;
  const integ = JSON.parse(readFileSync(join(ROOT, 'skills/ultimate-marketing-skills/data/integrations.json'), 'utf8'));
  const needsData = JSON.stringify(JSON.parse(readFileSync(join(ROOT, 'skills/ultimate-marketing-skills/data/needs.json'), 'utf8')));
  for (const [name, s] of Object.entries(mcp)) {
    assert.equal(s.type, 'http', name);
    assert.match(s.url, /^https:\/\//, name);
    assert.match(name, /^[a-z0-9-]{1,40}$/, name);
    assert.ok(needsData.includes(`"${name}"`) || integ.mcp.some((m) => m.id === name), `${name} documented`);
  }
});

test('needs: every job reports ordered steps with a how for anything not ready', () => {
  const all = needs();
  assert.ok(all.length >= 10);
  for (const j of all) {
    assert.ok(j.steps.length > 0, j.job);
    for (const s of j.steps) {
      assert.ok(['ready', 'missing', 'check'].includes(s.state), `${j.job} ${s.id}`);
      assert.ok(s.how && s.why, `${j.job} ${s.id}`);
    }
  }
  assert.throws(() => needs('teleport'), /unknown job/);
  const old = process.env.X_API_KEY;
  delete process.env.X_API_KEY;
  try {
    const x = needs('publish-x')[0];
    assert.equal(x.ready, false);
    assert.match(formatNeeds([x]), /MISSING/);
    assert.doesNotMatch(formatNeeds([x]), /X_API_KEY=\S/);
  } finally {
    if (old !== undefined) process.env.X_API_KEY = old;
  }
});

test('no file in the plugin is named like a memory file Claude Code would auto-load', () => {
  const walk = (d) => readdirSync(d).flatMap((n) => {
    if (['.git', 'node_modules'].includes(n)) return [];
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
  const bad = walk(join(ROOT, 'skills')).concat(walk(join(ROOT, 'directory'))).filter((p) => /^(claude|agents|claude\.local)\.md$/i.test(p.split(/[\\/]/).pop()));
  assert.deepEqual(bad, []);
});

test('sales tells: fake reply subjects, false familiarity, cold filler', () => {
  const ids = auditText('Subject: Re: quick sync\nHope this finds you well. As we discussed, here is the deck.').findings.map((f) => f.id);
  for (const id of ['fake-reply-subject', 'false-familiarity', 'cold-email-filler']) assert.ok(ids.includes(id), id);
  assert.equal(auditText('Subject: Your Steam page capsule\nSaw the trailer for Moss Lane. One question about the capsule.').findings.length, 0);
});

test('saas and devtool ladders include founder-led sales', () => {
  for (const type of ['saas', 'devtool']) {
    const r = advise({ type, hours: 40, budget: 0 });
    assert.ok(r.picked.some((t) => t.id === 'founder-led-sales'), type);
  }
});

test('mcp off: MCP steps become optional manual routes and never block a job; switch is logged', async () => {
  const { mkdtempSync, readFileSync: rf } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { init, setMcp, readConfig } = await import('../scripts/queue.mjs');
  for (const j of needs(undefined, { mcpOff: true })) {
    for (const s of j.steps.filter((x) => x.kind === 'mcp')) {
      assert.equal(s.state, 'off', `${j.job} ${s.id}`);
      assert.equal(s.optional, true);
      assert.match(s.how, /ums mcp on/);
    }
  }
  const ws = init(mkdtempSync(join(tmpdir(), 'ums-m-')), {});
  assert.equal(readConfig(ws).mcp, 'auto');
  setMcp(ws, 'off', { by: 'test' });
  assert.equal(readConfig(ws).mcp, 'off');
  assert.throws(() => setMcp(ws, 'sometimes'), /auto or off/);
  assert.match(rf(ws.log, 'utf8'), /"event":"mcp","from":"auto","to":"off"/);
});

test('bench: detects plugins, skills and programs, and always says what to do', async () => {
  const { mkdtempSync, mkdirSync } = await import('node:fs');
  const { tmpdir } = await import('node:os');
  const { bench } = await import('../scripts/bench.mjs');
  const home = mkdtempSync(join(tmpdir(), 'ums-b-'));
  mkdirSync(join(home, '.claude', 'plugins', 'cache', 'ultimate-frontend-skills', 'ultimate-frontend-skills', '6.12.0', 'skills', 'link-preview'), { recursive: true });
  mkdirSync(join(home, '.claude', 'skills', 'cro'), { recursive: true });
  const r = bench({ home, binCheck: (b) => b === 'ffmpeg' });
  const by = Object.fromEntries(r.tools.map((t) => [t.id, t]));
  assert.equal(by['ultimate-frontend-skills'].installed, true);
  assert.equal(by.marketingskills.installed, true);
  assert.equal(by.ffmpeg.installed, true);
  assert.equal(by['video-watch'].installed, false);
  assert.equal(by.whisper.installed, false);
  for (const t of r.tools) assert.ok(t.do && t.do.length > 20, t.id);
  assert.ok(r.seenByClaude.some((s) => s.id === 'claude-in-chrome'));
});
