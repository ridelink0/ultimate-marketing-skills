import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { oauth1Header, facets, postX, postBluesky } from '../scripts/post.mjs';

test('OAuth 1.0a header is well-formed, sorted and deterministic', () => {
  // The worked example from the X (Twitter) "Creating a signature" guide.
  const header = oauth1Header({
    method: 'POST',
    url: 'https://api.twitter.com/1.1/statuses/update.json?include_entities=true',
    consumerKey: 'xvz1evFS4wEEPTGEFPHBog',
    consumerSecret: 'kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw',
    token: '370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb',
    tokenSecret: 'LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE',
    nonce: 'kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg',
    timestamp: '1318622958',
  });
  // That example also signs a status body parameter, which JSON bodies do not
  // carry, so the value differs from the guide's; assert the structure instead.
  assert.match(header, /^OAuth oauth_consumer_key="xvz1evFS4wEEPTGEFPHBog", oauth_nonce="[^"]+", oauth_signature="[A-Za-z0-9%]+", oauth_signature_method="HMAC-SHA1", oauth_timestamp="1318622958", oauth_token="[^"]+", oauth_version="1.0"$/);
  const again = oauth1Header({ method: 'POST', url: 'https://api.twitter.com/1.1/statuses/update.json?include_entities=true', consumerKey: 'xvz1evFS4wEEPTGEFPHBog', consumerSecret: 'kAcSOqF21Fu85e7zjz7ZN2U4ZRhfV3WpwPAoE3Z7kBw', token: '370773112-GmHxMAgYyLbNEtIKZeRNFsMKPR9EyMZeS9weJAEb', tokenSecret: 'LswwdoUaIvS8ltyTt5jkRh4J50vUPVVHtR2YPi5kE', nonce: 'kYjzVBB8Y0ZFabxSWbWovY3uYSQ2pTgmZeNu2VS4cg', timestamp: '1318622958' });
  assert.equal(header, again, 'deterministic for fixed nonce and time');
});

test('Bluesky facets use UTF-8 byte offsets', () => {
  const text = 'café https://example.com/x #indiedev';
  const f = facets(text);
  const link = f.find((x) => x.features[0].$type.endsWith('#link'));
  const tag = f.find((x) => x.features[0].$type.endsWith('#tag'));
  assert.equal(Buffer.from(text).subarray(link.index.byteStart, link.index.byteEnd).toString(), 'https://example.com/x');
  assert.equal(Buffer.from(text).subarray(tag.index.byteStart, tag.index.byteEnd).toString(), '#indiedev');
  assert.equal(tag.features[0].tag, 'indiedev');
});

function stub(handler) {
  return new Promise((resolve) => {
    const calls = [];
    const server = createServer((req, res) => {
      let body = '';
      req.on('data', (d) => { body += d; });
      req.on('end', () => {
        calls.push({ url: req.url, headers: req.headers, body });
        const [status, json] = handler(req, body, calls.length);
        res.writeHead(status, { 'content-type': 'application/json' });
        res.end(JSON.stringify(json));
      });
    });
    server.listen(0, '127.0.0.1', () => resolve({ server, calls, base: `http://127.0.0.1:${server.address().port}` }));
  });
}

function withEnv(vars, fn) {
  const old = {};
  for (const k of Object.keys(vars)) { old[k] = process.env[k]; process.env[k] = vars[k]; }
  return fn().finally(() => { for (const k of Object.keys(vars)) { if (old[k] === undefined) delete process.env[k]; else process.env[k] = old[k]; } });
}

test('X thread posts each part as a reply to the last', async () => {
  const s = await stub((req, body, n) => [201, { data: { id: String(100 + n) } }]);
  try {
    const r = await withEnv({ X_API_KEY: 'k', X_API_SECRET: 's', X_ACCESS_TOKEN: 't', X_ACCESS_TOKEN_SECRET: 'ts', UMS_X_API_BASE: s.base }, () => postX({ text: 'one', thread: ['two', 'three'] }));
    assert.equal(s.calls.length, 3);
    assert.match(s.calls[0].headers.authorization, /^OAuth /);
    assert.equal(JSON.parse(s.calls[1].body).reply.in_reply_to_tweet_id, '101');
    assert.equal(r.url, 'https://x.com/i/web/status/101');
    assert.ok(!JSON.stringify(s.calls).includes('"ts"'), 'token secret never sent in the clear');
  } finally { s.server.close(); }
});

test('X errors surface the API message; missing credentials are named', async () => {
  const s = await stub(() => [403, { detail: 'You are not permitted to perform this action.' }]);
  try {
    await withEnv({ X_API_KEY: 'k', X_API_SECRET: 's', X_ACCESS_TOKEN: 't', X_ACCESS_TOKEN_SECRET: 'ts', UMS_X_API_BASE: s.base }, async () => {
      await assert.rejects(postX({ text: 'x' }), /HTTP 403: You are not permitted/);
    });
  } finally { s.server.close(); }
  await withEnv({ X_API_KEY: '' }, async () => { await assert.rejects(postX({ text: 'x' }), /X_API_KEY/); });
  await assert.rejects(postX({ text: 'x', media: ['a.mp4'] }), /published by a person/);
});

test('Bluesky posts a thread with root and parent refs', async () => {
  const s = await stub((req, body, n) => {
    if (req.url.endsWith('createSession')) return [200, { accessJwt: 'jwt', did: 'did:plc:abc' }];
    return [200, { uri: `at://did:plc:abc/app.bsky.feed.post/r${n}`, cid: `c${n}` }];
  });
  try {
    const r = await withEnv({ BSKY_HANDLE: 'me.test', BSKY_APP_PASSWORD: 'pw', UMS_BSKY_SERVICE: s.base }, () => postBluesky({ text: 'first https://example.com', thread: ['second'] }));
    const second = JSON.parse(s.calls[2].body).record;
    assert.equal(second.reply.root.uri, 'at://did:plc:abc/app.bsky.feed.post/r2');
    assert.equal(second.reply.parent.cid, 'c2');
    assert.equal(s.calls[1].headers.authorization, 'Bearer jwt');
    assert.equal(r.url, 'https://bsky.app/profile/did:plc:abc/post/r2');
  } finally { s.server.close(); }
});
