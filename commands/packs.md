---
description: List the pinned marketing skills, plugins and MCP servers that work with UMS, with install commands
argument-hint: "[id]"
---

Use the `ultimate-marketing-skills` skill for everything below and follow its rule zero:
nothing is published, sent or paid for unless `scripts/policy.mjs` allows it for the
workspace's mode. No emoji anywhere.

The text typed with this command is the request (Claude Code appends it below as
ARGUMENTS; in Codex it is the rest of the message).

`${CLAUDE_PLUGIN_ROOT}` is this plugin's folder. Codex leaves it empty: put the folder
that holds `.codex-plugin/` in its place in every command.

Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" packs` (or `node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" packs --only <id>`). Show the person the install command for
what they need. Do not run an install unless the person says to in this conversation.
