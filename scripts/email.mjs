// Email: check a draft, build it into email HTML plus a plain-text part, and
// scaffold the standard sequences. No sending: a person sends from their
// email service (or Claude does through a connected email MCP server after
// the person approves that send).
//
// A draft is Markdown with frontmatter:
//
//   ---
//   subject: Your rideout map is ready
//   preheader: Six riders, one map, nobody at the wrong exit.
//   kind: broadcast            broadcast | sequence | transactional
//   address: 1 Example St, Austin TX 78701
//   unsubscribe: {{ unsubscribe_url }}
//   ---
//   Body in Markdown: # headings, paragraphs, **bold**, _italic_, [links](https://...),
//   ![alt text](https://...image.png), "- " lists, and "-> [Button text](https://...)" for a button.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { auditText } from './tells.mjs';
import { loadJson } from './lib/data.mjs';

// Merge tags of the common email services, so they are not mistaken for
// unfilled template slots and so an unsubscribe tag counts as a link.
const MERGE_TAGS = [/\{\{\s*[a-z_.]+\s*\}\}/gi, /\*\|[A-Z_]+\|\*/g, /\{%\s*[a-z_]+[^%]*%\}/gi];
const UNSUB_RE = /unsub|\*\|UNSUB\|\*|opt[- ]?out|manage[_ -]?preferences/i;
const SHORTENERS = /\b(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly|rebrand\.ly)\//i;

export function parseDraft(text) {
  const src = String(text).replace(/^﻿/, '').replace(/\r\n/g, '\n');
  const m = /^---\n([\s\S]*?)\n---\n?/.exec(src);
  const meta = {};
  if (m) {
    for (const line of m[1].split('\n')) {
      const i = line.indexOf(':');
      if (i > 0) meta[line.slice(0, i).trim().toLowerCase()] = line.slice(i + 1).trim();
    }
  }
  return { meta, body: m ? src.slice(m[0].length) : src };
}

function stripMergeTags(s) {
  let out = s;
  for (const re of MERGE_TAGS) out = out.replace(re, '');
  return out;
}

export function checkDraft(text, { htmlBytes = 0 } = {}) {
  const { meta, body } = parseDraft(text);
  const kind = (meta.kind || 'broadcast').toLowerCase();
  const rules = loadJson('email.json').rules;
  const out = [];
  const add = (level, code, message) => out.push({ level, code, message });
  const subject = meta.subject || '';
  if (!subject) add('error', 'no-subject', 'the draft has no subject line');
  else if ([...subject].length > rules.subjectWarnAt) add('warning', 'long-subject', `subject is ${[...subject].length} characters; phones show about the first ${rules.subjectWarnAt}`);
  if (!meta.preheader) add('warning', 'no-preheader', 'no preheader: inboxes will show the first line of the body instead');
  else if ([...meta.preheader].length > rules.preheaderMax) add('warning', 'long-preheader', `preheader is ${[...meta.preheader].length} characters; keep it under ${rules.preheaderMax}`);
  if (kind !== 'transactional') {
    const all = `${body}\n${meta.unsubscribe || ''}`;
    if (!UNSUB_RE.test(all)) add('error', 'no-unsubscribe', 'marketing email needs a working unsubscribe link (CAN-SPAM, PECR, GDPR); add "unsubscribe:" with your service\'s merge tag');
    if (!meta.address && !/\b\d{1,6}\s+\w+.*\b(st|street|ave|avenue|rd|road|blvd|lane|ln|way|suite|po box)\b/i.test(body)) add('error', 'no-address', 'commercial email needs a valid postal address (CAN-SPAM); add "address:"');
  }
  if (/\[\[[^\]]*\]\]/.test(body) || /\[\[[^\]]*\]\]/.test(subject)) add('error', 'scaffold', 'unfilled [[...]] scaffold text is still in the draft');
  const images = [...body.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)];
  for (const im of images) if (!im[1].trim()) add('error', 'image-alt', `image without alt text: ${im[2]}`);
  const links = [...body.matchAll(/(?<!!)\[[^\]]*\]\(([^)\s]+)\)/g)].map((x) => x[1]);
  for (const l of links) {
    if (/^http:\/\//i.test(l)) add('warning', 'insecure-link', `plain http link: ${l}`);
    if (SHORTENERS.test(l)) add('warning', 'shortener', `link shortener (${l}) is a common spam-filter signal; use the full link`);
  }
  if (links.length > rules.linksWarnAt) add('warning', 'many-links', `${links.length} links; one clear action works better`);
  const words = stripMergeTags(body).replace(/[#*_>\-[\]()!]/g, ' ').split(/\s+/).filter(Boolean).length;
  if (images.length && words < images.length * rules.minWordsPerImage) add('warning', 'image-heavy', `mostly images (${images.length} images, ${words} words); image-only email lands in spam and says nothing with images off`);
  if (htmlBytes > rules.clipBytes) add('error', 'clipped', `built HTML is ${htmlBytes} bytes; Gmail clips messages over ${rules.clipBytes} bytes, hiding the end (and the unsubscribe link)`);
  const audit = auditText(stripMergeTags(`${subject}\n${body}`));
  for (const f of audit.findings) out.push({ level: f.level, code: `tell:${f.id}`, message: f.message });
  return { kind, subject, words, links: links.length, images: images.length, findings: out, ok: !out.some((f) => f.level === 'error') };
}

// ---------- Markdown -> email HTML and plain text ----------

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const safeUrl = (u) => (/^(https?:|mailto:)/i.test(u) || /^(\{\{|\*\||\{%)/.test(u) ? u : '#');

function inline(s, color) {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])_([^_]+)_(?=[\s).,!?]|$)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => `<a href="${esc(safeUrl(u.replace(/&amp;/g, '&')))}" style="color:${color};text-decoration:underline">${t}</a>`);
}

export function buildEmail(text, { brand = {} } = {}) {
  const { meta, body } = parseDraft(text);
  const c = { ink: brand.ink || '#1a1a1a', paper: brand.paper || '#ffffff', accent: brand.accent || '#0b57d0', muted: brand.muted || '#5f6368', font: brand.font || 'Helvetica, Arial, sans-serif' };
  const blocks = [];
  const plain = [];
  const lines = body.split('\n');
  let para = [];
  let list = [];
  const flushPara = () => {
    if (!para.length) return;
    const t = para.join(' ');
    blocks.push(`<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${c.ink}">${inline(t, c.accent)}</p>`);
    plain.push(t.replace(/\*\*|(^|\s)_|_(\s|$)/g, '$1$2').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1 ($2)'), '');
    para = [];
  };
  const flushList = () => {
    if (!list.length) return;
    blocks.push(`<ul style="margin:0 0 16px;padding-left:22px;font-size:16px;line-height:1.6;color:${c.ink}">${list.map((li) => `<li style="margin:0 0 6px">${inline(li, c.accent)}</li>`).join('')}</ul>`);
    for (const li of list) plain.push(`- ${li.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1 ($2)')}`);
    plain.push('');
    list = [];
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    let m;
    if (!line.trim()) { flushPara(); flushList(); continue; }
    if ((m = /^(#{1,3})\s+(.*)$/.exec(line))) {
      flushPara(); flushList();
      const size = m[1].length === 1 ? 26 : m[1].length === 2 ? 21 : 18;
      blocks.push(`<h${m[1].length} style="margin:0 0 14px;font-size:${size}px;line-height:1.3;color:${c.ink}">${inline(m[2], c.accent)}</h${m[1].length}>`);
      plain.push(m[2].toUpperCase(), '');
      continue;
    }
    if ((m = /^->\s*\[([^\]]+)\]\(([^)\s]+)\)\s*$/.exec(line))) {
      flushPara(); flushList();
      blocks.push(`<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px"><tr><td style="border-radius:6px;background:${c.accent}"><a href="${esc(safeUrl(m[2]))}" style="display:inline-block;padding:13px 22px;font-size:16px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px">${esc(m[1])}</a></td></tr></table>`);
      plain.push(`${m[1]}: ${m[2]}`, '');
      continue;
    }
    if ((m = /^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/.exec(line))) {
      flushPara(); flushList();
      blocks.push(`<img src="${esc(safeUrl(m[2]))}" alt="${esc(m[1])}" width="560" style="display:block;width:100%;max-width:560px;height:auto;margin:0 0 16px;border:0">`);
      if (m[1]) plain.push(`[${m[1]}]`, '');
      continue;
    }
    if ((m = /^[-*]\s+(.*)$/.exec(line))) { flushPara(); list.push(m[1]); continue; }
    flushList();
    para.push(line.trim());
  }
  flushPara(); flushList();

  const footerBits = [];
  if (meta.address) footerBits.push(esc(meta.address));
  if (meta.unsubscribe) footerBits.push(`<a href="${esc(safeUrl(meta.unsubscribe))}" style="color:${c.muted}">Unsubscribe</a>`);
  const footer = footerBits.length ? `<p style="margin:24px 0 0;font-size:12px;line-height:1.5;color:${c.muted}">${footerBits.join('<br>')}</p>` : '';
  if (meta.address) plain.push('--', meta.address);
  if (meta.unsubscribe) plain.push(`Unsubscribe: ${meta.unsubscribe}`);

  const preheader = meta.preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${esc(meta.preheader)}&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div>` : '';
  const html = `<!doctype html>
<html lang="${esc(meta.lang || 'en')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(meta.subject || '')}</title>
</head>
<body style="margin:0;padding:0;background:${c.paper}">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${c.paper}">
<tr><td align="center" style="padding:24px 16px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;font-family:${c.font}">
<tr><td>
${blocks.join('\n')}
${footer}
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>
`;
  return { html, text: plain.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n', subject: meta.subject || '', bytes: Buffer.byteLength(html, 'utf8') };
}

export function buildFile(file, outDir) {
  const text = readFileSync(file, 'utf8');
  const built = buildEmail(text);
  const dir = resolve(outDir || dirname(file));
  mkdirSync(dir, { recursive: true });
  const base = basename(file).replace(/\.md$/i, '');
  const htmlPath = join(dir, `${base}.html`);
  const textPath = join(dir, `${base}.txt`);
  writeFileSync(htmlPath, built.html);
  writeFileSync(textPath, built.text);
  return { html: htmlPath, text: textPath, bytes: built.bytes, check: checkDraft(text, { htmlBytes: built.bytes }) };
}

// ---------- sequences ----------

export function scaffoldSequence(type, outDir, { name = 'the product' } = {}) {
  const seqs = loadJson('email.json').sequences;
  const seq = seqs[type];
  if (!seq) throw new Error(`unknown sequence "${type}"; one of ${Object.keys(seqs).join(', ')}`);
  const dir = resolve(outDir);
  mkdirSync(dir, { recursive: true });
  const written = [];
  seq.emails.forEach((e, i) => {
    const file = join(dir, `${String(i + 1).padStart(2, '0')}-${e.id}.md`);
    if (existsSync(file)) throw new Error(`${file} exists; not overwriting`);
    const body = [
      '---',
      `subject: [[write: ${e.subject}]]`,
      `preheader: [[write: one line that adds to the subject]]`,
      `kind: ${type === 'transactional' ? 'transactional' : 'sequence'}`,
      'address: [[write: your postal address]]',
      'unsubscribe: [[write: your email service unsubscribe merge tag]]',
      `send: ${e.when}`,
      '---',
      '',
      `[[write: ${e.job.replace(/\{name\}/g, name)}]]`,
      '',
      `[[write: the one button, as a line like  -> [Button text](https://your-link)  for: ${e.cta}]]`,
      '',
    ].join('\n');
    writeFileSync(file, body);
    written.push(file);
  });
  return { type, name: seq.name, why: seq.why, files: written };
}
