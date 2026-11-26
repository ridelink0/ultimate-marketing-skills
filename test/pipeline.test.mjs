import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { init } from '../scripts/queue.mjs';
import { addDeal, moveDeal, due, summary, noteDeal } from '../scripts/pipeline.mjs';
import { decide } from '../scripts/policy.mjs';

test('pipeline: add, move, due follow-ups, forgotten deals, summary', () => {
  const ws = init(mkdtempSync(join(tmpdir(), 'ums-p-')), {});
  const a = addDeal(ws, { name: 'Ana', company: 'Studio A', value: 1200, next: 'send demo link', due: '2026-12-01' });
  const b = addDeal(ws, { name: 'Ben', value: 300 });
  assert.throws(() => addDeal(ws, { name: '  ' }), /name/);
  assert.throws(() => addDeal(ws, { name: 'C', due: 'soonish', next: 'x' }), /date/);
  assert.throws(() => moveDeal(ws, a.id, 'maybe'), /stage/);
  assert.throws(() => moveDeal(ws, 'd-000000', 'won'), /no deal/);
  let r = due(ws, '2026-11-30');
  assert.equal(r.dated.length, 0);
  assert.deepEqual(r.stuck.map((d) => d.id), [b.id]);
  r = due(ws, '2026-12-01');
  assert.deepEqual(r.dated.map((d) => d.id), [a.id]);
  moveDeal(ws, a.id, 'won', { note: 'signed annual' });
  noteDeal(ws, b.id, 'asked about pricing');
  r = due(ws, '2027-01-01');
  assert.equal(r.dated.length, 0, 'won deals drop out');
  const s = Object.fromEntries(summary(ws).map((x) => [x.stage, x]));
  assert.equal(s.won.value, 1200);
  assert.equal(s.lead.count, 1);
});

test('sales sends are never autonomous: outreach and DMs need their own approval in every mode', () => {
  for (const mode of ['supervised', 'autopilot']) {
    for (const action of ['outreach_email', 'dm']) {
      const batch = { platform: 'x', approvals: [{ scope: 'batch' }], checks: { blocking: 0 } };
      assert.equal(decide({ mode, action, item: batch }).allowed, false, `${mode} ${action}`);
    }
  }
  assert.equal(decide({ mode: 'autopilot', action: 'mass_dm', item: { approvals: [{ scope: 'item' }] } }).needs, 'never');
});
