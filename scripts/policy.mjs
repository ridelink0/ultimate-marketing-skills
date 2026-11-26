// The autonomy policy. This file decides what UMS may do on its own, what
// waits for a person, and what it never does. Every route that can publish,
// spend or message goes through decide(). Tests in test/policy.test.mjs hold
// each rule in place; loosen one only with a matching change there and in
// skills/ultimate-marketing-skills/references/autonomy.md.

export const MODES = ['advise', 'draft', 'supervised', 'autopilot'];

// What each mode does, in the words the docs use.
export const MODE_NOTES = {
  advise: 'Plans and recommendations only. Writes nothing outside .ums/.',
  draft: 'Makes posts, scripts, images and videos on disk. Nothing leaves the machine.',
  supervised: 'Everything is queued. Each item is published only after a person approves that item.',
  autopilot: 'A person approves a batch once. Approved organic posts then go out on schedule through official APIs, inside daily caps. Anything else still waits for a person.',
};

// Action classes. `batchable` actions may be covered by a batch approval in
// autopilot; every other allowed action needs its own approval in every mode.
export const ACTIONS = {
  publish_post: { batchable: true, note: 'An organic post, thread, short video or carousel on an account the user owns.' },
  schedule_post: { batchable: true, note: 'Handing an approved post to the platform or a scheduler for later.' },
  reply: { batchable: false, note: 'A public reply or comment. Always a person, because context changes by the minute.' },
  dm: { batchable: false, note: 'A direct message to one person who already talks to the account.' },
  paid_spend: { batchable: false, note: 'Boosts, ads, creator fees. Needs an amount and a person every time.' },
  account_change: { batchable: false, note: 'Profile, bio, handle, links, settings.' },
  delete: { batchable: false, note: 'Removing a post or asset.' },
  outreach_email: { batchable: false, note: 'A first email to a creator, journalist or partner.' },
};

// Never, in any mode, whatever a person says. Each one is either illegal in
// a major market or a ban offence on the platforms UMS targets. Sources are in
// references/compliance.md.
export const FORBIDDEN = {
  fake_review: 'Writing, buying or posting reviews or testimonials that are not from real customers (FTC 16 CFR Part 465; UK DMCC Act 2024).',
  sockpuppet: 'Posting or voting from accounts that pretend to be unrelated people.',
  engagement_manipulation: 'Buying or trading likes, follows, views, upvotes or comments; follow-unfollow loops; vote rings.',
  mass_dm: 'Unsolicited direct messages to people who have not contacted the account.',
  undisclosed_endorsement: 'A paid, gifted or affiliate post without a clear ad disclosure.',
  scrape_against_terms: 'Collecting data from a site whose terms forbid automated access.',
  impersonation: 'Presenting content as coming from a real person or brand who did not make it.',
  unlicensed_audio: 'Putting trending or commercial music on a business account without a licence.',
};

const PLATFORM_ROUTES = {
  // `api` means UMS can publish an approved item itself with the user's own
  // credentials. `assisted` means a person presses publish: UMS prepares the
  // file, the caption and, in Chrome, the filled composer.
  x: 'api',
  bluesky: 'api',
  tiktok: 'assisted',
  instagram: 'assisted',
  youtube: 'assisted',
  linkedin: 'assisted',
  reddit: 'assisted',
  threads: 'assisted',
  facebook: 'assisted',
  discord: 'assisted',
  producthunt: 'assisted',
  hackernews: 'assisted',
  newsletter: 'assisted',
};

// The API routes cover text, threads and (Bluesky) still images. A post that
// carries video, or any media on X, is published by a person.
export function routeFor(platform, item = {}) {
  const route = PLATFORM_ROUTES[platform] || 'assisted';
  if (route !== 'api') return route;
  const media = item.media || [];
  if (platform === 'x' && media.length) return 'assisted';
  if (platform === 'bluesky' && media.some((m) => !/\.(png|jpe?g|webp)$/i.test(m))) return 'assisted';
  return route;
}

export const DEFAULT_CAPS = { perPlatformPerDay: 3 };

// decide() answers one question: may this action on this item happen now,
// without asking anybody? It returns { allowed, needs, reason }.
//   allowed: true  -> go ahead
//   allowed: false -> do not; `needs` says what would make it allowed
//                     ('item-approval', 'person-at-publish', or 'never')
export function decide({ mode, action, item = {}, config = {}, postedToday = 0 }) {
  if (!MODES.includes(mode)) return no('never', `unknown mode "${mode}"`);
  if (FORBIDDEN[action]) return no('never', FORBIDDEN[action]);
  for (const flag of item.flags || []) {
    if (FORBIDDEN[flag]) return no('never', FORBIDDEN[flag]);
  }
  const spec = ACTIONS[action];
  if (!spec) return no('never', `unknown action "${action}"`);

  if (mode === 'advise' || mode === 'draft') {
    return no('mode-change', `${mode} mode publishes nothing; switch to supervised or autopilot`);
  }

  if (item.disclosureRequired && !item.disclosed) {
    return no('item-approval', 'the item needs an ad or AI disclosure and has none');
  }
  if (item.checks && item.checks.blocking > 0) {
    return no('item-approval', `${item.checks.blocking} blocking check(s) failed`);
  }

  const approvals = item.approvals || [];
  const itemApproved = approvals.some((a) => a.scope === 'item');
  const batchApproved = approvals.some((a) => a.scope === 'batch');

  if (action === 'paid_spend' && !(item.amount > 0)) {
    return no('item-approval', 'a spend needs an amount');
  }

  let approved = itemApproved;
  if (!approved && mode === 'autopilot' && spec.batchable && batchApproved) approved = true;
  if (!approved) {
    const why = spec.batchable && mode === 'autopilot'
      ? 'no item or batch approval recorded'
      : 'this action needs its own approval';
    return no('item-approval', why);
  }

  const route = routeFor(item.platform, item);
  if ((action === 'publish_post' || action === 'schedule_post') && route !== 'api') {
    return no('person-at-publish', `${item.platform} has no publishing route UMS may drive alone; a person presses publish`);
  }

  if (action === 'publish_post' && mode === 'autopilot' && !itemApproved) {
    const cap = Number(config.caps?.perPlatformPerDay ?? DEFAULT_CAPS.perPlatformPerDay);
    if (postedToday >= cap) return no('item-approval', `daily cap of ${cap} for ${item.platform} reached`);
  }

  return { allowed: true, needs: null, reason: itemApproved ? 'approved item' : 'approved batch' };
}

function no(needs, reason) {
  return { allowed: false, needs, reason };
}

export function describe() {
  const lines = ['UMS autonomy policy', ''];
  for (const m of MODES) lines.push(`  ${m.padEnd(11)} ${MODE_NOTES[m]}`);
  lines.push('', 'Actions (batch = autopilot may cover it with one batch approval)');
  for (const [k, v] of Object.entries(ACTIONS)) lines.push(`  ${k.padEnd(15)} ${v.batchable ? 'batch' : 'item '}  ${v.note}`);
  lines.push('', 'Never, in any mode');
  for (const [k, v] of Object.entries(FORBIDDEN)) lines.push(`  ${k.padEnd(24)} ${v}`);
  lines.push('', 'Publishing routes');
  for (const [k, v] of Object.entries(PLATFORM_ROUTES)) lines.push(`  ${k.padEnd(12)} ${v}`);
  return lines.join('\n');
}
