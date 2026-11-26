---
description: Recommend the marketing approach for an app, game, website, SaaS or other project
argument-hint: "<what the project is> [--stage prelaunch|launch|growth|stalled] [--hours h] [--budget usd]"
---

Use the `ultimate-marketing-skills` skill for everything below and follow its rule zero:
nothing is published, sent or paid for unless `scripts/policy.mjs` allows it for the
workspace's mode. No emoji anywhere.

The text typed with this command is the request (Claude Code appends it below as
ARGUMENTS; in Codex it is the rest of the message).

`${CLAUDE_PLUGIN_ROOT}` is this plugin's folder. Codex leaves it empty: put the folder
that holds `.codex-plugin/` in its place in every command.

Work out the type (game, mobile-app, saas, devtool, open-source, website, local-business,
ecommerce, creator) and stage from the request and the project files, then run
`node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" advise --type <type> --stage <stage> --hours <h> --budget <usd>`.

Give the person the ladder it prints, adapted to their project with specifics (their
genre, their store, their audience). Keep each rung's evidence label. Say which rungs UMS
can run for them and in which mode (references/autonomy.md). Do not invent numbers.
