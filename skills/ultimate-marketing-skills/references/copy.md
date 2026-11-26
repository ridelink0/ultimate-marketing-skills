# Copy and voice

People scroll past anything that sounds like everything else. The copy has to
sound like the founder on a good day: specific, plain, a little opinionated.

## Voice comes from samples

`.ums/voice.md` holds three to five things the founder actually wrote. Before
writing, read them and note: sentence length, words they use, words they never
use, how they open, whether they joke. Write in that voice. If there are no
samples, ask for one paragraph about why they built it, and use that.

## The audit

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" tells post.txt
node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" check --platform x post.txt
```

`tells` finds the phrases that mark copy as generated or as a press release
(data in `data/copy-tells.json`, each with its reason and fix). `check` adds
the platform's limits, hashtag count and link placement. Errors block the
queue. Fix every error; fix warnings unless the person's own voice uses that
phrase on purpose.

## Rules that do most of the work

- Lead with the thing, the result or the problem, never with feelings
  ("excited to share") or scene-setting ("in today's world").
- One idea per post. A number, a screenshot, a clip, or a customer's words
  beats an adjective.
- Say what it does in words a stranger understands; product names come later.
- No emoji. No hashtag walls. No "not just X, it's Y". No three one-word
  sentences in a row.
- End on the next step: the link in the reply, the store, the wishlist.

## Shapes per platform

| Platform | Shape |
|---|---|
| X | One sentence that stands alone; threads only when each post earns its place; link in reply |
| Bluesky, Threads | Conversational, a question people can answer from experience |
| LinkedIn | First line is the whole point; short paragraphs; a lesson with proof |
| TikTok, Reels, Shorts | The caption repeats the on-screen hook in words people search |
| Reddit | Title says what it is; body says you made it and why; no marketing voice at all |
| Show HN | "Show HN: <name> - <what it does>"; first comment is the maker's plain story |
| Email | Subject is the news; one link |
