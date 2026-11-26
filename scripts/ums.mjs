#!/usr/bin/env node
// Ultimate Marketing Skills command line. Node 22+, built-ins only.
// Run with no arguments for the list of commands.

import { readFileSync, existsSync } from 'node:fs';
import { parseArgs, num, fail } from './lib/args.mjs';

const HELP = `ums - Ultimate Marketing Skills

Workspace and autonomy
  init [dir] --name <n> --type <t> --mode <m>   create .ums/ (brief, voice, queue, log)
  mode <advise|draft|supervised|autopilot>      change the autonomy mode (logged)
  policy                                        print what each mode may do
  queue add --platform <p> --text <t> | --file <f> [--title t] [--media f]... [--thread t]...
            [--at ISO] [--batch name] [--action a] [--ad] [--ai] [--disclosed]
  queue list [--status s] [--batch b]           queue show <id>
  queue approve <id> | --batch <name> [--from-chat "<the person's words>"]
  queue reject <id> [--reason r]                queue done <id> --url <posted url>
  run [--dry-run] [--now ISO]                   publish due, approved, allowed items

Sales
  pipeline add --name <n> [--company c] [--value v] [--next "<action>" --due YYYY-MM-DD]
  pipeline move <id> <lead|contacted|replied|call|trial|proposal|won|lost> [--next a --due d] [--note t]
  pipeline next [--today YYYY-MM-DD]          due follow-ups, then deals with no next step
  pipeline note <id> --text <t>               pipeline list

Copy
  tells <file> | --text <t>                     AI-sounding copy audit
  check --platform <p> <file> | --text <t>      length, hashtags, links, tells
  specs [platform]                              platform limits and their sources

Video (ffmpeg)
  video build <storyboard.json> --out <mp4> [--keep] [--dry-run]
  video export <in> --platform <p> --out <mp4> [--fit cover|contain] [--trim]
  video check <in> --platform <p>               video sheet <in> --out <png> [--cols 4 --rows 3]
  video frames <in> --at 0,1.5,3 --out <dir>    video safezone <platform> --out <png>

Strategy and research
  advise --type <t> [--stage s] [--hours h] [--budget usd] [--json]
  adlib <query> [--country US]                  official ad-library and trend URLs to open
  doctor                                        what is installed and what it unlocks
  packs [--only id] [--json]                    pinned third-party skills and MCP servers

Add --json to most commands for machine-readable output.`;

const args = parseArgs(process.argv.slice(2), { lists: ['media', 'thread', 'flag'] });
const [cmd, sub, ...rest] = args._;
const asJson = Boolean(args.json);
const print = (obj, text) => process.stdout.write((asJson || text === undefined ? JSON.stringify(obj, null, 2) : text) + '\n');

async function main() {
  if (!cmd || cmd === 'help' || args.help) return print(null, HELP);

  if (cmd === 'init') {
    const { init } = await import('./queue.mjs');
    const ws = init(sub || process.cwd(), { mode: args.mode || 'supervised', name: args.name || '', type: args.type || '' });
    return print({ workspace: ws.root }, `UMS workspace ready at ${ws.root}\nNext: fill in ${ws.root}/brief.md and voice.md, then run "ums advise --type ${args.type || '<type>'}".`);
  }

  if (cmd === 'mode') {
    const { workspace, setMode } = await import('./queue.mjs');
    if (!sub) fail('mode needs one of advise, draft, supervised, autopilot');
    const config = setMode(workspace(args.dir), sub, { by: args.by || 'user', quote: args['from-chat'] || '' });
    return print(config, `mode is now ${config.mode}`);
  }

  if (cmd === 'policy') {
    const { describe, MODES, ACTIONS, FORBIDDEN } = await import('./policy.mjs');
    return print({ MODES, ACTIONS, FORBIDDEN }, describe());
  }

  if (cmd === 'queue') return queueCmd();
  if (cmd === 'pipeline') return pipelineCmd();
  if (cmd === 'run') return runCmd();

  if (cmd === 'tells') {
    const { auditText, formatAudit } = await import('./tells.mjs');
    const text = args.text !== undefined ? String(args.text) : sub ? readFileSync(sub, 'utf8') : fail('tells needs a file or --text');
    const r = auditText(text);
    print(r, formatAudit(sub || 'text', r));
    process.exitCode = r.findings.some((f) => f.level === 'error') ? 1 : 0;
    return;
  }

  if (cmd === 'check') {
    if (!args.platform) fail('check needs --platform');
    const { runChecks } = await import('./checks.mjs');
    const text = args.text !== undefined ? String(args.text) : sub ? readFileSync(sub, 'utf8') : fail('check needs a file or --text');
    const r = runChecks({ platform: String(args.platform).toLowerCase(), text, title: args.title || '', media: args.media, action: 'publish_post', disclosureRequired: Boolean(args.ad || args.ai), thread: args.thread });
    const lines = [`${args.platform}: ${r.blocking} blocking, ${r.warnings} warnings`, ...r.list.map((c) => `  ${c.level === 'error' ? 'ERROR' : 'warn '} ${c.code}${c.part ? ` (part ${c.part})` : ''}: ${c.message}`)];
    print(r, lines.join('\n'));
    process.exitCode = r.blocking ? 1 : 0;
    return;
  }

  if (cmd === 'specs') {
    const { loadPlatforms } = await import('./lib/data.mjs');
    const p = loadPlatforms();
    if (sub) {
      const spec = p.platforms[sub];
      if (!spec) fail(`no platform "${sub}"; one of ${Object.keys(p.platforms).join(', ')}`);
      return print(spec);
    }
    const lines = [`Platform limits, checked ${p.checked} (verified = read on the platform's own page)`];
    for (const [id, s] of Object.entries(p.platforms)) {
      const t = s.text?.text;
      const v = s.video;
      lines.push(`  ${id.padEnd(17)} ${t ? `text ${t.max} ${t.unit}${t.verified ? '' : ' (unverified)'}` : ''}${v ? `  video ${v.recommended} ${v.maxSeconds ? `<= ${v.maxSeconds}s` : 'no length limit'}${v.verified ? '' : ' (unverified)'}` : ''}`);
    }
    lines.push(`  loudness target ${p.loudness.targetLufs} LUFS / ${p.loudness.truePeakDbtp} dBTP (working target, not a platform rule)`);
    return print(p, lines.join('\n'));
  }

  if (cmd === 'video') return videoCmd();

  if (cmd === 'advise') {
    const { advise, formatAdvice } = await import('./advise.mjs');
    if (!args.type) fail('advise needs --type (game, mobile-app, saas, devtool, local-business, ecommerce, creator, website, open-source)');
    const r = advise({ type: args.type, stage: args.stage, hours: num(args.hours, 5), budget: num(args.budget, 0) });
    return print(r, formatAdvice(r));
  }

  if (cmd === 'adlib') {
    const { adLibraryLinks } = await import('./adlib.mjs');
    if (!sub) fail('adlib needs a search term');
    const links = adLibraryLinks([sub, ...rest].join(' '), { country: args.country || 'US' });
    return print(links, links.map((l) => `${l.name.padEnd(28)} ${l.url}\n${' '.repeat(29)}${l.note}`).join('\n'));
  }

  if (cmd === 'doctor') {
    const { doctor, formatDoctor } = await import('./doctor.mjs');
    const r = doctor();
    return print(r, formatDoctor(r));
  }

  if (cmd === 'packs') {
    const { listPacks, formatPacks } = await import('./packs.mjs');
    const r = listPacks({ only: args.only });
    return print(r, formatPacks(r));
  }

  fail(`unknown command "${cmd}". Run "ums help".`);
}

async function queueCmd() {
  const q = await import('./queue.mjs');
  const ws = q.workspace(args.dir);
  if (sub === 'add') {
    let text = args.text !== undefined ? String(args.text) : '';
    if (args.file) text = readFileSync(args.file, 'utf8').trim();
    const item = q.addItem(ws, {
      platform: args.platform,
      text,
      title: args.title,
      media: args.media,
      thread: args.thread,
      at: args.at,
      batch: args.batch,
      action: args.action,
      amount: args.amount,
      disclosureRequired: Boolean(args.ad || args.ai),
      disclosed: Boolean(args.disclosed),
      flags: args.flag,
    });
    const lines = [`queued ${item.id} (${item.platform}, ${item.route} route): ${item.checks.blocking} blocking, ${item.checks.warnings} warnings`];
    for (const c of item.checks.list) lines.push(`  ${c.level === 'error' ? 'ERROR' : 'warn '} ${c.code}: ${c.message}`);
    print(item, lines.join('\n'));
    process.exitCode = item.checks.blocking ? 1 : 0;
    return;
  }
  if (sub === 'list') {
    const items = q.listItems(ws, { status: args.status, batch: args.batch });
    const lines = items.length ? items.map((i) => `${i.id}  ${i.status.padEnd(8)} ${i.platform.padEnd(10)} ${(i.at || 'unscheduled').padEnd(24)} ${String(i.text || i.title).replace(/\s+/g, ' ').slice(0, 60)}`) : ['queue is empty'];
    return print(items, lines.join('\n'));
  }
  if (sub === 'show') return print(q.getItem(ws, rest[0] || fail('show needs an id')));
  if (sub === 'approve') {
    const done = q.approve(ws, { id: rest[0], batch: args.batch, by: args.by || 'user', quote: args['from-chat'] || '' });
    return print(done, done.length ? `approved ${done.map((d) => d.id).join(', ')}` : 'nothing approved (items with blocking checks, or non-batchable actions, stay pending)');
  }
  if (sub === 'reject') return print(q.reject(ws, rest[0] || fail('reject needs an id'), args.reason || ''), `rejected ${rest[0]}`);
  if (sub === 'done') {
    if (!args.url) fail('done needs --url of the published post');
    return print(q.markPosted(ws, rest[0] || fail('done needs an id'), String(args.url)), `marked ${rest[0]} posted`);
  }
  fail('queue needs add, list, show, approve, reject or done');
}

async function pipelineCmd() {
  const { workspace } = await import('./queue.mjs');
  const p = await import('./pipeline.mjs');
  const ws = workspace(args.dir);
  if (sub === 'add') {
    const d = p.addDeal(ws, { name: args.name, company: args.company || '', value: args.value, source: args.source || '', next: args.next || '', due: args.due || '' });
    return print(d, `added ${d.id} ${d.name} (lead)`);
  }
  if (sub === 'move') {
    const d = p.moveDeal(ws, rest[0] || fail('move needs an id'), rest[1] || fail('move needs a stage'), { next: args.next || '', due: args.due || '', note: args.note || '' });
    return print(d, `${d.id} ${d.name} -> ${d.stage}`);
  }
  if (sub === 'note') return print(p.noteDeal(ws, rest[0] || fail('note needs an id'), args.text || fail('note needs --text')), 'noted');
  if (sub === 'next') {
    const r = p.due(ws, args.today);
    const lines = [...r.dated.map((d) => `${d.next.due}  ${d.id} ${d.name} (${d.stage}): ${d.next.action}`), ...r.stuck.map((d) => `no next step  ${d.id} ${d.name} (${d.stage})`)];
    return print(r, lines.length ? lines.join('\n') : 'nothing due');
  }
  if (sub === 'list' || !sub) {
    const s = p.summary(ws);
    return print(s, s.map((x) => `${x.stage.padEnd(9)} ${String(x.count).padStart(3)}  ${x.value}`).join('\n'));
  }
  fail('pipeline needs add, move, note, next or list');
}

async function runCmd() {
  const q = await import('./queue.mjs');
  const { publish } = await import('./post.mjs');
  const ws = q.workspace(args.dir);
  const now = args.now ? new Date(args.now) : new Date();
  if (Number.isNaN(now.getTime())) fail(`--now is not a date: ${args.now}`);
  const report = await q.runDue(ws, { now, dryRun: Boolean(args['dry-run']), publish });
  const lines = report.length ? report.map((r) => `${r.id}  ${r.outcome}${r.needs ? ` (needs ${r.needs}: ${r.reason})` : ''}${r.url ? ` ${r.url}` : ''}${r.error ? ` ${r.error}` : ''}${r.until ? ` until ${r.until}` : ''}`) : ['nothing approved and due'];
  print(report, lines.join('\n'));
  process.exitCode = report.some((r) => r.outcome === 'failed') ? 1 : 0;
}

async function videoCmd() {
  const v = await import('./video.mjs');
  const target = rest[0];
  if (sub === 'build') {
    if (!target || !args.out) fail('video build needs <storyboard.json> --out <file.mp4>');
    const r = v.build(target, args.out, { keep: Boolean(args.keep), dryRun: Boolean(args['dry-run']) });
    if (args['dry-run']) return print(r, r.plan.map((p) => p.join(' ')).join('\n'));
    return print(r, `built ${r.out}: ${r.size}, ${r.duration.toFixed(1)}s, ${r.scenes} scenes, ${r.cues} caption cues. Next: ums video sheet "${r.out}" --out sheet.png, then open the PNG.`);
  }
  if (sub === 'export') {
    if (!target || !args.platform || !args.out) fail('video export needs <in> --platform <p> --out <file>');
    const r = v.exportFor(target, String(args.platform), args.out, { fit: args.fit || 'cover', trim: Boolean(args.trim) });
    return print(r, `exported ${r.out} for ${r.platform} at ${r.size}`);
  }
  if (sub === 'check') {
    if (!target || !args.platform) fail('video check needs <in> --platform <p>');
    if (!existsSync(target)) fail(`not found: ${target}`);
    const r = v.check(target, String(args.platform));
    const i = r.info;
    const lines = [`${target}: ${i.width}x${i.height}, ${i.duration.toFixed(2)}s, ${i.fps} fps, ${i.vcodec}/${i.acodec || 'no audio'}${i.lufs !== undefined ? `, ${i.lufs.toFixed(1)} LUFS` : ''} -> ${r.ok ? 'OK' : 'FAIL'} for ${r.platform}`, ...r.findings.map((f) => `  ${f.level === 'error' ? 'ERROR' : 'warn '} ${f.code}: ${f.message}`)];
    print(r, lines.join('\n'));
    process.exitCode = r.ok ? 0 : 1;
    return;
  }
  if (sub === 'sheet') {
    if (!target || !args.out) fail('video sheet needs <in> --out <png>');
    const r = v.sheet(target, args.out, { cols: num(args.cols, 4), rows: num(args.rows, 3) });
    return print(r, `contact sheet ${r.out}: ${r.tiles} frames, one every ${r.every}`);
  }
  if (sub === 'frames') {
    if (!target || !args.out) fail('video frames needs <in> --at 0,1.5 --out <dir>');
    const at = String(args.at || '0').split(',').map(Number).filter((n) => Number.isFinite(n) && n >= 0);
    const r = v.frames(target, args.out, { at });
    return print(r, r.join('\n'));
  }
  if (sub === 'safezone') {
    if (!target || !args.out) fail('video safezone needs <platform> --out <png>');
    const r = v.safezone(target, args.out);
    return print(r, `${r.out}: red is where ${target} draws its own interface. ${r.note}`);
  }
  fail('video needs build, export, check, sheet, frames or safezone');
}

main().catch((err) => fail(err.message || String(err)));
