---
description: Run the weekly marketing loop: publish approved due posts, report, draft next week, ask for approval
argument-hint: "[--dry-run]"
---

Use the `ultimate-marketing-skills` skill for everything below and follow its rule zero:
nothing is published, sent or paid for unless `scripts/policy.mjs` allows it for the
workspace's mode. No emoji anywhere.

The text typed with this command is the request (Claude Code appends it below as
ARGUMENTS; in Codex it is the rest of the message).

`${CLAUDE_PLUGIN_ROOT}` is this plugin's folder. Codex leaves it empty: put the folder
that holds `.codex-plugin/` in its place in every command.

1. `node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" run` (or `node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" run --dry-run` if asked). Report what was posted, held and why.
2. For items posted seven or more days ago, collect results and write
   `.ums/reports/<date>.md` (references/measure.md).
3. Draft next week's batch from the report, check and queue it with `--batch <week>`.
4. Ask the person for the batch approval. Record it only with their own words:
   `node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" queue approve --batch <week> --from-chat "<their words>"`.

Replies, DMs, spend, account changes and deletes are never part of a batch.
references/autonomy.md explains scheduling this command.
