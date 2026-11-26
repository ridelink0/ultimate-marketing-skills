// Copy audit: finds the phrases and habits that make marketing copy read as
// machine-written, so a person scrolling past does not stop. The list lives in
// data/copy-tells.json; each entry has a reason and a fix.
//
//   node scripts/ums.mjs tells post.md
//   node scripts/ums.mjs tells --text "Unlock your potential with our seamless app"

import { loadTells } from './lib/data.mjs';

// Pictographic emoji and the variation selector. Plain symbols such as the
// copyright sign are left alone.
const EMOJI_RE = /\p{Extended_Pictographic}/u;

export function auditText(text) {
  const t = String(text || '');
  const data = loadTells();
  const findings = [];
  const lower = t.toLowerCase();

  for (const tell of data.phrases) {
    for (const p of tell.match) {
      const re = new RegExp(`(^|[^\\p{L}])${escape(p.toLowerCase())}(?=$|[^\\p{L}])`, 'u');
      if (re.test(lower)) {
        findings.push({ id: tell.id, level: tell.level, message: `"${p}": ${tell.why} ${tell.fix}`.trim() });
        break;
      }
    }
  }
  for (const pat of data.patterns) {
    const re = new RegExp(pat.regex, pat.flags || 'u');
    const hits = t.match(new RegExp(pat.regex, (pat.flags || 'u').includes('g') ? pat.flags : `${pat.flags || 'u'}g`)) || [];
    if (hits.length >= (pat.min || 1) && re.test(t)) {
      findings.push({ id: pat.id, level: pat.level, message: `${pat.why} ${pat.fix}`.trim() });
    }
  }
  if (EMOJI_RE.test(t)) {
    findings.push({ id: 'emoji', level: 'error', message: 'Emoji in copy. House style uses none: say it in words, or use the platform\'s own formatting.' });
  }
  const sentences = t.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  const bangs = (t.match(/!/g) || []).length;
  if (sentences.length >= 2 && bangs / sentences.length > 0.34) {
    findings.push({ id: 'exclamations', level: 'warning', message: 'More than one sentence in three ends with "!". Excitement is shown by the thing, not the punctuation.' });
  }
  const score = Math.max(0, 100 - findings.reduce((s, f) => s + (f.level === 'error' ? 25 : 8), 0));
  return { score, findings };
}

function escape(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function formatAudit(name, result) {
  const lines = [`${name}: ${result.score}/100`];
  for (const f of result.findings) lines.push(`  ${f.level === 'error' ? 'ERROR' : 'warn '} ${f.id}: ${f.message}`);
  if (!result.findings.length) lines.push('  no tells found');
  return lines.join('\n');
}
