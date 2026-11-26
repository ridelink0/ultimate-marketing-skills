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
import { parseDraft } from './email-parse.mjs';
import { buildEmail, theme } from './email-html.mjs';

export { parseDraft, buildEmail };

// Merge tags of the common email services, so they are not mistaken for
// unfilled template slots and so an unsubscribe tag counts as a link.
const MERGE_TAGS = [/\{\{\s*[a-z_.]+\s*\}\}/gi, /\*\|[A-Z_]+\|\*/g, /\{%\s*[a-z_]+[^%]*%\}/gi];
const UNSUB_RE = /unsub|\*\|UNSUB\|\*|opt[- ]?out|manage[_ -]?preferences/i;
const SHORTENERS = /\b(bit\.ly|tinyurl\.com|t\.co|goo\.gl|ow\.ly|is\.gd|buff\.ly|rebrand\.ly)\//i;

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
  try { theme(meta); } catch (err) { add('error', 'theme', err.message); }
  if (meta.hero && !(meta.heroalt || '').trim()) add('error', 'hero-alt', 'hero image needs "heroalt:" describing it (many inboxes block images by default)');
  const splitImgs = [...body.matchAll(/^:::\s*split\s+(\S+)\s*(?:\|\s*(.*))?$/gm)];
  for (const sm of splitImgs) if (!(sm[2] || '').trim()) add('error', 'image-alt', 'split image without alt text: ' + sm[1]);
  const allImgs = [meta.logo, meta.hero, ...splitImgs.map((x) => x[1])].filter(Boolean);
  const images = [...body.matchAll(/!\[([^\]]*)\]\(([^)\s]+)\)/g)];
  for (const u of [...allImgs, ...images.map((x) => x[2])]) {
    if (!/^https:\/\//i.test(u) && !/^(\{\{|\*\||\{%)/.test(u)) add('warning', 'image-host', 'image is not an https URL (' + u + '); it shows in a local preview only. Host it at https before sending.');
  }
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
