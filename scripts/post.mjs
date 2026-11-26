// Publishing through official APIs with the user's own credentials. Only two
// platforms qualify for UMS to publish alone: X (API v2, OAuth 1.0a user
// context, text and threads) and Bluesky (AT Protocol, app password, text,
// links, hashtags, up to four images). Everything else is published by a
// person; see references/autonomy.md.
//
// Credentials come from the environment and are never written to disk, the
// queue or the log:
//   X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_TOKEN_SECRET
//   BSKY_HANDLE, BSKY_APP_PASSWORD
// UMS_X_API_BASE and UMS_BSKY_SERVICE exist so tests can point at a local stub.

import { createHmac, randomBytes } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { extname } from 'node:path';

const enc = (s) => encodeURIComponent(String(s)).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`);

export function oauth1Header({ method, url, consumerKey, consumerSecret, token, tokenSecret, nonce, timestamp }) {
  const params = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce || randomBytes(16).toString('hex'),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: String(timestamp || Math.floor(Date.now() / 1000)),
    oauth_token: token,
    oauth_version: '1.0',
  };
  const u = new URL(url);
  const all = { ...params };
  for (const [k, v] of u.searchParams) all[k] = v;
  const norm = Object.keys(all).sort().map((k) => `${enc(k)}=${enc(all[k])}`).join('&');
  const baseUrl = `${u.protocol}//${u.host}${u.pathname}`;
  const base = [method.toUpperCase(), enc(baseUrl), enc(norm)].join('&');
  const key = `${enc(consumerSecret)}&${enc(tokenSecret)}`;
  params.oauth_signature = createHmac('sha1', key).update(base).digest('base64');
  return 'OAuth ' + Object.keys(params).sort().map((k) => `${enc(k)}="${enc(params[k])}"`).join(', ');
}

function need(names) {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length) throw new Error(`missing credentials in the environment: ${missing.join(', ')}. UMS never asks for them in chat and never stores them.`);
  return Object.fromEntries(names.map((n) => [n, process.env[n]]));
}

async function json(res) {
  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : {}; } catch { body = { raw: text.slice(0, 300) }; }
  if (!res.ok) {
    const detail = body.detail || body.message || body.error || body.title || body.raw || res.statusText;
    throw new Error(`HTTP ${res.status}: ${detail}`);
  }
  return body;
}

export async function postX(item, { fetchImpl = fetch } = {}) {
  if ((item.media || []).length) throw new Error('X posts with media are published by a person; UMS publishes X text and threads only');
  const c = need(['X_API_KEY', 'X_API_SECRET', 'X_ACCESS_TOKEN', 'X_ACCESS_TOKEN_SECRET']);
  const base = (process.env.UMS_X_API_BASE || 'https://api.x.com').replace(/\/$/, '');
  const url = `${base}/2/tweets`;
  const parts = [item.text, ...(item.thread || [])].filter((t) => String(t || '').trim());
  if (!parts.length) throw new Error('nothing to post');
  const ids = [];
  let replyTo = null;
  for (const text of parts) {
    const body = { text };
    if (replyTo) body.reply = { in_reply_to_tweet_id: replyTo };
    const auth = oauth1Header({ method: 'POST', url, consumerKey: c.X_API_KEY, consumerSecret: c.X_API_SECRET, token: c.X_ACCESS_TOKEN, tokenSecret: c.X_ACCESS_TOKEN_SECRET });
    const res = await fetchImpl(url, { method: 'POST', headers: { authorization: auth, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const out = await json(res);
    const id = out?.data?.id;
    if (!id) throw new Error('X did not return a post id');
    ids.push(id);
    replyTo = id;
  }
  return { url: `https://x.com/i/web/status/${ids[0]}`, ids };
}

// Bluesky rich text: link and hashtag facets use UTF-8 byte offsets.
export function facets(text) {
  const out = [];
  const bytes = (s) => Buffer.byteLength(s, 'utf8');
  const re = /(https?:\/\/[^\s<>"']+[^\s<>"'.,;:!?)\]])|(^|\s)(#[\p{L}\p{N}_]+)/gu;
  let m;
  while ((m = re.exec(text))) {
    if (m[1]) {
      const start = bytes(text.slice(0, m.index));
      out.push({ index: { byteStart: start, byteEnd: start + bytes(m[1]) }, features: [{ $type: 'app.bsky.richtext.facet#link', uri: m[1] }] });
    } else if (m[3]) {
      const offset = m.index + m[2].length;
      const start = bytes(text.slice(0, offset));
      out.push({ index: { byteStart: start, byteEnd: start + bytes(m[3]) }, features: [{ $type: 'app.bsky.richtext.facet#tag', tag: m[3].slice(1) }] });
    }
  }
  return out;
}

const IMAGE_TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };

export async function postBluesky(item, { fetchImpl = fetch } = {}) {
  const c = need(['BSKY_HANDLE', 'BSKY_APP_PASSWORD']);
  const service = (process.env.UMS_BSKY_SERVICE || 'https://bsky.social').replace(/\/$/, '');
  const media = item.media || [];
  for (const m of media) {
    if (!IMAGE_TYPES[extname(m).toLowerCase()]) throw new Error(`Bluesky route takes png, jpeg or webp images only; ${m} is published by a person`);
    if (statSync(m).size > 1000000) throw new Error(`${m} is over Bluesky's 1,000,000-byte image limit`);
  }
  if (media.length > 4) throw new Error('Bluesky allows at most four images per post');
  const session = await json(await fetchImpl(`${service}/xrpc/com.atproto.server.createSession`, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ identifier: c.BSKY_HANDLE, password: c.BSKY_APP_PASSWORD }),
  }));
  const auth = { authorization: `Bearer ${session.accessJwt}` };
  const images = [];
  for (const m of media) {
    const blob = await json(await fetchImpl(`${service}/xrpc/com.atproto.repo.uploadBlob`, {
      method: 'POST', headers: { ...auth, 'content-type': IMAGE_TYPES[extname(m).toLowerCase()] }, body: readFileSync(m),
    }));
    images.push({ alt: item.alt || '', image: blob.blob });
  }
  const parts = [item.text, ...(item.thread || [])].filter((t) => String(t || '').trim());
  if (!parts.length) throw new Error('nothing to post');
  let root = null;
  let parent = null;
  const uris = [];
  for (let i = 0; i < parts.length; i++) {
    const record = { $type: 'app.bsky.feed.post', text: parts[i], createdAt: new Date().toISOString() };
    const f = facets(parts[i]);
    if (f.length) record.facets = f;
    if (i === 0 && images.length) record.embed = { $type: 'app.bsky.embed.images', images };
    if (parent) record.reply = { root, parent };
    const res = await json(await fetchImpl(`${service}/xrpc/com.atproto.repo.createRecord`, {
      method: 'POST', headers: { ...auth, 'content-type': 'application/json' }, body: JSON.stringify({ repo: session.did, collection: 'app.bsky.feed.post', record }),
    }));
    if (!res.uri || !res.cid) throw new Error('Bluesky did not return a record uri');
    const ref = { uri: res.uri, cid: res.cid };
    if (!root) root = ref;
    parent = ref;
    uris.push(res.uri);
  }
  const rkey = uris[0].split('/').pop();
  return { url: `https://bsky.app/profile/${session.did}/post/${rkey}`, uris };
}

export async function publish(item, opts) {
  if (item.platform === 'x') return postX(item, opts);
  if (item.platform === 'bluesky') return postBluesky(item, opts);
  throw new Error(`${item.platform} is published by a person; UMS prepares the post and the person presses publish`);
}
