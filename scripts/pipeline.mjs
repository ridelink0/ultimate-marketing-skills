// A small local sales pipeline in .ums/pipeline.json: who is in it, what
// stage they are at, and the next action with its date. It sends nothing;
// outreach drafts go through the queue as outreach_email or dm items, which
// always need a person's approval.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { log } from './queue.mjs';

export const STAGES = ['lead', 'contacted', 'replied', 'call', 'trial', 'proposal', 'won', 'lost'];

function file(ws) {
  return join(ws.root, 'pipeline.json');
}

export function load(ws) {
  if (!existsSync(file(ws))) return { deals: [] };
  return JSON.parse(readFileSync(file(ws), 'utf8'));
}

function save(ws, data) {
  mkdirSync(ws.root, { recursive: true });
  writeFileSync(file(ws), JSON.stringify(data, null, 2) + '\n');
}

function find(data, id) {
  const d = data.deals.find((x) => x.id === id);
  if (!d) throw new Error(`no deal ${id}`);
  return d;
}

function checkDate(due) {
  if (due && Number.isNaN(Date.parse(due))) throw new Error(`not a date: ${due}`);
  return due ? new Date(due).toISOString().slice(0, 10) : null;
}

export function addDeal(ws, { name, company = '', value = 0, source = '', next = '', due = '' }) {
  if (!String(name || '').trim()) throw new Error('a deal needs --name');
  const data = load(ws);
  const deal = {
    id: `d-${randomBytes(3).toString('hex')}`,
    name: String(name).trim(),
    company,
    value: Number(value) || 0,
    source,
    stage: 'lead',
    next: next ? { action: next, due: checkDate(due) } : null,
    notes: [],
    history: [{ at: new Date().toISOString(), stage: 'lead' }],
  };
  data.deals.push(deal);
  save(ws, data);
  log(ws, { event: 'deal-add', id: deal.id });
  return deal;
}

export function moveDeal(ws, id, stage, { next = '', due = '', note = '' } = {}) {
  if (!STAGES.includes(stage)) throw new Error(`stage must be one of ${STAGES.join(', ')}`);
  const data = load(ws);
  const d = find(data, id);
  d.stage = stage;
  d.history.push({ at: new Date().toISOString(), stage });
  if (note) d.notes.push({ at: new Date().toISOString(), text: note });
  d.next = stage === 'won' || stage === 'lost' ? null : next ? { action: next, due: checkDate(due) } : d.next;
  save(ws, data);
  log(ws, { event: 'deal-move', id, stage });
  return d;
}

export function noteDeal(ws, id, text) {
  const data = load(ws);
  const d = find(data, id);
  d.notes.push({ at: new Date().toISOString(), text: String(text) });
  save(ws, data);
  return d;
}

// Open deals whose next action is due on or before `today`, oldest first,
// then open deals with no next action at all (the ones that get forgotten).
export function due(ws, today = new Date().toISOString().slice(0, 10)) {
  const open = load(ws).deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost');
  const dated = open.filter((d) => d.next?.due && d.next.due <= today).sort((a, b) => a.next.due.localeCompare(b.next.due));
  const stuck = open.filter((d) => !d.next);
  return { dated, stuck };
}

export function summary(ws) {
  const deals = load(ws).deals;
  const by = Object.fromEntries(STAGES.map((s) => [s, deals.filter((d) => d.stage === s)]));
  return STAGES.map((s) => ({ stage: s, count: by[s].length, value: by[s].reduce((n, d) => n + d.value, 0) }));
}
