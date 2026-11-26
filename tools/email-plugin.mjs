#!/usr/bin/env node
// Builds plugins/ultimate-email-skills: email marketing as its own plugin,
// for people who want only email. Generated from the UMS sources so the two
// never drift; edit the sources, never the generated folder.
//
//   node tools/email-plugin.mjs          build
//   node tools/email-plugin.mjs --check  fail if the built copy is stale

import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'plugins', 'ultimate-email-skills');
const NAME = 'ultimate-email-skills';
const read = (p) => readFileSync(join(ROOT, p), 'utf8');
const ums = JSON.parse(read('.claude-plugin/plugin.json'));
const CLI = 'node "${CLAUDE_PLUGIN_ROOT}/scripts/email-cli.mjs"';

const retarget = (text) => text
  .replace(/node "\$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/ums\.mjs" email /g, `${CLI} `)
  .replace(/node "\$\{CLAUDE_PLUGIN_ROOT\}\/scripts\/ums\.mjs" needs email/g, `${CLI} needs`)
  .replace(/`ums email (check|build|sequence)/g, '`email-cli $1')
  .replace(/`ums queue add --platform newsletter --file <draft\.md>`/g, 'the approval step (the person reads it and says send)')
  .replace(/Details in `sales\.md`\./g, 'Ultimate Marketing Skills has the full outreach rules.')
  .replace(/; sources in `research\.md` and the research notes\./g, '.')
  .replace(' Email is the owned channel no feed can take\naway (`../ultimate-marketing-skills/references/new-era.md`).', ' Email is the owned channel no feed can take\naway.')
  .replace(/`\.\.\/ultimate-marketing-skills\/references\/email\.md`/g, '`references/email.md`')
  .replace(/the founder's voice from `\.ums\/voice\.md`/g, "the founder's voice (ask for two or three things they wrote)")
  .replace(/from `\.ums\/voice\.md`/g, 'from things the founder wrote');

export function render() {
  const files = new Map();
  const description = 'Ultimate Email Skills: email marketing for Claude Code and Codex. Writes welcome, onboarding, launch, game-launch and win-back sequences in the founder\'s voice; checks every draft against CAN-SPAM, PECR and CASL and the Gmail and Yahoo sender rules; builds styled email HTML (three themes, logo, hero image, cards, image-beside-text sections, dark mode) with a plain-text part; and ships Klaviyo, Resend and MailerLite MCP servers for sending after a person approves. Part of Ultimate Marketing Skills, also installable on its own.';
  const base = { name: NAME, version: ums.version, description, author: ums.author, homepage: `${ums.homepage}/tree/master/plugins/${NAME}`, repository: ums.repository, license: 'MIT', keywords: ['email marketing', 'newsletter', 'email sequence', 'welcome email', 'onboarding email', 'launch email', 'deliverability', 'dmarc', 'can-spam', 'email html', 'dark mode email', 'klaviyo', 'resend', 'mailerlite'] };
  files.set('.claude-plugin/plugin.json', JSON.stringify({ $schema: ums.$schema, ...base, privacyPolicyUrl: `${ums.homepage}/blob/master/plugins/${NAME}/PRIVACY.md` }, null, 2) + '\n');
  files.set('.codex-plugin/plugin.json', JSON.stringify({ ...base, skills: './skills/', hooks: './hooks/codex-hooks.json' }, null, 2) + '\n');
  files.set('hooks/codex-root.mjs', read('hooks/codex-root.mjs'));
  files.set('hooks/codex-hooks.json', JSON.stringify({ description: 'ultimate-email-skills for Codex: says where the plugin is installed, because Codex leaves CLAUDE_PLUGIN_ROOT empty. Codex runs it only after you trust it in /hooks.', hooks: { SessionStart: [{ hooks: [{ type: 'command', command: 'node "${PLUGIN_ROOT}/hooks/codex-root.mjs"', timeout: 5 }] }] } }, null, 2) + '\n');
  const mcp = JSON.parse(read('.mcp.json')).mcpServers;
  files.set('.mcp.json', JSON.stringify({ mcpServers: { klaviyo: mcp.klaviyo, resend: mcp.resend, mailerlite: mcp.mailerlite } }, null, 2) + '\n');
  for (const f of ['email.mjs', 'email-html.mjs', 'email-parse.mjs', 'tells.mjs', 'lib/data.mjs', 'lib/args.mjs']) files.set(`scripts/${f}`, read(`scripts/${f}`));
  files.set('scripts/email-cli.mjs', CLI_SRC);
  const skill = read('skills/email-marketing/SKILL.md').replace('Part of Ultimate Marketing Skills. Read\n`../ultimate-marketing-skills/references/email.md`.', 'Read `references/email.md`. Part of Ultimate Marketing Skills\n(github.com/ridelink0/ultimate-marketing-skills), packaged on its own.');
  files.set('skills/email-marketing/SKILL.md', retarget(skill));
  files.set('skills/email-marketing/references/email.md', retarget(read('skills/ultimate-marketing-skills/references/email.md')));
  for (const d of ['email.json', 'copy-tells.json']) files.set(`skills/email-marketing/data/${d}`, read(`skills/ultimate-marketing-skills/data/${d}`));
  files.set('commands/email.md', retarget(read('commands/email.md').replace('Use the `ultimate-marketing-skills` and `email-marketing` skills', 'Use the `email-marketing` skill')));
  files.set('LICENSE', read('LICENSE'));
  files.set('.claude-plugin/icon.png', readFileSync(join(ROOT, 'tools', 'assets', 'email-icon.png')));
  files.set('PRIVACY.md', `# Privacy\n\nUltimate Email Skills runs on your machine. Gev operates no server,\nanalytics or telemetry for it. Drafts, built HTML and text stay in the folder\nyou choose. When you sign in to Klaviyo, Resend or MailerLite through /mcp and\napprove a send, the email goes to that service under its own terms. Claude\nprocesses the conversation under your Claude plan's terms.\n\nIssues: ${ums.homepage}/issues\n`);
  files.set('README.md', README);
  return files;
}

const CLI_SRC = `#!/usr/bin/env node
// Ultimate Email Skills command line. Node 22+, built-ins only.
//   email-cli sequence <welcome|onboarding|launch|game-launch|winback> --out <dir> [--name n]
//   email-cli check <draft.md>
//   email-cli build <draft.md> [--out dir]
import { readFileSync } from 'node:fs';
import { parseArgs, fail } from './lib/args.mjs';
import { checkDraft, buildFile, scaffoldSequence } from './email.mjs';

const args = parseArgs(process.argv.slice(2));
const [cmd, target] = args._;
const lines = (head, findings) => [head, ...findings.map((f) => '  ' + (f.level === 'error' ? 'ERROR' : 'warn ') + ' ' + f.code + ': ' + f.message)].join('\\n');
try {
  if (cmd === 'check' && target) {
    const r = checkDraft(readFileSync(target, 'utf8'));
    console.log(lines(target + ': ' + (r.ok ? 'OK' : 'FAIL'), r.findings));
    process.exitCode = r.ok ? 0 : 1;
  } else if (cmd === 'build' && target) {
    const r = buildFile(target, args.out);
    console.log(lines('built ' + r.html + ' (' + r.bytes + ' bytes) and ' + r.text + ': ' + (r.check.ok ? 'OK' : 'FAIL'), r.check.findings));
    process.exitCode = r.check.ok ? 0 : 1;
  } else if (cmd === 'sequence' && target && args.out) {
    const r = scaffoldSequence(target, args.out, { name: args.name || 'the product' });
    console.log(r.name + ': ' + r.why + '\\n' + r.files.join('\\n'));
  } else if (cmd === 'needs') {
    console.log('Needs: Node 22+. To send: sign in to Klaviyo, Resend or MailerLite with /mcp (optional; otherwise paste the built HTML into your email service). On the sending domain: SPF, DKIM and DMARC, and an email service that adds one-click unsubscribe headers.');
  } else {
    console.log('email-cli sequence <welcome|onboarding|launch|game-launch|winback> --out <dir> [--name n]\\nemail-cli check <draft.md>\\nemail-cli build <draft.md> [--out dir]\\nemail-cli needs');
  }
} catch (err) {
  fail(err.message || String(err));
}
`;

const README = `# Ultimate Email Skills

Email marketing for Claude, the one channel no feed can take away. Ask Claude
for a welcome sequence, a launch email or a newsletter issue: it writes the
drafts in your voice, checks each one against the email laws and the Gmail
and Yahoo sender rules, and builds styled email HTML with a plain-text part.
Nothing is sent until you approve it.

Part of [Ultimate Marketing Skills](https://github.com/ridelink0/ultimate-marketing-skills),
also installable on its own:

    /plugin install ultimate-email-skills --marketplace ridelink0/ultimate-marketing-skills

## Try it

- "Write a three-email welcome sequence for my receipt-scanning app."
- "Draft the launch email for my game going live on Steam on 2 December, with the hero image in assets/hero.jpg."
- "Check this newsletter draft before I send it."

## What it does

- Sequences: welcome, onboarding and trial, launch, game launch, win-back.
- Checks: subject, preheader, unsubscribe, postal address, alt text, link
  shorteners, unhosted or WebP images, size, and copy that reads as AI-written.
- HTML: three themes (clean, editorial, night), logo, hero image, cards,
  image-beside-text sections that stack on phones, dark-mode colours.
- Sending: Klaviyo, Resend and MailerLite MCP servers ship with it; sign in
  with /mcp. Each send needs your approval.

Needs Node 22 or newer. MIT licensed. No telemetry; see PRIVACY.md.
`;

function walk(d) {
  return readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [relative(OUT, join(d, n)).split('\\').join('/')]));
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const want = render();
  if (process.argv.includes('--check')) {
    const differs = (p, body) => { const cur = readFileSync(p); return typeof body === 'string' ? cur.toString('utf8') !== body : !cur.equals(body); };
    const stale = [...want].filter(([rel, body]) => !existsSync(join(OUT, rel)) || differs(join(OUT, rel), body)).map(([rel]) => rel);
    if (existsSync(OUT)) for (const f of walk(OUT)) if (!want.has(f)) stale.push('extra: ' + f);
    if (stale.length) { process.stderr.write('email plugin is stale:\n  ' + stale.join('\n  ') + '\nrun: node tools/email-plugin.mjs\n'); process.exit(1); }
    process.stdout.write('email plugin is current\n');
  } else {
    rmSync(OUT, { recursive: true, force: true });
    for (const [rel, body] of want) { mkdirSync(dirname(join(OUT, rel)), { recursive: true }); writeFileSync(join(OUT, rel), body); }
    process.stdout.write('built ' + relative(ROOT, OUT) + ' (' + want.size + ' files)\n');
  }
}
