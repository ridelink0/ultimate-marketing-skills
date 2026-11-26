#!/usr/bin/env node
/* ultimate-marketing-skills UserPromptSubmit hook.
   Prints one line, and only when the prompt is clearly about marketing,
   launching or promoting something. Silent otherwise, so it costs nothing on
   every other turn. Reads stdin, never blocks, never fails the prompt. */

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (d) => { raw += d; if (raw.length > 65536) process.exit(0); });
process.stdin.on('end', () => {
  let prompt = '';
  try {
    prompt = String(JSON.parse(raw).prompt || '');
  } catch {
    prompt = raw;
  }
  const p = prompt.toLowerCase();

  // Must be about getting attention...
  const topic =
    /\b(market(ing)?|promot(e|ion|ing)|launch(ing)?|go[- ]to[- ]market|get (more )?(users|players|downloads|installs|customers|followers|wishlists)|grow(th)? (my|the|our)|advertis(e|ing)|campaign|content calendar|social media|viral)\b/.test(p) ||
    /\b(tiktok|instagram reels?|youtube shorts|shorts video|product hunt|show hn|steam wishlists?|build in public)\b/.test(p);
  if (!topic) return;

  // ...and ask for something to be planned, made or posted.
  const intent =
    /\b(plan|make|create|write|draft|post|schedule|film|edit|render|script|advise|help|how (do|should|can) i|what should|strategy|ideas?|need)\b/.test(p);
  if (!intent) return;

  process.stdout.write(
    'Use the ultimate-marketing-skills skill for this. It plans by project type, writes in the ' +
      "founder's voice, renders checked vertical video with ffmpeg, and queues every post for " +
      'approval. Follow its rule zero: nothing is published, sent or paid for unless the policy allows it.\n',
  );
});
process.stdin.on('error', () => process.exit(0));
