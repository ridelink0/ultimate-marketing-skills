import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { decide, FORBIDDEN, ACTIONS, routeFor } from '../scripts/policy.mjs';
import { init, workspace, addItem, approve, listItems, runDue, setMode, getItem } from '../scripts/queue.mjs';

const ok = { checks: { blocking: 0 } };
const item = (extra = {}) => ({ platform: 'x', approvals: [], ...ok, ...extra });

test('advise and draft never publish, even with an item approval', () => {
  for (const mode of ['advise', 'draft']) {
    const v = decide({ mode, action: 'publish_post', item: item({ approvals: [{ scope: 'item' }] }) });
    assert.equal(v.allowed, false);
  }
});

test('supervised needs an item approval; a batch approval is not enough', () => {
  assert.equal(decide({ mode: 'supervised', action: 'publish_post', item: item() }).allowed, false);
  assert.equal(decide({ mode: 'supervised', action: 'publish_post', item: item({ approvals: [{ scope: 'batch' }] }) }).allowed, false);
  assert.equal(decide({ mode: 'supervised', action: 'publish_post', item: item({ approvals: [{ scope: 'item' }] }) }).allowed, true);
});

test('autopilot batch covers organic posts only', () => {
  const batch = item({ approvals: [{ scope: 'batch' }] });
  assert.equal(decide({ mode: 'autopilot', action: 'publish_post', item: batch }).allowed, true);
  for (const action of ['reply', 'dm', 'paid_spend', 'account_change', 'delete', 'outreach_email']) {
    assert.equal(ACTIONS[action].batchable, false, action);
    assert.equal(decide({ mode: 'autopilot', action, item: { ...batch, amount: 10 } }).allowed, false, action);
  }
});

test('forbidden actions and flags are refused in every mode with any approval', () => {
  for (const mode of ['advise', 'draft', 'supervised', 'autopilot']) {
    for (const f of Object.keys(FORBIDDEN)) {
      assert.equal(decide({ mode, action: f, item: item({ approvals: [{ scope: 'item' }] }) }).needs, 'never');
      assert.equal(decide({ mode, action: 'publish_post', item: item({ flags: [f], approvals: [{ scope: 'item' }] }) }).needs, 'never');
    }
  }
});

test('assisted platforms need a person at publish, and media on X moves it to assisted', () => {
  const v = decide({ mode: 'autopilot', action: 'publish_post', item: item({ platform: 'tiktok', approvals: [{ scope: 'item' }] }) });
  assert.equal(v.needs, 'person-at-publish');
  assert.equal(routeFor('x', { media: ['a.mp4'] }), 'assisted');
  assert.equal(routeFor('bluesky', { media: ['a.png'] }), 'api');
  assert.equal(routeFor('bluesky', { media: ['a.mp4'] }), 'assisted');
  assert.equal(routeFor('unknown-network'), 'assisted');
});

test('daily cap holds batch posts but not individually approved ones', () => {
  const config = { caps: { perPlatformPerDay: 2 } };
  assert.equal(decide({ mode: 'autopilot', action: 'publish_post', item: item({ approvals: [{ scope: 'batch' }] }), config, postedToday: 2 }).allowed, false);
  assert.equal(decide({ mode: 'autopilot', action: 'publish_post', item: item({ approvals: [{ scope: 'item' }] }), config, postedToday: 2 }).allowed, true);
});

test('missing disclosure, failed checks and spend without amount block', () => {
  assert.equal(decide({ mode: 'supervised', action: 'publish_post', item: item({ disclosureRequired: true, approvals: [{ scope: 'item' }] }) }).allowed, false);
  assert.equal(decide({ mode: 'supervised', action: 'publish_post', item: item({ checks: { blocking: 1 }, approvals: [{ scope: 'item' }] }) }).allowed, false);
  assert.equal(decide({ mode: 'supervised', action: 'paid_spend', item: item({ approvals: [{ scope: 'item' }] }) }).allowed, false);
  assert.equal(decide({ mode: 'bogus', action: 'publish_post', item: item() }).needs, 'never');
});

test('queue: non-interactive approval needs the person\'s words; batch needs autopilot', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'ums-q-'));
  const ws = init(dir, { mode: 'supervised' });
  const a = addItem(ws, { platform: 'bluesky', text: 'Wishlists passed 1,000 today.', batch: 'w1' });
  assert.throws(() => approve(ws, { id: a.id, tty: false }), /from-chat/);
  assert.throws(() => approve(ws, { batch: 'w1', tty: false, quote: 'yes all' }), /autopilot/);
  assert.equal(approve(ws, { id: a.id, tty: false, quote: 'yes, post that one' }).length, 1);
  assert.equal(getItem(ws, a.id).approvals[0].quote, 'yes, post that one');

  setMode(ws, 'autopilot', { by: 'test' });
  const b = addItem(ws, { platform: 'x', text: 'Day 12 of the devlog: the boss now has three phases.', batch: 'w2', at: '2026-01-01T00:00:00Z' });
  const bad = addItem(ws, { platform: 'x', text: 'In today\'s fast-paced world, look no further.', batch: 'w2' });
  const reply = addItem(ws, { platform: 'x', text: 'Thanks, fixed in the next build.', batch: 'w2', action: 'reply' });
  const done = approve(ws, { batch: 'w2', tty: false, quote: 'approve week 2' });
  assert.deepEqual(done.map((d) => d.id), [b.id]);
  assert.equal(getItem(ws, bad.id).status, 'pending');
  assert.equal(getItem(ws, reply.id).status, 'pending');

  const published = [];
  const report = await runDue(ws, { now: new Date('2026-02-01T00:00:00Z'), publish: async (it) => { published.push(it.id); return { url: `https://example.test/${it.id}` }; } });
  assert.ok(report.find((r) => r.id === b.id && r.outcome === 'posted'));
  assert.ok(published.includes(b.id));
  assert.equal(listItems(ws, { status: 'posted' }).length, 2);
});

test('queue refuses forbidden actions and bad input at the door', () => {
  const ws = init(mkdtempSync(join(tmpdir(), 'ums-q-')), {});
  assert.throws(() => addItem(ws, { platform: 'x', text: 'x', action: 'fake_review' }), /refused/);
  assert.throws(() => addItem(ws, { platform: 'x', text: 'x', flags: ['sockpuppet'] }), /refused/);
  assert.throws(() => addItem(ws, { text: 'x' }), /platform/);
  assert.throws(() => addItem(ws, { platform: 'x', text: 'x', at: 'tomorrowish' }), /date/);
  assert.throws(() => workspace('.').queue && getItem(ws, '../../etc/passwd'), /not a queue id/);
});

test('a failed publish is recorded as failed, not posted', async () => {
  const ws = init(mkdtempSync(join(tmpdir(), 'ums-q-')), { mode: 'supervised' });
  const a = addItem(ws, { platform: 'x', text: 'A plain post.' });
  approve(ws, { id: a.id, tty: true });
  const r = await runDue(ws, { publish: async () => { throw new Error('HTTP 401: Unauthorized'); } });
  assert.equal(r[0].outcome, 'failed');
  assert.equal(getItem(ws, a.id).status, 'failed');
});
