---
description: Research the ads, posts and visuals that are working in a category right now
argument-hint: "<category, competitor or product>"
---

Use the `ultimate-marketing-skills` skill for everything below and follow its rule zero:
nothing is published, sent or paid for unless `scripts/policy.mjs` allows it for the
workspace's mode. No emoji anywhere.

The text typed with this command is the request (Claude Code appends it below as
ARGUMENTS; in Codex it is the rest of the message).

`${CLAUDE_PLUGIN_ROOT}` is this plugin's folder. Codex leaves it empty: put the folder
that holds `.codex-plugin/` in its place in every command.

1. `node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" adlib "<category or competitor>"` for the official ad libraries and trend pages.
2. Open them in Claude in Chrome or the browser pane and read what is on screen. No scraping
   or bulk download.
3. Save 10 to 20 screenshots to `.ums/research/` named `<date>-<source>-<advertiser>.png`,
   with one line each in `.ums/research/board.md` (first frame, hook, format, how long it ran).
4. End the board with three hooks to test and one thing you will not copy.

references/visual-research.md has the details.
