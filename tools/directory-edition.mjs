#!/usr/bin/env node
// Builds directory/ultimate-marketing-skills: the edition submitted to
// Anthropic's plugin directory. Markdown and JSON only, no hooks, no scripts,
// and no AI image, video or audio generation guidance (Anthropic Software
// Directory Policy, section 4B). The full edition stays at the repo root.
//
//   node tools/directory-edition.mjs          build
//   node tools/directory-edition.mjs --check  fail if the built copy is stale

import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, statSync, copyFileSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'directory', 'ultimate-marketing-skills');
const SKILL = join(ROOT, 'skills', 'ultimate-marketing-skills');

const root = JSON.parse(readFileSync(join(ROOT, '.claude-plugin', 'plugin.json'), 'utf8'));

export function render() {
  const files = new Map();
  const manifest = {
    $schema: root.$schema,
    name: root.name,
    version: root.version,
    description: 'Ultimate Marketing Skills, directory edition. Social-first marketing for apps, games, websites, SaaS and local businesses: an advisor that picks the tactic ladder for the project type, hours and budget, platform limits with their sources, short-form video storyboards and shot lists, ad-library research, copy that does not read as AI-written, and four autonomy modes with an approval rule for every post. Markdown and JSON only: no hooks, no scripts. The full edition, with the ffmpeg video engine, the queue and API publishing, is on GitHub.',
    author: root.author,
    homepage: `${root.homepage}/tree/master/directory/ultimate-marketing-skills`,
    repository: root.repository,
    license: root.license,
    keywords: root.keywords,
    privacyPolicyUrl: root.privacyPolicyUrl,
    icon: './icon.png',
  };
  files.set('.claude-plugin/plugin.json', JSON.stringify(manifest, null, 2) + '\n');
  files.set('skills/ultimate-marketing-skills/SKILL.md', SKILL_MD);
  for (const name of readdirSync(join(SKILL, 'references'))) {
    let text = readFileSync(join(SKILL, 'references', name), 'utf8');
    text = stripGithubOnly(text);
    files.set(`skills/ultimate-marketing-skills/references/${name}`, text);
  }
  for (const name of readdirSync(join(SKILL, 'data'))) {
    files.set(`skills/ultimate-marketing-skills/data/${name}`, readFileSync(join(SKILL, 'data', name), 'utf8'));
  }
  files.set('commands/advise.md', ADVISE_CMD);
  files.set('commands/plan-week.md', PLAN_CMD);
  files.set('README.md', README);
  files.set('LICENSE', readFileSync(join(ROOT, 'LICENSE'), 'utf8'));
  files.set('PRIVACY.md', PRIVACY);
  return files;
}

// Drops any "## ... (GitHub edition only)" section up to the next "## ".
export function stripGithubOnly(text) {
  return text.replace(/\n## [^\n]*\(GitHub edition only\)[\s\S]*?(?=\n## |$)/g, '\n').replace(/\n{3,}/g, '\n\n');
}

function build() {
  rmSync(OUT, { recursive: true, force: true });
  for (const [rel, body] of render()) {
    const p = join(OUT, rel);
    mkdirSync(dirname(p), { recursive: true });
    writeFileSync(p, body);
  }
  copyFileSync(join(ROOT, '.claude-plugin', 'icon.png'), join(OUT, 'icon.png'));
}

function check() {
  const want = render();
  const stale = [];
  for (const [rel, body] of want) {
    const p = join(OUT, rel);
    if (!existsSync(p) || readFileSync(p, 'utf8') !== body) stale.push(rel);
  }
  const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [relative(OUT, join(d, n)).replace(/\\/g, '/')]));
  if (existsSync(OUT)) for (const f of walk(OUT)) if (!want.has(f) && f !== 'icon.png') stale.push(`extra: ${f}`);
  return stale;
}

const SKILL_MD = `---
name: ultimate-marketing-skills
description: Use whenever someone wants to market, launch, promote or grow an app, game, website, SaaS, developer tool, local business, store or creator account - social posts, short-form video for TikTok, Reels and YouTube Shorts, X and LinkedIn posts, Reddit and Discord launches, Product Hunt and Show HN, store pages, ad and competitor research, a content calendar, or "what should I do to get users". Picks the approach for the project, writes in the founder's voice, plans and storyboards video, and keeps every post behind an approval rule.
---

# Ultimate Marketing Skills (directory edition)

The studio's marketing desk. Social first: native video, honest posts in a
real voice, and a weekly loop that measures what landed.

This edition is markdown and JSON. The full edition on GitHub
(github.com/ridelink0/ultimate-marketing-skills) adds the ffmpeg video engine,
the approval queue and API publishing; where a reference names a \`ums\`
command, do that step by hand from \`data/\` here, and never report a command
as run.

## Rule zero

Nothing is published, sent or paid for without the person's approval of that
item in this conversation. Never on any request: fake or bought reviews,
sockpuppet accounts, bought engagement, mass DMs, undisclosed ads,
impersonation, unlicensed music on business accounts. No emoji anywhere.
Make the files, then say what you made and where in two sentences.

## Start

1. Write \`.ums/brief.md\` from the project (what it is, who for, proof,
   links, hours and budget) and \`.ums/voice.md\` from things the founder wrote.
2. Pick the ladder: read \`data/playbooks.json\`, take the project type's
   \`order\`, keep the tactics that fit the hours and budget, and give each its
   evidence label (measured, reported, practice). Never present reported or
   practice advice as measured.
3. Research the category on the official ad libraries
   (\`references/visual-research.md\`).
4. Plan two weeks in \`.ums/calendar.md\`: one idea per post, platform, format, hook.
5. Write each post and check it against \`data/platforms.json\` (length unit,
   hashtags, links) and \`data/copy-tells.json\`.
6. For video, write the storyboard and shot list (\`references/video.md\`).
7. Show the person the batch. Publish nothing yourself; for assisted
   publishing follow \`references/chrome.md\` and stop before the final button.

## References

| File | When |
|---|---|
| \`references/autonomy.md\` | modes and approvals |
| \`references/platforms.md\` | how each feed distributes |
| \`references/video.md\` | storyboards, hooks, captions, sound |
| \`references/visual-research.md\` | ad libraries and boards |
| \`references/copy.md\` | voice and the copy tells |
| \`references/chrome.md\` | assisted publishing in a browser |
| \`references/compliance.md\` | disclosure, reviews, music, email |
| \`references/search.md\` | search and AI answers |
| \`references/measure.md\` | the weekly loop |
| \`references/claude-surfaces.md\` | which Claude surface does which job |
| \`references/mcp.md\` | marketing MCP servers |
| \`references/research.md\` | sources and refreshing them |
`;

const HEAD = `Use the \`ultimate-marketing-skills\` skill for everything below and follow its rule
zero: nothing is published, sent or paid for without the person's approval of that item.
No emoji. The text typed with this command is the request.
`;

const ADVISE_CMD = `---
description: Recommend the marketing approach for an app, game, website, SaaS or other project
argument-hint: "<what the project is, hours per week, budget>"
---

${HEAD}
Work out the project type and stage, read \`data/playbooks.json\`, and give the ladder of
tactics that fits the hours and budget, in order, each with its steps adapted to this
project and its evidence label and source. Say which steps a person must do (posting on
platforms that ban automation) and which Claude can prepare.
`;

const PLAN_CMD = `---
description: Plan and write a week of social posts and video storyboards for a project
argument-hint: "<project and platforms>"
---

${HEAD}
Write \`.ums/calendar.md\` for seven days and every post in it, in the founder's voice. Check
each against \`data/platforms.json\` and \`data/copy-tells.json\` and fix every error. For each
video, write a storyboard and shot list per \`references/video.md\`. Show the batch for
approval; publish nothing.
`;

const README = `# Ultimate Marketing Skills (directory edition)

Social-first marketing for Claude. Tell Claude what you are building and it
picks the approach that fits your project, your hours and your budget, then
writes the posts in your voice and plans the short videos, with every post
checked against the platform's own limits and nothing published without your
approval.

This edition is markdown and JSON only. The full edition, with the ffmpeg
video engine, the approval queue and API publishing to X and Bluesky, is at
https://github.com/ridelink0/ultimate-marketing-skills. Install it in Claude
Code with:

    /plugin install ultimate-marketing-skills --marketplace ridelink0/ultimate-marketing-skills

## Try it

- "Market my game. It's a cozy farming roguelike, the Steam page is live, I
  have six hours a week and no budget."
- "Plan a week of posts for my receipt-scanning app on TikTok, Instagram and X."
- "What should I do to get the first 100 users for this SaaS?"

## Commands

- \`/ultimate-marketing-skills:advise\` the approach for a project
- \`/ultimate-marketing-skills:plan-week\` a week of posts and storyboards

Privacy: no telemetry and no server; see PRIVACY.md. Licence: MIT.
`;

const PRIVACY = `# Privacy

The directory edition of Ultimate Marketing Skills is instructions and data
only. It runs no code, operates no server, and collects nothing. Files it asks
Claude to write (briefs, calendars, posts) stay in the folder you choose.
Websites you ask Claude to open, and platforms you post to, apply their own
privacy terms. Claude processes the conversation under your Claude plan's
terms.

Issues: https://github.com/ridelink0/ultimate-marketing-skills/issues
`;

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--check')) {
    const stale = check();
    if (stale.length) {
      process.stderr.write(`directory edition is stale:\n  ${stale.join('\n  ')}\nrun: node tools/directory-edition.mjs\n`);
      process.exit(1);
    }
    process.stdout.write('directory edition is current\n');
  } else {
    build();
    process.stdout.write(`built ${relative(ROOT, OUT)}\n`);
  }
}
