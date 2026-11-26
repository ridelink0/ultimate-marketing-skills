# Ultimate Marketing Skills (UMS) work plan

Status: active, started 2026-11-25. Owner: Gev. Repo: D:/ultimate-marketing-skills (local only, nothing pushed).

## The brief (Gev, 2026-11-25, set as /goal)

Build Ultimate Marketing Skills, the marketing counterpart to Ultimate Frontend
Skills (UFS, github.com/ridelink0/ultimate-frontend-skills, local clone at
C:/Users/OWNER/.claude/plugins/marketplaces/ultimate-frontend-skills, canonical
dev tree D:/plugin-work-1101/suite). Same process and quality bar as UFS:

1. Find the marketing plugins and skills worth folding in, improve them, integrate them.
2. Deep research everything about marketing, verified twice. New era: social first
   (TikTok, Reels, Shorts, X, YouTube, LinkedIn, Reddit, Discord), not old methods.
3. Autonomous and assisted workflows. The user issues one command; the system runs it.
4. Visual image deep research for marketing (ad libraries, trend boards).
5. Chrome-driven automation for X, YouTube, TikTok. Excel at video creation.
6. Embed UFS pieces (video, images, link previews, motion) to lift marketing output.
7. Advise the best approach for a given app, game, website or other project.
8. Docs must explain fully autonomous and partly autonomous modes clearly. Core of the plugin.
9. Looks human-made, UFS house style. Many references to Claude, matching UFS volume.
10. Research the Claude directory so the plugin submits without errors. Bug-check twice.
11. Relays in case usage runs out.

Rules from Gev's AGENTS.md: start replies "Okay Gev", no emojis anywhere, bug-check
twice (functional pass, then adversarial pass), never tsc, use node --check, never
pretend, finish everything, no "next session" lists.

## Research

Notes: C:/Users/OWNER/research_notes/Ultimate Marketing Skills research/
Report: C:/Users/OWNER/reports/Ultimate Marketing Skills research.md

## Done

- Mapped UFS layout: .claude-plugin/{plugin,marketplace}.json, .codex-plugin, skills/, commands/,
  hooks/, scripts/*.mjs (zero deps, Node 22), test/*.test.mjs, tools/directory-edition.mjs
  (markdown+JSON directory edition, no hooks/scripts), PRIVACY.md, CREDITS.md, CHANGELOG.md.
- Read the UFS release-hardening rules (skill plugin-release-hardening) and
  D:/plugin-work-1101/release-artifacts/DIRECTORY-SUBMISSION.md.

## Progress checkpoint (2026-11-25, window about 58% used)

- Research round 1 done (8 notes) and round 2 running: platform_limits_verified.md,
  case_studies_verified.md, verification_pass.md (independent fact-check), mcp_tooling.md
  (Gev added 2026-11-25: "find plugins that help MCPs be better").
- Written so far: scripts/lib/args.mjs, scripts/lib/data.mjs, scripts/policy.mjs (modes advise/draft/
  supervised/autopilot, action classes, FORBIDDEN list, routes: x+bluesky api, rest assisted),
  scripts/queue.mjs (.ums workspace, add/approve/reject/markPosted/runDue, audit log; non-TTY approval
  needs --from-chat quote), scripts/checks.mjs, scripts/tells.mjs, data/copy-tells.json,
  scripts/video.mjs (build storyboard via ffmpeg+ASS, export, check, sheet, frames, safezone),
  scripts/post.mjs (X OAuth1 text/threads, Bluesky text/links/tags/images).
- Missing: data/platforms.json (wait for platform_limits_verified.md), playbooks.json,
  integrations.json, scripts/ums.mjs CLI, advise/doctor/adlib/packs, skills, commands, docs, tests,
  directory edition, hooks.

## Next, in order

1. Research round (8 topics) then report, then a second verification pass on key claims.
2. Audit local marketing skills: marketing:* (Anthropic knowledge-work), ecc marketing/social/video
   skills, video-watch, UFS remotion-video/link-preview/image-deep-research.
3. Build plugin tree, scripts, tests, directory edition. Two bug passes. Commit locally.
4. Ask Gev before any public push or directory submission.
