---
description: Show the current limits for a platform: text length, hashtags, links, video size, length and safe area
argument-hint: "[platform]"
---

Use the `ultimate-marketing-skills` skill for everything below and follow its rule zero:
nothing is published, sent or paid for unless `scripts/policy.mjs` allows it for the
workspace's mode. No emoji anywhere.

The text typed with this command is the request (Claude Code appends it below as
ARGUMENTS; in Codex it is the rest of the message).

`${CLAUDE_PLUGIN_ROOT}` is this plugin's folder. Codex leaves it empty: put the folder
that holds `.codex-plugin/` in its place in every command.

Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" specs` or `node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" specs <platform>`. Report the values with whether each was
verified on the platform's own page and the date. Unverified values are labelled so.
