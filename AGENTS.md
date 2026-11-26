# ultimate-marketing-skills

This repo is a plugin for Claude Code and Codex. It teaches a coding agent
social-first marketing and ships the code that runs it.

## If you are doing marketing work

Read `skills/ultimate-marketing-skills/SKILL.md` and follow it. The rules
that matter most, in case you read no further:

1. **Nothing is published, sent or paid for unless `scripts/policy.mjs`
   allows it.** Everything goes through the queue. Approvals carry the
   person's own words.
2. **No emoji anywhere** - posts, captions, video text, commits, replies.
3. Keep marketing reasoning out of the reply: make the files, say where.

## If you are working ON this repo

```
.claude-plugin/plugin.json        Claude Code manifest
.claude-plugin/marketplace.json   catalogue (Codex reads it too)
.codex-plugin/plugin.json         Codex manifest
skills/ultimate-marketing-skills/ the doctrine; references/ load on demand; data/*.json
scripts/ums.mjs                   CLI entry
scripts/policy.mjs                autonomy policy (tested in test/policy.test.mjs)
scripts/queue.mjs                 .ums workspace, queue, approvals, run
scripts/video.mjs                 ffmpeg engine
scripts/post.mjs                  X and Bluesky official API routes
scripts/checks.mjs, tells.mjs     platform and copy checks
scripts/advise.mjs, adlib.mjs, doctor.mjs, packs.mjs
commands/*.md                     one slash command each
hooks/                            UserPromptSubmit nudge
tools/directory-edition.mjs       builds directory/ultimate-marketing-skills (markdown + JSON)
```

Constraints:

- Zero dependencies. Node 22+, built-ins only. `package.json` carries
  metadata, `bin` and script aliases only.
- A change to `policy.mjs` needs the matching test and the matching words in
  `references/autonomy.md`.
- Data values carry `source` and `verified`. Never add a number without its
  source; never mark a value verified unless the platform's own page says it.
- Credentials come from the environment only. No script writes or prints one.
- Commands need `description` and `argument-hint`, must not use
  `$ARGUMENTS`, `$1`-style placeholders, `{{ }}` or words starting with the
  at sign, and must stay under 4,000 bytes (Codex converts them to skills).
- The directory edition must not carry AI image, video or audio generation
  guidance (Anthropic Software Directory Policy, section 4B).
- Run `npm test` before every commit. Never run `tsc`.
