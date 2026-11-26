---
description: Check marketing copy for AI-sounding phrases, platform limits, hashtags, links and missing disclosures
argument-hint: "<file or text> [--platform x|linkedin|tiktok|...]"
---

Use the `ultimate-marketing-skills` skill for everything below and follow its rule zero:
nothing is published, sent or paid for unless `scripts/policy.mjs` allows it for the
workspace's mode. No emoji anywhere.

The text typed with this command is the request (Claude Code appends it below as
ARGUMENTS; in Codex it is the rest of the message).

`${CLAUDE_PLUGIN_ROOT}` is this plugin's folder. Codex leaves it empty: put the folder
that holds `.codex-plugin/` in its place in every command.

Run `node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" tells <file>` and, when a platform is named,
`node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" check --platform <p> <file>`. Rewrite every error in the person's voice
(`.ums/voice.md`), keep their meaning, and show the before and after. references/copy.md.
