import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const walk = (d) => readdirSync(d).flatMap((n) => {
  if (['.git', 'node_modules', '.ums'].includes(n)) return [];
  const p = join(d, n);
  return statSync(p).isDirectory() ? walk(p) : [p];
});
const files = walk(ROOT);
const rel = (p) => relative(ROOT, p).replace(/\\/g, '/');
const frontmatter = (text) => {
  const m = /^---\n([\s\S]*?)\n---\n/.exec(text.replace(/\r\n/g, '\n'));
  if (!m) return null;
  return Object.fromEntries(m[1].split('\n').map((l) => l.split(/:\s(.*)/s)).filter((x) => x.length > 1).map(([k, v]) => [k.trim(), v.trim()]));
};

test('no emoji in any text file', () => {
  const bad = [];
  for (const f of files) {
    if (/\.(png|jpg|mp4|wav)$/i.test(f)) continue;
    const t = readFileSync(f, 'utf8');
    // The copy-tell test strings build their emoji from escapes, so a literal glyph is always a slip.
    if (/\p{Extended_Pictographic}/u.test(t.replace(/[©®™]/g, ''))) bad.push(rel(f));
  }
  assert.deepEqual(bad, []);
});

test('manifests agree on name and version', () => {
  const claude = JSON.parse(readFileSync(join(ROOT, '.claude-plugin/plugin.json'), 'utf8'));
  const codex = JSON.parse(readFileSync(join(ROOT, '.codex-plugin/plugin.json'), 'utf8'));
  const market = JSON.parse(readFileSync(join(ROOT, '.claude-plugin/marketplace.json'), 'utf8'));
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  assert.equal(claude.name, 'ultimate-marketing-skills');
  assert.match(claude.name, /^[a-z0-9-]{1,64}$/);
  for (const v of [codex.version, market.plugins[0].version, pkg.version]) assert.equal(v, claude.version);
  assert.equal(market.plugins[0].name, claude.name);
  assert.equal(pkg.dependencies, undefined);
  assert.equal(pkg.devDependencies, undefined);
  assert.ok(existsSync(join(ROOT, '.claude-plugin/icon.png')));
});

test('commands: frontmatter present, no placeholders Codex rejects, under 4000 bytes, listed in README', () => {
  const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
  for (const name of readdirSync(join(ROOT, 'commands'))) {
    const text = readFileSync(join(ROOT, 'commands', name), 'utf8');
    const fm = frontmatter(text);
    assert.ok(fm && fm.description && 'argument-hint' in fm, `${name} frontmatter`);
    assert.ok(Buffer.byteLength(text) < 4000, `${name} size`);
    assert.doesNotMatch(text, /\$ARGUMENTS|\$[0-9]|\{\{|!`/, name);
    assert.doesNotMatch(text, /(^|\s)@[A-Za-z]/m, name);
    assert.ok(readme.includes(`/ultimate-marketing-skills:${name.replace(/\.md$/, '')}`), `${name} in README`);
  }
});

test('skills: name matches folder, description within the Agent Skills limit', () => {
  for (const dir of readdirSync(join(ROOT, 'skills'))) {
    const fm = frontmatter(readFileSync(join(ROOT, 'skills', dir, 'SKILL.md'), 'utf8'));
    assert.equal(fm.name, dir);
    assert.ok(fm.description.length <= 1024, `${dir} description ${fm.description.length}`);
  }
});

test('every reference named in SKILL.md exists, and every file path in references resolves', () => {
  const skill = readFileSync(join(ROOT, 'skills/ultimate-marketing-skills/SKILL.md'), 'utf8');
  for (const m of skill.matchAll(/`references\/([a-z-]+\.md)`/g)) assert.ok(existsSync(join(ROOT, 'skills/ultimate-marketing-skills/references', m[1])), m[1]);
  for (const m of skill.matchAll(/`(data\/[a-z-]+\.json|scripts\/[a-z]+\.mjs)`/g)) {
    const base = m[1].startsWith('data') ? 'skills/ultimate-marketing-skills' : '';
    assert.ok(existsSync(join(ROOT, base, m[1])), m[1]);
  }
});

test('every script parses (node --check)', () => {
  for (const f of files.filter((p) => p.endsWith('.mjs'))) {
    const r = spawnSync(process.execPath, ['--check', f], { encoding: 'utf8' });
    assert.equal(r.status, 0, `${rel(f)}: ${r.stderr}`);
  }
});

test('hook nudges on marketing prompts only, and never fails', () => {
  const hook = join(ROOT, 'hooks/nudge.mjs');
  const run = (input) => spawnSync(process.execPath, [hook], { input, encoding: 'utf8' });
  assert.match(run(JSON.stringify({ prompt: 'How should I market my indie game on TikTok?' })).stdout, /ultimate-marketing-skills/);
  assert.equal(run(JSON.stringify({ prompt: 'Fix the null pointer in the parser' })).stdout, '');
  assert.equal(run('not json at all').status, 0);
  const hooks = JSON.parse(readFileSync(join(ROOT, 'hooks/hooks.json'), 'utf8'));
  assert.match(hooks.hooks.UserPromptSubmit[0].hooks[0].command, /CLAUDE_PLUGIN_ROOT/);
});

test('no credential-looking strings are committed', () => {
  for (const f of files) {
    if (/\.(png|jpg|mp4|wav)$/i.test(f) || rel(f).startsWith('test/')) continue;
    const t = readFileSync(f, 'utf8');
    assert.doesNotMatch(t, /(sk-[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{30,}|xox[bp]-[A-Za-z0-9-]{20,})/, rel(f));
  }
});

test('directory edition is current, script-free, and carries no AI media generation guidance', () => {
  const r = spawnSync(process.execPath, [join(ROOT, 'tools/directory-edition.mjs'), '--check'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const dirFiles = walk(join(ROOT, 'directory/ultimate-marketing-skills'));
  assert.ok(dirFiles.length < 100);
  for (const f of dirFiles) {
    assert.match(f, /\.(md|json|png)$|LICENSE$/, rel(f));
    assert.ok(statSync(f).size < 256 * 1024, `${rel(f)} under 256 KiB`);
    if (f.endsWith('.md')) assert.doesNotMatch(readFileSync(f, 'utf8'), /GitHub edition only|text-to-speech|\bVeo\b|\bKling\b|ElevenLabs/i, rel(f));
  }
});

test('standalone email plugin is current and self-contained', () => {
  const r = spawnSync(process.execPath, [join(ROOT, 'tools/email-plugin.mjs'), '--check'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
  const P = join(ROOT, 'plugins/ultimate-email-skills');
  for (const f of walk(P).filter((p) => p.endsWith('.md'))) assert.doesNotMatch(readFileSync(f, 'utf8'), /ums\.mjs|\.\.\/ultimate-marketing-skills|ums email /, rel(f));
  const cli = spawnSync(process.execPath, [join(P, 'scripts/email-cli.mjs'), 'check', join(ROOT, 'examples/email-welcome/welcome.md')], { encoding: 'utf8' });
  assert.equal(cli.status, 0, cli.stdout + cli.stderr);
  const market = JSON.parse(readFileSync(join(ROOT, '.claude-plugin/marketplace.json'), 'utf8'));
  assert.ok(market.plugins.some((p) => p.name === 'ultimate-email-skills' && p.source === './plugins/ultimate-email-skills'));
});

test('the doctrine comes before the tools: SKILL.md and every sub-skill point at new-era.md', () => {
  const main = readFileSync(join(ROOT, 'skills/ultimate-marketing-skills/SKILL.md'), 'utf8');
  assert.ok(main.indexOf('references/new-era.md') < main.indexOf('## Where the scripts are'));
  for (const s of ['marketing-video', 'marketing-visual-research', 'social-autopilot', 'launch-playbook', 'sales-playbook', 'email-marketing']) {
    assert.ok(readFileSync(join(ROOT, 'skills', s, 'SKILL.md'), 'utf8').includes('new-era.md'), s);
  }
  const era = readFileSync(join(ROOT, 'skills/ultimate-marketing-skills/references/new-era.md'), 'utf8');
  assert.ok(era.split('**So Claude:**').length - 1 >= 10, 'each principle says what Claude does');
});

test('codex: SessionStart hook names the plugin folder for both plugins, and the manifests point at it', () => {
  for (const [dir, entry] of [['.', 'ums.mjs'], ['plugins/ultimate-email-skills', 'email-cli.mjs']]) {
    const base = join(ROOT, dir);
    const r = spawnSync(process.execPath, [join(base, 'hooks/codex-root.mjs')], { input: '{}', encoding: 'utf8', env: { ...process.env, PLUGIN_ROOT: base } });
    assert.equal(r.status, 0);
    assert.ok(r.stdout.includes(base.split('\\').join('/')), r.stdout);
    assert.ok(r.stdout.includes('scripts/' + entry), r.stdout);
    const cx = JSON.parse(readFileSync(join(base, '.codex-plugin/plugin.json'), 'utf8'));
    assert.equal(cx.hooks, './hooks/codex-hooks.json');
    const h = JSON.parse(readFileSync(join(base, 'hooks/codex-hooks.json'), 'utf8'));
    assert.match(h.hooks.SessionStart[0].hooks[0].command, /codex-root\.mjs/);
  }
});
