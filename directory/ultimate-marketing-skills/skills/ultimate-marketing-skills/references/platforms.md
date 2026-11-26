# Platforms: how each feed decides, and what it wants

Exact limits are data, not prose: `ums specs` and `ums specs <platform>`
print them with the page each came from and whether it was verified. This
file is the judgment. Checked 2026-11-25; the research behind every line is
in `research.md`.

## TikTok

- Ranks on what viewers do: watches, finishes, rewatches, likes, shares,
  follows, skips (TikTok's own transparency page; it publishes no weights).
- Every video is tested on a small audience first, so a new account can land
  a hit. Consistency matters more than any single post.
- Search is now a real entry point: say the words people would type in the
  caption and on screen.
- Business accounts: Commercial Music Library or original sound only.
- Publishing: a person presses publish (see `autonomy.md`).

## Instagram Reels and posts

- Adam Mosseri names watch time, likes and sends (shares by DM) as the top
  Reels signals. Sends travel furthest: make things people forward.
- Originality rules (extended to photos and carousels on 30 April 2026):
  reposted, watermarked or lightly edited content is demoted. Post natively.
- Hashtags: a five-hashtag cap was reported on 19 December 2025 (secondary
  sources). UMS warns past five.
- Captions fold after about 125 characters; the hook goes first.
- Trial Reels show a Reel to non-followers first; use them to test hooks.

## YouTube Shorts and long-form

- Shorts run up to 3 minutes, square or vertical. Since 31 March 2025 every
  start or replay counts as a view; monetisation uses engaged views.
- YouTube publishes no Shorts ranking weights. Titles still matter for search.
- Long-form: thumbnails can be A/B tested with Test and Compare (up to three
  options, judged on watch-time share, about two weeks).
- Links in Shorts descriptions are not clickable; use a related video link.

## X

- The For You ranker is open source (github.com/xai-org/x-algorithm): the
  score is a weighted sum of predicted actions, positive and negative, with
  author-diversity decay and an out-of-network discount. Replies and
  conversations count; reports, mutes and "not interested" subtract.
- Links: X denies throttling link posts, outside analyses report much lower
  reach, and the API charges $0.20 per post with a URL against $0.015
  without. Put the link in the first reply.
- Reach is heavy-tailed: in Buffer's 1.7M-post study (March 2025) mean
  engagement was 328 against a median of about 4. Volume of honest attempts
  and real replies is the game.
- UMS can publish approved text posts and threads through the API.

## LinkedIn

- LinkedIn's 12 March 2026 post: feed ranking now uses generative
  recommenders and LLMs; engagement bait is demoted; engagement pods and
  comment automation are named targets. Its user agreement bans software
  that automates the site.
- Founder accounts outperform company pages. Document posts (PDF carousels)
  for frameworks; native video for demos. Link in the first comment.
- A person publishes and replies.

## Reddit

- Self-promotion limits are set by each subreddit's moderators. Read the
  sidebar rules; many ban links from new accounts.
- About 130M daily active users (Q2 2026), and Reddit threads are heavily
  cited in Google and AI answers. A good thread keeps sending people for years.
- Say you made it. Never ask for votes. Never post from more than one
  account. UMS drafts; a person posts.

## Discord

- Opens when there is something to do: playtests, betas, weekly builds.
- Onboarding: rules and one role. Server Insights from 500 members.
- Discoverable servers (1,000+ members) get public web pages from
  16 November 2026, with public-channel messages following from mid-December.
  Treat public channels as public.

## Threads and Bluesky

- Threads: 500 characters, one topic tag, up to five links; grows on
  conversation, rewards replies to others.
- Bluesky: 300 graphemes; links are first-class (no reach penalty by
  design); custom feeds decide distribution. UMS can publish approved posts,
  including up to four images.

## Product Hunt and Hacker News

- Show HN: the post is something people can try; the maker answers every
  comment; soliciting upvotes, automated posting and AI-edited comments are
  banned (news.ycombinator.com/showhn.html, newsguidelines.html).
- Product Hunt: Product of the Day goes to the most points; points weigh
  upvotes plus engagement (comments, click-throughs, shares), per Product Hunt
  staff. Bring real users who will comment; never run vote rings.

## Stores

- Steam: page live early; capsules are header 920x430, small 462x174, main
  1232x706, vertical 748x896, library 600x900, hero 3840x1240. The small
  capsule must read at its real size.
- App Store: app previews 15 to 30 seconds, 30 fps max, 886x1920 on
  Face ID iPhones (1080x1920 on Home Button iPhones), up to three per size.
  The first three screenshots carry the pitch.
- Google Play: the promo video is a YouTube link; feature graphic and
  screenshots per Play Console specs.
