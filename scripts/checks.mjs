// Pre-publish checks for one queue item: length against the platform's own
// limit, hashtag count, AI-sounding copy, missing disclosures, missing media.
// `blocking` counts problems that stop approval; `warnings` are advice.

import { existsSync } from 'node:fs';
import { loadPlatforms } from './lib/data.mjs';
import { auditText } from './tells.mjs';

const URL_RE = /\bhttps?:\/\/[^\s<>"']+/gi;
const HASHTAG_RE = /(^|\s)#[\p{L}\p{N}_]+/gu;
const DISCLOSURE_RE = /(^|\s)(#ad|#sponsored|#paidpartnership|ad:|sponsored|paid partnership|affiliate link|made with ai|ai-generated|ai generated|#aigenerated)(\b|\s|$)/i;

// X counts most Latin text as 1 and everything else (CJK, emoji) as 2, and
// every URL as 23, against a 280 limit (twitter-text v3 configuration).
const X_LIGHT_RANGES = [[0, 4351], [8192, 8205], [8208, 8223], [8242, 8247]];

// X also turns bare domains ("example.com/path") into links, counted as 23.
const BARE_DOMAIN_RE = /(^|[\s(])((?:[a-z0-9-]+\.)+(?:com|net|org|io|app|dev|co|ai|gg|me|xyz|tv|ly|so|sh|to|us|uk|de|fr|ca|games|store|shop|site|online)(?:\/[^\s<>"']*)?)(?=$|[\s),.!?;:])/gi;

export function xWeightedLength(text) {
  let n = 0;
  const withoutUrls = String(text).replace(URL_RE, () => {
    n += 23;
    return '';
  }).replace(BARE_DOMAIN_RE, (m, lead) => {
    n += 23;
    return lead;
  });
  for (const ch of withoutUrls) {
    const cp = ch.codePointAt(0);
    n += X_LIGHT_RANGES.some(([a, b]) => cp >= a && cp <= b) ? 1 : 2;
  }
  return n;
}

export function graphemes(text) {
  const seg = new Intl.Segmenter('en', { granularity: 'grapheme' });
  let n = 0;
  for (const _ of seg.segment(String(text))) n++;
  return n;
}

export function measure(text, unit) {
  if (unit === 'x-weighted') return xWeightedLength(text);
  if (unit === 'graphemes') return graphemes(text);
  if (unit === 'utf16') return String(text).length;
  return [...String(text)].length;
}

export function hashtags(text) {
  return (String(text).match(HASHTAG_RE) || []).map((h) => h.trim());
}

export function checkText(platform, text, { field = 'text' } = {}) {
  const platforms = loadPlatforms();
  const spec = platforms.platforms[platform];
  const out = [];
  if (!spec) {
    out.push({ level: 'warning', code: 'unknown-platform', message: `no spec for "${platform}"; length not checked` });
    return out;
  }
  const limit = spec.text?.[field];
  if (limit && limit.max) {
    const used = measure(text, limit.unit);
    if (used > limit.max) {
      out.push({ level: 'error', code: 'too-long', message: `${platform} ${field}: ${used} > ${limit.max} ${limit.unit || 'characters'}` });
    } else if (limit.foldAt && used > limit.foldAt) {
      out.push({ level: 'warning', code: 'past-fold', message: `${platform} ${field}: ${used} characters; only about the first ${limit.foldAt} show before "more"` });
    }
  }
  const tags = hashtags(text);
  const tagRule = spec.hashtags;
  if (tagRule && tagRule.max !== undefined && tags.length > tagRule.max) {
    out.push({ level: tagRule.hard ? 'error' : 'warning', code: 'hashtags', message: `${tags.length} hashtags; ${platform} ${tagRule.hard ? 'allows' : 'works best with'} at most ${tagRule.max}` });
  }
  const urls = String(text).match(URL_RE) || [];
  if (urls.length && spec.links?.inBody === 'penalised') {
    out.push({ level: 'warning', code: 'link-in-post', message: `${platform}: ${spec.links.note}` });
  }
  if (urls.length && spec.links?.inBody === 'not-clickable') {
    out.push({ level: 'warning', code: 'link-not-clickable', message: `${platform}: links in captions are not clickable; ${spec.links.note}` });
  }
  return out;
}

export function runChecks(item) {
  const list = [];
  const texts = [item.text, ...(item.thread || [])].filter((t) => t !== undefined && t !== null);
  texts.forEach((t, i) => {
    for (const c of checkText(item.platform, t)) list.push({ ...c, part: i });
    const audit = auditText(t);
    for (const f of audit.findings) list.push({ level: f.level, code: `tell:${f.id}`, message: f.message, part: i });
  });
  if (item.title) for (const c of checkText(item.platform, item.title, { field: 'title' })) list.push({ ...c, part: 'title' });

  const allText = texts.join('\n');
  if (item.disclosureRequired) {
    if (DISCLOSURE_RE.test(allText) || item.disclosed) {
      item.disclosed = true;
    } else {
      list.push({ level: 'error', code: 'disclosure', message: 'this item needs a clear disclosure (for example "#ad", "Paid partnership" or "Made with AI") in the text, or the platform label recorded with --disclosed' });
    }
  }
  for (const m of item.media || []) {
    if (!existsSync(m)) list.push({ level: 'error', code: 'media-missing', message: `media file not found: ${m}` });
  }
  const platforms = loadPlatforms();
  const spec = platforms.platforms[item.platform];
  if (spec?.needsMedia && !(item.media || []).length && item.action === 'publish_post') {
    list.push({ level: 'error', code: 'media-required', message: `${item.platform} posts need a video or image` });
  }
  return {
    blocking: list.filter((c) => c.level === 'error').length,
    warnings: list.filter((c) => c.level === 'warning').length,
    list,
  };
}
