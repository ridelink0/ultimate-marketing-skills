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

## Checkpoint 2 (2026-11-25 late, window about 77%)

- ALL research done. Report: C:/Users/OWNER/reports/Ultimate Marketing Skills research.md (uses the
  verification-pass corrections). Notes: 12 files in research_notes/Ultimate Marketing Skills research/.
- Commit c52c9d9: core scripts + data (platforms, playbooks, copy-tells, integrations with pinned SHAs).
  Smoke-tested: video build/check/sheet (1080x1920, -14.0 LUFS, sheet inspected), advise, tells,
  check, queue add/approve (non-TTY refusal works), run --dry-run, packs, doctor.
- Written after commit: skills/ultimate-marketing-skills/SKILL.md, references/autonomy.md.
- OPEN RISK: report says Anthropic's Software Directory Policy may exclude AI image/video/audio
  generation, ads/sponsored content and autonomous money movement. Read the live policy page
  (claude.com/docs/plugins or support.claude.com directory policy) BEFORE building the directory
  edition; UMS's video is ffmpeg rendering, not AI generation, but say exactly what the page says.

RESOLVED 2026-11-25 (live page read in the browser pane): support.claude.com/en/articles/13145358
section 4 excludes (B) "Software that uses AI models to generate images, video, or audio content"
incl. text-to-video, AI video editing, TTS, music models (design-only image aids allowed), and
(C) "Software that serves advertisements, sponsored content, paid product placements, or exists
primarily as an advertising or promotional vehicle"; (A) autonomous money movement without a human.
Also: no hidden instructions, no dynamically pulled instructions, privacy link if remote service,
README needs 3+ working example prompts. => Directory edition: no AI video/TTS/image-gen guidance,
no fal/Veo/ElevenLabs routes; ffmpeg rendering, filming, captions from SRT are fine. Full GitHub
edition keeps AI-generation notes with disclosure rules.

## Checkpoint 3 (window about 87%) - Gev: "make sure UMS is at UFS quality, thats the standard"

Done and committed through the tests commit: core scripts, data, SKILL.md, 12 references, 11 commands,
manifests (claude plugin validate passes on root AND directory edition), hook, README/AGENTS/PRIVACY/
CREDITS/CHANGELOG/LICENSE/icon, tests (30 passed on first full run: policy, queue, checks, tells,
advisor, data, adlib, X OAuth + Bluesky against local stub, ffmpeg renders incl. loudness and trim,
structure: no emoji, manifests, commands, skills, refs, node --check, hook, secrets, directory
edition), tools/directory-edition.mjs. Last test+commit run was backgrounded; confirm it committed
("Tests (policy, queue ..." in git log) and that the suite still passes (should be 35 tests).

Since checkpoint 3: pass-2 fixes committed dd7dc03 (X bare-domain counting, audio-only video check;
40/40 tests), skill folders marketing-video, marketing-visual-research, social-autopilot,
launch-playbook committed 303bf8f (validate passes).

NEW SCOPE (Gev, 2026-11-25): "include sales to it too since thats close to marketing". Do FIRST
after reset:
S1. One deep-research track (sonnet), notes to research_notes/Ultimate Marketing Skills research/
    sales.md, then append a sales section to the report: founder-led sales 2026 (ICP, discovery
    calls, demos, follow-up, pipeline stages, pricing pages, trials vs demos), outbound rules
    (CAN-SPAM; GDPR/PECR consent for B2B email in EU/UK; Google and Yahoo bulk-sender rules: SPF,
    DKIM, DMARC, one-click unsubscribe, spam-rate threshold - verify on support.google.com and
    senders.yahooinc.com), LinkedIn outreach limits and its automation ban, AI SDR tools and what
    evidence exists, sales MCP servers (HubSpot, Salesforce, Apollo, Clay?) with licences, how
    indie/SaaS founders close first customers (named cases), sales for games/apps (B2B2C,
    publishers, bundles) where relevant. Verify key claims in a second pass like marketing.
S2. Build: skills/sales-playbook/SKILL.md + references/sales.md; data/sales.json (stages,
    discovery questions, objection patterns, email rules with sources); policy: outreach_email,
    dm stay per-item and never batchable (already true) - add tests that sales sends are never
    autonomous; commands/sell.md (pipeline + outreach drafts + call prep) and add to README table;
    scripts: `ums pipeline add|list|move|next` (.ums/pipeline.json, no network) with tests; copy
    tells for sales email (fake "Re:" subjects, false familiarity, fake urgency); advise types get a
    sales rung where the project sells B2B (saas, devtool). README + CHANGELOG + directory edition.

Sales pipeline already built and committed 55e2d16 (`ums pipeline`, 42/42 tests). S2 above still
needs the research-backed parts (sales skill, references/sales.md, data/sales.json, sell command).

NEW SCOPE (Gev, 2026-11-25): "make for claude directory usage limits and UFS up to date".
D1. Find the canonical UFS source: compare D:/plugin-work-1101/suite HEAD with GitHub
    ridelink0/ultimate-frontend-skills master (657229889362 on 2026-11-25) and the local
    marketplace clone (6572298 "Directory editions of UFS and Usage Limits under directory/").
    Work in a fresh worktree/branch of whichever is newest; preserve other chats' dirty work.
    RESULT D1 (checked): D:/plugin-work-1101/suite HEAD 65b822a (2026-11-08, 1 dirty file, plugin
    6.10.0, usage 1.44.0) is an ancestor of origin/master 6572298 (2026-11-25, has directory/).
    Use origin/master: `git -C D:/plugin-work-1101/suite worktree add D:/plugin-work-1101/dir-refresh
    -b gev/directory-refresh origin/master`. Leave the suite's dirty file alone.
    D2/D3 FINDINGS (worktree D:/plugin-work-1101/dir-refresh, branch gev/directory-refresh from
    6572298): `node tools/directory-edition.mjs --check` says both editions up to date (UFS 87
    files, usage 10); versions 6.12.0 / 1.46.0 match; `claude plugin validate` passes both but
    flags README with no marketplace install line (both). Policy 4B risk: UFS edition ships
    references/image-gen.md and "image generation" in plugin.json keywords/description. FIX in
    tools/directory-edition/ sources (never the generated folder): add install lines
    (`/plugin install ultimate-frontend-skills --marketplace ridelink0/ultimate-frontend-skills`,
    `/plugin install usage-limits --marketplace ridelink0/ultimate-frontend-skills`), drop
    image-gen.md + image-generation keyword/description text from the UFS edition (keep in GitHub
    edition), rebuild, --check, validate twice, run test/directory-edition.test.mjs, commit on the
    branch. Ask Gev before push.
    D DONE locally: commit 9c5960d on gev/directory-refresh (worktree D:/plugin-work-1101/dir-refresh):
    install lines added, UFS edition 86 files without image-gen.md or the image-generation keyword;
    --check current; claude plugin validate passes both with no notes; test/directory-edition 5 pass,
    0 fail, 1 not run (check why). NOT pushed; ask Gev before push and portal resubmission.
D2. Regenerate directory/ultimate-frontend-skills and directory/usage-limits from current
    sources (UFS tools/directory-edition.mjs; check how usage-limits edition is built). Versions
    must match the current plugin.json of each (UFS 6.12.0? usage-limits 1.46.0 is installed
    locally - confirm which is released).
D3. Run `claude plugin validate` on both edition folders, twice. Check each against the live
    Software Directory Policy (support.claude.com/en/articles/13145358): 4B AI image/video/audio
    generation (UFS image generation via Pollinations and any TTS must be absent unless purely
    design assets), 4C ads, no hidden or dynamically pulled instructions, privacy link, README
    >= 40 words with 3 example prompts and an install line, < 512 files, no non-image file over
    256 KiB, no scripts/hooks in the edition.
D4. Run that repo's own tests (test/directory-edition.test.mjs and the suite), commit on a branch,
    then ASK Gev before pushing or resubmitting in the portal.

PROGRESS after D1: CI workflow + text-hook example (contact sheet inspected) committed 6efd78c;
link check done 30bf8db (40 URLs; MCP endpoints 401/405 are auth-gated, expected; fixed Bluesky
lexicon path and Buffer docs). Sales research agent launched in background -> sales.md (if the
file is missing or truncated after the reset, re-run that track). UFS-parity items 2, 3 (example
part), 5 are DONE; still open: 1 (more adversarial cases), 3 (field test on a real Gev project),
4 done earlier (skill folders), 6, 7, 8.

UFS-parity gaps still open, do in this order:
1. Bug pass 2 (adversarial): Windows paths with spaces/quotes in storyboard media; fontFile family;
   SRT with BOM/CRLF; words.json shapes; queue concurrent ids; run with item.at in future; X weighted
   count for URLs without scheme; Bluesky facet for URL ending in punctuation; hook on huge stdin;
   advise hours=0; specs on platform without text; export of video without audio; check on
   audio-only file. Add a regression test for each real bug found.
2. Link check: HEAD/GET every source URL in data/*.json and references (record dead ones, never
   mark verified if page no longer says it).
3. examples/: a real worked example (e.g. examples/launch-video/ storyboard.json + generated media
   from ffmpeg lavfi + BUILD-NOTES.md) rendered and its contact sheet opened; plus a draft-mode
   field test on one of Gev's real projects (RideLink or Atlias site) writing .ums/ outputs only,
   nothing published; record in docs/field-tests/.
4. More skill folders like UFS (thin routers, each with its own frontmatter trigger): marketing-video,
   marketing-visual-research, social-autopilot, launch-playbook. Keep descriptions <= 1024.
5. .github/workflows/test.yml (ubuntu/windows/macos, Node 22, install ffmpeg) like UFS regression.yml.
6. Codex: hooks/codex-hooks.json like UFS if Codex supports UserPromptSubmit; scripts/install.mjs
   registering with both CLIs (UFS has one).
7. docs/: research summary pointer, audit receipts (pass-1/pass-2 logs) like UFS docs/audit-*.
8. Final: npm test twice, claude plugin validate twice, commit. Then ASK Gev before creating
   github.com/ridelink0/ultimate-marketing-skills, pushing, or submitting to the directory.

## Remaining work, in order (older list)

1. references/: platforms.md, video.md (storyboard schema: size|platform, fps, background, font,
   fontFile, voiceover, music, musicVolume, captions .srt|words.json, captionWords, loudness,
   style{color,outline,titleSize,captionSize,captionLift}, scenes[{duration,text,caption,align top,
   background,image,zoom,video,start}]), visual-research.md, copy.md, chrome.md, compliance.md,
   search.md, measure.md, claude.md, mcp.md, research.md. Use the report for facts; cite sources.
2. Extra skills (thin SKILL.md routers): marketing-video, marketing-visual-research, social-autopilot,
   launch-playbook. commands/*.md: market, advise, video, visual-research, autopilot, queue, launch,
   copy-check, specs, doctor, packs (description + argument-hint; no $ARGUMENTS, no {{ }}, no
   leading at-sign words, under 4000 bytes).
3. Manifests: .claude-plugin/plugin.json (+icon), marketplace.json, .codex-plugin/plugin.json,
   package.json (zero deps, Node 22, bin ums), hooks/hooks.json + hooks/nudge.mjs (marketing keyword
   gate), .gitattributes (eol=lf).
4. README.md (UFS style, many Claude references, autonomous vs assisted clearly), AGENTS.md,
   PRIVACY.md, CREDITS.md, CHANGELOG.md, LICENSE (MIT, Gev).
5. test/*.test.mjs: policy, queue, checks, tells, video (ffmpeg, skip if absent), post (stub server
   for X OAuth and Bluesky facets), commands frontmatter, manifests, no-emoji sweep, directory edition.
6. tools/directory-edition.mjs -> directory/ultimate-marketing-skills (markdown+JSON only).
   Run `claude plugin validate` on root and directory edition.
7. Bug pass 1 (functional: npm test, real renders opened) then pass 2 (adversarial). Commit.
8. Ask Gev before creating the GitHub repo / pushing / directory submission.

## Next, in order (original)

1. Research round (8 topics) then report, then a second verification pass on key claims.
2. Audit local marketing skills: marketing:* (Anthropic knowledge-work), ecc marketing/social/video
   skills, video-watch, UFS remotion-video/link-preview/image-deep-research.
3. Build plugin tree, scripts, tests, directory edition. Two bug passes. Commit locally.
4. Ask Gev before any public push or directory submission.
