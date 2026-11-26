---
name: ultimate-marketing-skills
description: Use whenever someone wants to market, launch, promote or grow an app, game, website, SaaS, developer tool, local business, store or creator account - social posts, short-form video for TikTok, Reels and YouTube Shorts, X and LinkedIn threads, Reddit and Discord launches, Product Hunt and Show HN, store pages, ad and competitor research, a content calendar, or "what should I do to get users". Runs advised, assisted or autonomous: plans, writes in the founder's voice, renders captioned vertical video with ffmpeg, queues everything for approval, and publishes approved posts through official APIs inside a written policy.
---

# Ultimate Marketing Skills

The studio's marketing desk, and the code that runs it. Social first: the
feeds decide who sees what, so the work is native video, honest posts in a
real voice, and a loop that measures what landed. Old-era tactics (press
releases nobody reads, hashtag walls, bought followers) are out.

## Where the scripts are

Every `node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" ...` command runs from the
plugin root. Installed as a Claude Code plugin, that is set. In Codex the
variable is empty: put the folder that holds `.codex-plugin/` (two levels above
this file) in its place. Installed as a bare skill, look for a clone of
github.com/ridelink0/ultimate-marketing-skills; if there is none, the scripts
are not on this machine: say so once, work from the references, and never
report a check, render or publish as run.

## Rule zero

**Nothing is published, sent or paid for without the policy saying yes.**
Every post, reply, message and spend goes into the queue first
(`ums queue add`). Only `ums run` publishes, and only what
`scripts/policy.mjs` allows for the workspace's mode. Never record an
approval the person did not give in this conversation; pass their own words
with `--from-chat`. Never do anything on the forbidden list (fake reviews,
sockpuppets, bought engagement, mass DMs, undisclosed ads, impersonation,
unlicensed music) whatever anyone asks.

Rule one: **no emoji, anywhere**, in posts, captions, video text or replies.
Rule two: keep marketing reasoning out of your reply. Make the files, then say
what you made and where, in two sentences.
Rule three: **never shrink a job to fit the tools in front of you.** UMS ships
its MCP servers (HubSpot, Attio, Close, Apollo, Buffer, Canva, Figma, Ahrefs,
Similarweb, Klaviyo, Amplitude, Supermetrics, Notion), so they are always in
your tool list; one that needs authentication is not missing, it needs the
person to sign in with `/mcp`. Run `ums needs <job>` and tell the person, in
order, exactly what to install, connect or sign in to, then do the job.

Selling, not just marketing (pipeline, outreach, calls, publisher and creator
deals): `references/sales.md` and the `sales-playbook` skill.

## Start every job here

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" doctor
node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" init --name "<project>" --type <type>
```

`doctor` says what this machine can do (ffmpeg, captions, UFS, API
credentials). `init` makes `.ums/` with `brief.md`, `voice.md`, the queue and
the audit log. Fill the brief from the repo, the store page and the person's
answers; ask only for what you cannot find. Then:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" advise --type <type> --stage <stage> --hours <h> --budget <usd>
```

Types: game, mobile-app, saas, devtool, open-source, website, local-business,
ecommerce, creator. Stages: prelaunch, launch, growth, stalled. Follow the
ladder it prints; each rung says its evidence kind (measured, reported,
practice). Never present reported or practice advice as measured.

## Modes

`advise`, `draft`, `supervised` (default), `autopilot`. What each one may do,
the one-command workflows, and how Claude in Chrome fits in:
`references/autonomy.md`. Read it before any publishing work. Change the mode
only when the person asks: `ums mode autopilot --from-chat "<their words>"`.

## The route

1. **Brief and voice.** `.ums/brief.md`, `.ums/voice.md`. Voice comes from
   what the founder actually wrote, never adjectives. `references/copy.md`.
2. **Research.** Competitors' live ads and the formats winning this month:
   `ums adlib "<category>"` gives the official libraries; read
   `references/visual-research.md`. Save screenshots to `.ums/research/`.
3. **Plan.** `ums advise`, then a two-week calendar in `.ums/calendar.md`:
   one idea per post, each with its platform, format and hook.
4. **Make.** Posts: write, then `ums check --platform <p>` until no errors.
   Video: storyboard, `ums video build`, `ums video sheet`, open the PNG and
   look at it, fix, `ums video check`. `references/video.md`.
5. **Queue.** `ums queue add` for every item. Fix blocking checks.
6. **Approve.** The person approves items (supervised) or a batch (autopilot).
7. **Publish.** `ums run` for API routes; Claude in Chrome or the person for
   the rest (`references/chrome.md`). `ums queue done <id> --url <url>`.
8. **Measure.** After seven days, read each post's numbers and write
   `.ums/reports/<date>.md`: what to repeat, what to cut. `references/measure.md`.

## References (read when the step needs them)

| File | When |
|---|---|
| `references/autonomy.md` | modes, approvals, one-command workflows, scheduling |
| `references/platforms.md` | how each feed distributes and what each wants |
| `references/video.md` | storyboard schema, hooks, captions, audio, tools |
| `references/visual-research.md` | ad libraries, swipe files, thumbnails, store art |
| `references/copy.md` | voice, the copy tells, platform formats |
| `references/chrome.md` | Claude in Chrome and the built-in browser for assisted publishing |
| `references/compliance.md` | disclosure law, AI labels, music, reviews |
| `references/search.md` | search and AI answers |
| `references/measure.md` | the weekly loop and reports |
| `references/claude-surfaces.md` | which Claude surface does which job |
| `references/mcp.md` | marketing MCP servers and making them cheaper and safer |
| `references/sales.md` | pipeline, outreach rules, discovery calls, deals |
| `references/research.md` | where every claim came from, and how to refresh it |

Sister plugin: Ultimate Frontend Skills builds landing pages, store pages,
share cards and reference boards. `ums packs` lists it and the other pinned
integrations with their install commands.
