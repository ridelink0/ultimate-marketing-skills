// Email HTML, version 2: themes, a logo header, a hero image, cards,
// image-beside-text sections, dividers and buttons, with a plain-text part.
// Table layout and inline styles for the clients that ignore <style>; a
// <style> block adds dark mode and phone stacking for the clients that read it.
//
// Draft additions on top of version 1 (see references/email.md):
//   frontmatter  theme: clean | editorial | night
//                brand: Name           logo: https://.../logo.png   logoalt: Name
//                hero: https://.../hero.jpg   heroalt: what the picture shows
//                accent / paper / surface / ink / muted: #rrggbb overrides
//   body         ::: card            ...  :::
//                ::: split https://.../shot.png | alt text   ...  :::
//                ---                 a divider
//                -> [Button text](https://...)

import { loadJson } from './lib/data.mjs';
import { parseDraft } from './email-parse.mjs';

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const MERGE = /^(\{\{|\*\||\{%)/;
export const safeUrl = (u) => (/^(https?:|mailto:)/i.test(u) || MERGE.test(u) ? u : '#');
// Images may be relative for a local preview; `ums email check` warns that
// they must be hosted at https before sending.
export const safeImg = (u) => (/^https?:/i.test(u) || (!/^[a-z][a-z0-9+.-]*:/i.test(u) && !u.startsWith('//')) ? u : '');
const HEX = /^#[0-9a-f]{6}$/i;

export function theme(meta) {
  const themes = loadJson('email.json').themes;
  const name = (meta.theme || 'clean').toLowerCase();
  const base = themes[name];
  if (!base) throw new Error(`unknown email theme "${name}"; one of ${Object.keys(themes).join(', ')}`);
  const t = { ...base, name };
  for (const k of ['accent', 'paper', 'surface', 'ink', 'muted', 'buttonText']) {
    const v = meta[k.toLowerCase()];
    if (v && HEX.test(v)) t[k] = v;
  }
  return t;
}

function inline(s, t) {
  return esc(s)
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[\s(])_([^_]+)_(?=[\s).,!?]|$)/g, '$1<em>$2</em>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, txt, u) => `<a href="${esc(safeUrl(u.replace(/&amp;/g, '&')))}" class="t-accent" style="color:${t.accent};text-decoration:underline">${txt}</a>`);
}
const plainInline = (s) => s.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/(^|[\s(])_([^_]+)_/g, '$1$2').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1 ($2)');

// Splits body lines into blocks; ::: containers nest one level.
function renderBlocks(lines, t, plain, width) {
  const out = [];
  let para = [];
  let list = [];
  const p = (txt) => `<p class="t-ink" style="margin:0 0 16px;font-family:${t.font};font-size:16px;line-height:1.6;color:${t.ink}">${inline(txt, t)}</p>`;
  const flushPara = () => { if (!para.length) return; const s = para.join(' '); out.push(p(s)); plain.push(plainInline(s), ''); para = []; };
  const flushList = () => {
    if (!list.length) return;
    out.push(`<ul class="t-ink" style="margin:0 0 16px;padding-left:22px;font-family:${t.font};font-size:16px;line-height:1.6;color:${t.ink}">${list.map((li) => `<li style="margin:0 0 6px">${inline(li, t)}</li>`).join('')}</ul>`);
    for (const li of list) plain.push(`- ${plainInline(li)}`);
    plain.push('');
    list = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();
    let m;
    if (!line.trim()) { flushPara(); flushList(); continue; }
    if ((m = /^:::\s*(card|split)\s*(.*)$/.exec(line))) {
      flushPara(); flushList();
      const inner = [];
      i++;
      while (i < lines.length && lines[i].trim() !== ':::') inner.push(lines[i++]);
      const sub = renderBlocks(inner, t, plain, width - 48);
      if (m[1] === 'card') {
        out.push(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px"><tr><td class="bg-surface p-sm" style="background:${t.surface};border-radius:10px;padding:24px">${sub}</td></tr></table>`);
      } else {
        const [src, alt = ''] = m[2].split('|').map((x) => x.trim());
        const img = safeImg(src || '');
        out.push(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="stack" style="margin:0 0 20px"><tr><td width="40%" valign="top" style="padding:0 16px 0 0">${img ? `<img src="${esc(img)}" alt="${esc(alt)}" width="220" style="display:block;width:100%;max-width:220px;height:auto;border:0;border-radius:8px">` : ''}</td><td valign="top">${sub}</td></tr></table>`);
        if (alt) plain.push(`[${alt}]`, '');
      }
      continue;
    }
    if (/^-{3,}\s*$/.test(line)) {
      flushPara(); flushList();
      out.push(`<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px"><tr><td class="b-muted" style="border-top:1px solid ${t.rule};font-size:0;line-height:0">&nbsp;</td></tr></table>`);
      plain.push('---', '');
      continue;
    }
    if ((m = /^(#{1,3})\s+(.*)$/.exec(line))) {
      flushPara(); flushList();
      const lvl = m[1].length;
      const size = lvl === 1 ? 30 : lvl === 2 ? 22 : 18;
      out.push(`<h${lvl} class="t-ink" style="margin:0 0 14px;font-family:${t.headFont};font-weight:${t.headWeight};font-size:${size}px;line-height:1.25;color:${t.ink}">${inline(m[2], t)}</h${lvl}>`);
      plain.push(m[2].toUpperCase(), '');
      continue;
    }
    if ((m = /^->\s*\[([^\]]+)\]\(([^)\s]+)\)\s*$/.exec(line))) {
      flushPara(); flushList();
      out.push(`<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px"><tr><td class="bg-accent" style="border-radius:${t.radius}px;background:${t.accent}"><a href="${esc(safeUrl(m[2]))}" style="display:inline-block;padding:14px 26px;font-family:${t.font};font-size:16px;font-weight:bold;color:${t.buttonText};text-decoration:none;border-radius:${t.radius}px">${esc(m[1])}</a></td></tr></table>`);
      plain.push(`${m[1]}: ${m[2]}`, '');
      continue;
    }
    if ((m = /^!\[([^\]]*)\]\(([^)\s]+)\)\s*$/.exec(line))) {
      flushPara(); flushList();
      const img = safeImg(m[2]);
      if (img) out.push(`<img src="${esc(img)}" alt="${esc(m[1])}" width="${width}" style="display:block;width:100%;max-width:${width}px;height:auto;margin:0 0 16px;border:0;border-radius:8px">`);
      if (m[1]) plain.push(`[${m[1]}]`, '');
      continue;
    }
    if ((m = /^[-*]\s+(.*)$/.exec(line))) { flushPara(); list.push(m[1]); continue; }
    flushList();
    para.push(line.trim());
  }
  flushPara(); flushList();
  return out.join('\n');
}

export function buildEmail(text) {
  const { meta, body } = parseDraft(text);
  const t = theme(meta);
  const plain = [];
  const brandName = meta.brand || '';
  const logo = meta.logo ? safeImg(meta.logo) : '';
  const header = logo
    ? `<tr><td style="padding:0 0 24px"><img src="${esc(logo)}" alt="${esc(meta.logoalt || brandName)}" height="32" style="display:block;height:32px;width:auto;border:0"></td></tr>`
    : brandName ? `<tr><td class="t-ink" style="padding:0 0 24px;font-family:${t.headFont};font-weight:bold;font-size:18px;letter-spacing:0.02em;color:${t.ink}">${esc(brandName)}</td></tr>` : '';
  if (brandName) plain.push(brandName, '');
  const heroSrc = meta.hero ? safeImg(meta.hero) : '';
  const hero = heroSrc ? `<tr><td style="padding:0 0 28px"><img src="${esc(heroSrc)}" alt="${esc(meta.heroalt || '')}" width="600" style="display:block;width:100%;max-width:600px;height:auto;border:0;border-radius:${t.radius + 4}px"></td></tr>` : '';
  if (heroSrc && meta.heroalt) plain.push(`[${meta.heroalt}]`, '');
  const content = renderBlocks(body.replace(/\r\n/g, '\n').split('\n'), t, plain, 600);

  const foot = [];
  if (meta.address) foot.push(esc(meta.address));
  if (meta.unsubscribe) foot.push(`<a href="${esc(safeUrl(meta.unsubscribe))}" class="t-muted" style="color:${t.muted};text-decoration:underline">Unsubscribe</a>`);
  if (meta.address) plain.push('--', meta.address);
  if (meta.unsubscribe) plain.push(`Unsubscribe: ${meta.unsubscribe}`);
  const footer = foot.length ? `<tr><td class="t-muted" style="padding:28px 0 0;border-top:1px solid ${t.rule};font-family:${t.font};font-size:12px;line-height:1.6;color:${t.muted}">${foot.join('<br>')}</td></tr>` : '';

  const dark = t.dark ? `
  @media (prefers-color-scheme: dark) {
    .bg-paper { background:${t.dark.paper} !important; }
    .bg-surface { background:${t.dark.surface} !important; }
    .t-ink { color:${t.dark.ink} !important; }
    .t-muted { color:${t.dark.muted} !important; }
    .t-accent { color:${t.dark.accent} !important; }
  }
  [data-ogsc] .t-ink { color:${t.dark.ink} !important; }
  [data-ogsb] .bg-paper { background:${t.dark.paper} !important; }` : '';
  const preheader = meta.preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">${esc(meta.preheader)}&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;&#8203;&nbsp;</div>` : '';
  const html = `<!doctype html>
<html lang="${esc(meta.lang || 'en')}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<meta name="color-scheme" content="${t.dark ? 'light dark' : 'light'}">
<meta name="supported-color-schemes" content="${t.dark ? 'light dark' : 'light'}">
<title>${esc(meta.subject || '')}</title>
<style>
  body { margin:0; padding:0; }
  img { -ms-interpolation-mode:bicubic; }
  @media (max-width: 620px) {
    .stack td { display:block !important; width:100% !important; padding:0 0 16px 0 !important; }
    .p-sm { padding:16px !important; }
  }${dark}
</style>
</head>
<body class="bg-paper" style="margin:0;padding:0;background:${t.paper}">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg-paper" style="background:${t.paper}">
<tr><td align="center" style="padding:32px 16px">
<!--[if mso]><table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"><tr><td><![endif]-->
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px">
${header}
${hero}
<tr><td>
${content}
</td></tr>
${footer}
</table>
<!--[if mso]></td></tr></table><![endif]-->
</td></tr>
</table>
</body>
</html>
`;
  return { html, text: plain.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n', subject: meta.subject || '', bytes: Buffer.byteLength(html, 'utf8'), theme: t.name };
}
