---
name: ultimate-marketing-skills
description: Use whenever someone wants to market, launch, promote or grow an app, game, website, SaaS, developer tool, local business, store or creator account - social posts, short-form video for TikTok, Reels and YouTube Shorts, X and LinkedIn posts, Reddit and Discord launches, Product Hunt and Show HN, store pages, ad and competitor research, a content calendar, or "what should I do to get users". Picks the approach for the project, writes in the founder's voice, plans and storyboards video, and keeps every post behind an approval rule.
---

# Ultimate Marketing Skills (directory edition)

The studio's marketing desk. Social first: native video, honest posts in a
real voice, and a weekly loop that measures what landed.

This edition is markdown and JSON. The full edition on GitHub
(github.com/ridelink0/ultimate-marketing-skills) adds the ffmpeg video engine,
the approval queue and API publishing; where a reference names a `ums`
command, do that step by hand from `data/` here, and never report a command
as run.

## Rule zero

Nothing is published, sent or paid for without the person's approval of that
item in this conversation. Never on any request: fake or bought reviews,
sockpuppet accounts, bought engagement, mass DMs, undisclosed ads,
impersonation, unlicensed music on business accounts. No emoji anywhere.
Make the files, then say what you made and where in two sentences.

## Start

1. Write `.ums/brief.md` from the project (what it is, who for, proof,
   links, hours and budget) and `.ums/voice.md` from things the founder wrote.
2. Pick the ladder: read `data/playbooks.json`, take the project type's
   `order`, keep the tactics that fit the hours and budget, and give each its
   evidence label (measured, reported, practice). Never present reported or
   practice advice as measured.
3. Research the category on the official ad libraries
   (`references/visual-research.md`).
4. Plan two weeks in `.ums/calendar.md`: one idea per post, platform, format, hook.
5. Write each post and check it against `data/platforms.json` (length unit,
   hashtags, links) and `data/copy-tells.json`.
6. For video, write the storyboard and shot list (`references/video.md`).
7. Show the person the batch. Publish nothing yourself; for assisted
   publishing follow `references/chrome.md` and stop before the final button.

## References

| File | When |
|---|---|
| `references/autonomy.md` | modes and approvals |
| `references/platforms.md` | how each feed distributes |
| `references/video.md` | storyboards, hooks, captions, sound |
| `references/visual-research.md` | ad libraries and boards |
| `references/copy.md` | voice and the copy tells |
| `references/chrome.md` | assisted publishing in a browser |
| `references/compliance.md` | disclosure, reviews, music, email |
| `references/search.md` | search and AI answers |
| `references/measure.md` | the weekly loop |
| `references/claude.md` | which Claude surface does which job |
| `references/mcp.md` | marketing MCP servers |
| `references/research.md` | sources and refreshing them |
