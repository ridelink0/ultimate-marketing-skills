import { test } from 'node:test';
import assert from 'node:assert/strict';
import { xWeightedLength, graphemes, checkText, runChecks } from '../scripts/checks.mjs';
import { auditText } from '../scripts/tells.mjs';
import { advise } from '../scripts/advise.mjs';
import { adLibraryLinks } from '../scripts/adlib.mjs';
import { loadPlatforms, loadPlaybooks } from '../scripts/lib/data.mjs';

test('X weighting: Latin 1, CJK and emoji 2, URL 23', () => {
  assert.equal(xWeightedLength('hello'), 5);
  assert.equal(xWeightedLength('日本'), 4);
  assert.equal(xWeightedLength('see https://example.com/a/very/long/path?x=1'), 4 + 23);
  assert.equal(xWeightedLength('a'.repeat(280)), 280);
  // Regression (pass 2): bare domains are links on X too.
  assert.equal(xWeightedLength('play at mygame.gg/demo now'), 'play at '.length + 23 + ' now'.length);
  assert.equal(xWeightedLength('(see example.com).'), '(see '.length + 23 + ').'.length);
  assert.equal(xWeightedLength('version 2.0 is out'), 18, 'a version number is not a domain');
});

test('Bluesky counts graphemes', () => {
  assert.equal(graphemes('é'), 1);
  assert.equal(graphemes('abc'), 3);
});

test('platform limits block, hashtags and links warn', () => {
  assert.equal(checkText('x', 'a'.repeat(281))[0].code, 'too-long');
  assert.equal(checkText('x', 'a'.repeat(280)).length, 0);
  assert.ok(checkText('bluesky', 'a'.repeat(301)).some((c) => c.code === 'too-long'));
  assert.ok(checkText('instagram', 'post #a #b #c #d #e #f').some((c) => c.code === 'hashtags' && c.level === 'warning'));
  assert.ok(checkText('threads', 'one #a #b').some((c) => c.code === 'hashtags' && c.level === 'error'));
  assert.ok(checkText('x', 'out now https://example.com').some((c) => c.code === 'link-in-post'));
  assert.equal(checkText('nowhere', 'x')[0].code, 'unknown-platform');
});

test('disclosure is required and detected', () => {
  const missing = runChecks({ platform: 'x', text: 'Loving this app', disclosureRequired: true, action: 'publish_post' });
  assert.ok(missing.list.some((c) => c.code === 'disclosure'));
  const present = runChecks({ platform: 'x', text: 'Loving this app #ad', disclosureRequired: true, action: 'publish_post' });
  assert.equal(present.list.some((c) => c.code === 'disclosure'), false);
});

test('media-only platforms need media; missing files block', () => {
  assert.ok(runChecks({ platform: 'tiktok', text: 'hi', action: 'publish_post' }).list.some((c) => c.code === 'media-required'));
  assert.ok(runChecks({ platform: 'tiktok', text: 'hi', media: ['nope.mp4'], action: 'publish_post' }).list.some((c) => c.code === 'media-missing'));
});

test('copy tells: generated phrases, patterns, emoji; clean copy passes', () => {
  const bad = auditText("In today's fast-paced world, our seamless app is not just a tool, it's a revolution.");
  const ids = bad.findings.map((f) => f.id);
  for (const id of ['fast-paced', 'seamless', 'not-x-but-y']) assert.ok(ids.includes(id), id);
  assert.ok(auditText('Shipped it \u{1F680}').findings.some((f) => f.id === 'emoji'));
  assert.ok(auditText('[insert link]').findings.some((f) => f.id === 'placeholder'));
  const clean = auditText('Scan a receipt and the expense is filed. That used to take me ten minutes a day.');
  assert.equal(clean.findings.length, 0);
  assert.equal(clean.score, 100);
});

test('advisor respects hours and budget and labels evidence', () => {
  const r = advise({ type: 'mobile-app', hours: 3, budget: 0 });
  assert.ok(r.hoursUsed <= 3);
  assert.equal(r.spend, 0);
  assert.ok(r.picked.every((t) => ['measured', 'reported', 'practice'].includes(t.evidence.kind)));
  assert.ok(r.later.some((l) => /\$/.test(l.why)));
  assert.throws(() => advise({ type: 'spaceship' }), /unknown type/);
  assert.throws(() => advise({ type: 'game', stage: 'someday' }), /unknown stage/);
});

test('every playbook type names real tactics and every tactic has evidence', () => {
  const pb = loadPlaybooks();
  for (const [id, t] of Object.entries(pb.types)) for (const tac of t.order) assert.ok(pb.tactics[tac], `${id} -> ${tac}`);
  for (const [id, t] of Object.entries(pb.tactics)) {
    assert.ok(t.evidence && t.evidence.source && ['measured', 'reported', 'practice'].includes(t.evidence.kind), id);
    assert.ok(['advise', 'draft', 'supervised', 'autopilot', 'person'].includes(t.autonomy), id);
  }
});

test('platform data: every limit has a source and a verified flag', () => {
  const p = loadPlatforms();
  for (const [id, s] of Object.entries(p.platforms)) {
    for (const [field, lim] of Object.entries(s.text || {})) {
      assert.ok(lim.source && typeof lim.verified === 'boolean', `${id}.${field}`);
      assert.ok(['x-weighted', 'graphemes', 'characters', 'utf16'].includes(lim.unit), `${id}.${field} unit`);
    }
    if (s.video) {
      assert.match(s.video.recommended, /^\d+x\d+$/, id);
      assert.ok(s.video.source && typeof s.video.verified === 'boolean', `${id}.video`);
      const [w, h] = s.video.recommended.split('x').map(Number);
      assert.ok(w % 2 === 0 && h % 2 === 0, `${id} even size`);
    }
  }
});

test('ad-library links encode the query and clamp the country', () => {
  const links = adLibraryLinks('cozy farm & "games"', { country: 'gb<script>' });
  assert.ok(links.every((l) => l.url.startsWith('https://')));
  assert.ok(links[0].url.includes('country=GB'));
  assert.ok(links[0].url.includes(encodeURIComponent('cozy farm & "games"')));
});
