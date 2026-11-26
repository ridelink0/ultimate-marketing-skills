// The approval queue and workspace. Everything UMS wants to publish, send or
// spend becomes a JSON file under .ums/queue/ first. A person approves items
// (supervised) or a batch (autopilot); `ums run` publishes only what policy
// allows. Every state change is appended to .ums/log.jsonl.

import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, appendFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { MODES, ACTIONS, FORBIDDEN, decide, routeFor, DEFAULT_CAPS } from './policy.mjs';
import { runChecks } from './checks.mjs';

export const STATUSES = ['pending', 'approved', 'rejected', 'posted', 'failed'];

export function workspace(dir = process.cwd()) {
  const root = resolve(dir, '.ums');
  return {
    root,
    config: join(root, 'config.json'),
    queue: join(root, 'queue'),
    log: join(root, 'log.jsonl'),
  };
}

export function init(dir, { mode = 'supervised', name = '', type = '' } = {}) {
  if (!MODES.includes(mode)) throw new Error(`mode must be one of ${MODES.join(', ')}`);
  const ws = workspace(dir);
  mkdirSync(ws.queue, { recursive: true });
  for (const sub of ['assets', 'video', 'research', 'reports']) mkdirSync(join(ws.root, sub), { recursive: true });
  if (!existsSync(ws.config)) {
    const config = {
      project: name,
      type,
      mode,
      caps: { ...DEFAULT_CAPS },
      mcp: 'auto',
      platforms: [],
      created: new Date().toISOString(),
    };
    writeFileSync(ws.config, JSON.stringify(config, null, 2) + '\n');
    log(ws, { event: 'init', mode });
  }
  const brief = join(ws.root, 'brief.md');
  if (!existsSync(brief)) writeFileSync(brief, BRIEF_TEMPLATE.replace('{{name}}', name || 'Project').replace('{{type}}', type || 'unknown'));
  const voice = join(ws.root, 'voice.md');
  if (!existsSync(voice)) writeFileSync(voice, VOICE_TEMPLATE);
  return ws;
}

export function readConfig(ws) {
  if (!existsSync(ws.config)) throw new Error(`no UMS workspace at ${ws.root}; run "ums init" first`);
  return JSON.parse(readFileSync(ws.config, 'utf8'));
}

export function writeConfig(ws, config) {
  writeFileSync(ws.config, JSON.stringify(config, null, 2) + '\n');
}

export function setMode(ws, mode, by) {
  if (!MODES.includes(mode)) throw new Error(`mode must be one of ${MODES.join(', ')}`);
  const config = readConfig(ws);
  const from = config.mode;
  config.mode = mode;
  writeConfig(ws, config);
  log(ws, { event: 'mode', from, to: mode, ...by });
  return config;
}

export function setMcp(ws, value, by = {}) {
  if (!['auto', 'off'].includes(value)) throw new Error('mcp must be auto or off');
  const config = readConfig(ws);
  const from = config.mcp || 'auto';
  config.mcp = value;
  writeConfig(ws, config);
  log(ws, { event: 'mcp', from, to: value, ...by });
  return config;
}

export function log(ws, entry) {
  mkdirSync(ws.root, { recursive: true });
  appendFileSync(ws.log, JSON.stringify({ at: new Date().toISOString(), ...entry }) + '\n');
}

function newId(now = new Date()) {
  const d = now.toISOString().slice(0, 10).replace(/-/g, '');
  return `${d}-${randomBytes(3).toString('hex')}`;
}

function itemPath(ws, id) {
  if (!/^[0-9]{8}-[0-9a-f]{6}$/.test(id)) throw new Error(`not a queue id: ${id}`);
  return join(ws.queue, `${id}.json`);
}

export function getItem(ws, id) {
  const p = itemPath(ws, id);
  if (!existsSync(p)) throw new Error(`no queue item ${id}`);
  return JSON.parse(readFileSync(p, 'utf8'));
}

export function saveItem(ws, item) {
  item.updated = new Date().toISOString();
  writeFileSync(itemPath(ws, item.id), JSON.stringify(item, null, 2) + '\n');
  return item;
}

export function listItems(ws, { status, batch } = {}) {
  if (!existsSync(ws.queue)) return [];
  return readdirSync(ws.queue)
    .filter((f) => /^[0-9]{8}-[0-9a-f]{6}\.json$/.test(f))
    .map((f) => JSON.parse(readFileSync(join(ws.queue, f), 'utf8')))
    .filter((it) => (!status || it.status === status) && (!batch || it.batch === batch))
    .sort((a, b) => String(a.at || a.created).localeCompare(String(b.at || b.created)));
}

export function addItem(ws, fields) {
  const action = fields.action || 'publish_post';
  if (FORBIDDEN[action]) throw new Error(`refused: ${FORBIDDEN[action]}`);
  if (!ACTIONS[action]) throw new Error(`unknown action "${action}"; one of ${Object.keys(ACTIONS).join(', ')}`);
  for (const flag of fields.flags || []) {
    if (FORBIDDEN[flag]) throw new Error(`refused: ${FORBIDDEN[flag]}`);
  }
  if (!fields.platform) throw new Error('an item needs --platform');
  if (fields.at && Number.isNaN(Date.parse(fields.at))) throw new Error(`--at is not a date: ${fields.at}`);
  const item = {
    id: newId(),
    created: new Date().toISOString(),
    status: 'pending',
    action,
    platform: String(fields.platform).toLowerCase(),
    route: routeFor(String(fields.platform).toLowerCase(), { media: fields.media || [] }),
    text: fields.text || '',
    title: fields.title || '',
    media: fields.media || [],
    at: fields.at ? new Date(fields.at).toISOString() : null,
    batch: fields.batch || null,
    amount: fields.amount ? Number(fields.amount) : null,
    disclosureRequired: Boolean(fields.disclosureRequired),
    disclosed: Boolean(fields.disclosed),
    flags: fields.flags || [],
    thread: fields.thread || [],
    approvals: [],
    log: [],
  };
  item.checks = runChecks(item);
  saveItem(ws, item);
  log(ws, { event: 'add', id: item.id, platform: item.platform, action, blocking: item.checks.blocking });
  return item;
}

// A recorded approval must point at a person. From a terminal, the person is
// at the keyboard. From an agent (no TTY), the caller must pass the person's
// own words from chat, and they are kept in the audit log.
export function approve(ws, { id, batch, by = 'user', quote = '', tty = Boolean(process.stdin.isTTY) }) {
  if (!tty && !String(quote).trim()) {
    throw new Error('approval from a non-interactive caller needs --from-chat "<the person\'s own words>"');
  }
  const config = readConfig(ws);
  const targets = id ? [getItem(ws, id)] : listItems(ws, { status: 'pending', batch });
  if (!id && !batch) throw new Error('approve needs an id or --batch <name>');
  if (batch && config.mode !== 'autopilot') {
    throw new Error(`batch approval is an autopilot feature; the workspace is in ${config.mode} mode. Approve items one by one, or run "ums mode autopilot" first`);
  }
  const done = [];
  for (const item of targets) {
    if (item.status !== 'pending') continue;
    if (item.checks && item.checks.blocking > 0) {
      item.log.push({ at: new Date().toISOString(), event: 'approve-refused', reason: 'blocking checks' });
      saveItem(ws, item);
      continue;
    }
    if (batch && !ACTIONS[item.action].batchable) continue;
    const scope = id ? 'item' : 'batch';
    item.approvals.push({ at: new Date().toISOString(), by, scope, quote });
    item.status = 'approved';
    saveItem(ws, item);
    log(ws, { event: 'approve', id: item.id, scope, by, quote });
    done.push(item);
  }
  return done;
}

export function reject(ws, id, reason = '') {
  const item = getItem(ws, id);
  item.status = 'rejected';
  item.log.push({ at: new Date().toISOString(), event: 'reject', reason });
  saveItem(ws, item);
  log(ws, { event: 'reject', id, reason });
  return item;
}

export function markPosted(ws, id, url = '', by = 'user') {
  const item = getItem(ws, id);
  if (item.status !== 'approved') throw new Error(`item ${id} is ${item.status}, not approved`);
  item.status = 'posted';
  item.result = { url, at: new Date().toISOString(), by };
  saveItem(ws, item);
  log(ws, { event: 'posted', id, url, by });
  return item;
}

export function postedToday(ws, platform, now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  return listItems(ws, { status: 'posted' }).filter((it) => it.platform === platform && String(it.result?.at || '').slice(0, 10) === day).length;
}

// One autopilot tick. Publishes due, allowed items through `publish`, which
// the caller supplies (scripts/post.mjs in real use, a stub in tests).
export async function runDue(ws, { now = new Date(), dryRun = false, publish } = {}) {
  const config = readConfig(ws);
  const report = [];
  for (const item of listItems(ws, { status: 'approved' })) {
    if (item.at && Date.parse(item.at) > now.getTime()) {
      report.push({ id: item.id, outcome: 'waiting', until: item.at });
      continue;
    }
    const verdict = decide({ mode: config.mode, action: item.action, item, config, postedToday: postedToday(ws, item.platform, now) });
    if (!verdict.allowed) {
      report.push({ id: item.id, outcome: 'held', needs: verdict.needs, reason: verdict.reason });
      continue;
    }
    if (dryRun || !publish) {
      report.push({ id: item.id, outcome: 'would-publish', platform: item.platform });
      continue;
    }
    try {
      const res = await publish(item);
      item.status = 'posted';
      item.result = { ...res, at: new Date().toISOString(), by: 'ums-run' };
      saveItem(ws, item);
      log(ws, { event: 'posted', id: item.id, url: res.url || '', by: 'ums-run' });
      report.push({ id: item.id, outcome: 'posted', url: res.url || '' });
    } catch (err) {
      item.status = 'failed';
      item.log.push({ at: new Date().toISOString(), event: 'publish-failed', error: String(err.message || err) });
      saveItem(ws, item);
      log(ws, { event: 'failed', id: item.id, error: String(err.message || err) });
      report.push({ id: item.id, outcome: 'failed', error: String(err.message || err) });
    }
  }
  return report;
}

const BRIEF_TEMPLATE = `# {{name}} marketing brief

Type: {{type}}

Fill this in once. Every UMS command reads it.

## What it is, in one sentence a stranger understands

## Who it is for (the person, not a demographic)

## What they use instead today

## Why they would switch (one reason, with proof)

## Proof you can show (numbers, clips, quotes from real users with permission)

## Links (store page, site, demo, press kit)

## Budget per month and hours per week

## Accounts UMS may prepare posts for

## Lines that must never be said (claims you cannot prove, competitors, legal)
`;

const VOICE_TEMPLATE = `# Voice

Paste three to five things the founder or brand actually wrote: posts, launch
notes, a README, an email. UMS builds the voice from these, not from adjectives.

## Samples

## Words we use

## Words we never use
`;
