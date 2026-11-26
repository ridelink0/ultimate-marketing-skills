import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDraft, checkDraft, buildEmail, buildFile, scaffoldSequence } from '../scripts/email.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const good = readFileSync(join(ROOT, 'examples/email-welcome/welcome.md'), 'utf8');
const codes = (r) => r.findings.map((f) => f.code);

test('the worked example passes, and its merge tag is not taken for a placeholder', () => {
  const r = checkDraft(good);
  assert.equal(r.ok, true, JSON.stringify(r.findings));
  assert.ok(!codes(r).includes('tell:placeholder'));
});

test('marketing email without unsubscribe or address fails; transactional does not need them', () => {
  const bare = '---\nsubject: Hello there\npreheader: One line\n---\nSome words here for the body of the email.\n';
  const r = checkDraft(bare);
  assert.ok(codes(r).includes('no-unsubscribe'));
  assert.ok(codes(r).includes('no-address'));
  const t = checkDraft(bare.replace('preheader: One line', 'preheader: One line\nkind: transactional'));
  assert.ok(!codes(t).includes('no-unsubscribe') && !codes(t).includes('no-address'));
});

test('missing subject, alt text, scaffold, shorteners, http, clipping and tells are caught', () => {
  const d = '---\npreheader: x\naddress: 1 Main St\nunsubscribe: {{ unsubscribe_url }}\n---\n[[write: body]]\n\n![](https://example.com/a.png)\n\n[a](http://example.com) [b](https://bit.ly/xyz)\n\nHope this finds you well.\n';
  const r = checkDraft(d, { htmlBytes: 200000 });
  for (const c of ['no-subject', 'scaffold', 'image-alt', 'insecure-link', 'shortener', 'clipped', 'tell:cold-email-filler']) assert.ok(codes(r).includes(c), c);
  assert.equal(r.ok, false);
});

test('build: escapes HTML, keeps merge tags, neutralises javascript links, writes a plain-text part', () => {
  const d = '---\nsubject: A <b> test\npreheader: pre\naddress: 1 Main St\nunsubscribe: {{ unsubscribe_url }}\n---\nHi <script>alert(1)</script> **bold** [x](javascript:alert(1))\n\n-> [Go](https://example.com/go)\n';
  const b = buildEmail(d);
  assert.ok(!b.html.includes('<script>'));
  assert.ok(b.html.includes('&lt;script&gt;'));
  assert.ok(b.html.includes('href="#"'), 'javascript: link replaced');
  assert.ok(b.html.includes('{{ unsubscribe_url }}'));
  assert.ok(b.html.includes('<strong>bold</strong>'));
  assert.ok(b.html.includes('max-width:600px'));
  assert.match(b.text, /Go: https:\/\/example\.com\/go/);
  assert.match(b.text, /Unsubscribe: \{\{ unsubscribe_url \}\}/);
  assert.ok(b.bytes < 102000);
});

test('frontmatter tolerates a BOM and CRLF', () => {
  const p = parseDraft('﻿---\r\nsubject: Hi\r\n---\r\nBody\r\n');
  assert.equal(p.meta.subject, 'Hi');
  assert.equal(p.body.trim(), 'Body');
});

test('sequences scaffold one file per email, fail check until filled, and never overwrite', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ums-e-'));
  for (const type of ['welcome', 'onboarding', 'launch', 'game-launch', 'winback']) {
    const r = scaffoldSequence(type, join(dir, type), { name: 'Moss Lane' });
    assert.ok(r.files.length >= 3, type);
    for (const f of r.files) assert.ok(codes(checkDraft(readFileSync(f, 'utf8'))).includes('scaffold'), f);
  }
  assert.throws(() => scaffoldSequence('welcome', join(dir, 'welcome')), /exists/);
  assert.throws(() => scaffoldSequence('spam-blast', dir), /unknown sequence/);
});

test('buildFile writes html and txt next to the draft', () => {
  const dir = mkdtempSync(join(tmpdir(), 'ums-e-'));
  const r = buildFile(join(ROOT, 'examples/email-welcome/welcome.md'), dir);
  assert.ok(existsSync(r.html) && existsSync(r.text));
  assert.equal(r.check.ok, true);
});
