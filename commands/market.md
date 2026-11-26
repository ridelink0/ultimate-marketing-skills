---
description: Market a project end to end: brief, plan, posts, videos, queue, then publish what the mode allows
argument-hint: "<project, folder or store link> [--mode draft|supervised|autopilot]"
---

Use the `ultimate-marketing-skills` skill for everything below and follow its rule zero:
nothing is published, sent or paid for unless `scripts/policy.mjs` allows it for the
workspace's mode. No emoji anywhere.

The text typed with this command is the request (Claude Code appends it below as
ARGUMENTS; in Codex it is the rest of the message).

`${CLAUDE_PLUGIN_ROOT}` is this plugin's folder. Codex leaves it empty: put the folder
that holds `.codex-plugin/` in its place in every command.

Steps:

1. `node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" doctor`, then `node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" init --name "<project>" --type <type>` in the project folder
   if `.ums/` does not exist. Fill `.ums/brief.md` from the repo, README, site and store
   page; ask the person only for what you cannot find.
2. `node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" advise --type <type> --stage <stage> --hours <h> --budget <usd>` and follow the ladder.
3. Research the category (references/visual-research.md) and write `.ums/research/board.md`.
4. Write a two-week calendar in `.ums/calendar.md` and every post in it, in the voice from
   `.ums/voice.md`. Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" check --platform <p>` on each until it has no errors.
5. Make the videos (references/video.md): build, sheet, open the PNG, fix, check.
6. Queue every item with `node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" queue add`.
7. Stop and show `node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" queue list`. In supervised mode the person approves items; in autopilot
   they approve the batch once. Record approvals only with their own words
   (`--from-chat`). Then `node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" run` and assisted publishing (references/chrome.md).

Reply with what was made and where, in two sentences, then the queue summary.
