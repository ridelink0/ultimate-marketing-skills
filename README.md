# Ultimate Marketing Skills

**UMS for Claude.** Market an app, a game, a website, a SaaS or a local
business from Claude Code, Claude in Chrome or Codex, the way people actually
find things now: in the feed. One command plans the work, writes it in your
voice, renders the short videos, checks every post against the platform's own
limits, and queues it all. Then it publishes as much as you allow, and not a
post more.

Plugin id `ultimate-marketing-skills`. Sister plugin to
[Ultimate Frontend Skills](https://github.com/ridelink0/ultimate-frontend-skills),
which builds the landing pages, store pages and share cards UMS points people at.

## Install

Claude Code:

```bash
claude plugin marketplace add ridelink0/ultimate-marketing-skills
claude plugin install ultimate-marketing-skills@ultimate-marketing-skills
```

Needs Node 22 or newer. Video needs ffmpeg
(`winget install Gyan.FFmpeg`, `brew install ffmpeg`, or `apt install ffmpeg`).
Then ask Claude to run `/ultimate-marketing-skills:doctor`.

## Try it

Three prompts that work on a fresh install:

- "Market my game. It's a cozy farming roguelike, the Steam page is live, I
  have six hours a week and no budget." (`/ultimate-marketing-skills:market`)
- "Make a 20-second TikTok from these three screenshots of my app, with
  captions, and check it for Reels and Shorts too."
  (`/ultimate-marketing-skills:video`)
- "What should I do to get my first 100 users for this SaaS?"
  (`/ultimate-marketing-skills:advise`)

## How autonomous is it?

You pick, per project, and can change it any time. The rules are code
(`scripts/policy.mjs`) with tests, not a promise in a prompt.

| Mode | What happens without you | What waits for you |
|---|---|---|
| `advise` | Claude researches and writes the plan | everything else |
| `draft` | Claude writes posts and renders videos on disk | anything leaving your machine |
| `supervised` (default) | everything up to the queue; approved items publish through an API | each item's approval; the publish button on platforms without an API route |
| `autopilot` | you approve a week's batch once; approved posts go out on schedule inside daily caps | replies, DMs, spending, account changes, deletions |

**Fully autonomous** means autopilot plus a schedule: Claude Code's
`/schedule`, a Claude Desktop scheduled task, or plain cron runs
`/ultimate-marketing-skills:autopilot`. It publishes the approved batch,
reads last week's numbers, writes a report, drafts next week and asks you to
approve it. X (text and threads) and Bluesky (text and images) publish
through their official APIs with your own keys.

**Partly autonomous** is everything else, and most of the value. TikTok,
Instagram, YouTube, LinkedIn, Reddit, Hacker News and Product Hunt either
require a person at publish time or ban automated posting. There, UMS renders
the file, writes and checks the caption, and Claude in Chrome opens the
composer and fills it in. You press publish.

**Never, in any mode:** fake or bought reviews, sockpuppet accounts, bought
engagement, mass DMs, undisclosed ads, impersonation, unlicensed music.
`ums policy` prints the list and the law behind each line.

Full detail: [autonomy](skills/ultimate-marketing-skills/references/autonomy.md).

## What it does

- **Advises.** `ums advise --type game --hours 6` returns the tactic ladder
  for your project type, stage, hours and budget, each rung labelled
  measured, reported or practice, with its source.
- **Makes video.** A storyboard becomes a captioned 1080x1920 video with
  push-ins on stills, ducked voiceover and music, normalised to -14 LUFS.
  `ums video check` holds it against TikTok, Reels, Shorts, the App Store
  and Steam; `ums video sheet` makes a contact sheet so Claude can look at
  its own render before you do.
- **Writes like you.** Voice comes from things you wrote. `ums tells` catches
  the phrases that make copy read as machine-written; `ums check` adds each
  platform's length, hashtag and link rules and flags missing disclosures.
- **Researches visually.** `ums adlib "<category>"` opens the official ad
  libraries and trend pages; Claude reads them in Chrome and builds a board of
  what is working this month.
- **Queues and publishes.** Every post is a file in `.ums/queue/`, every
  approval and publish a line in `.ums/log.jsonl`.
- **Knows its neighbours.** `ums packs` lists pinned skills (marketingskills,
  Anthropic's marketing plugin, ECC, HyperFrames, Remotion, UFS) and the
  official marketing MCP servers (HubSpot, Buffer, Canva, Ahrefs, Similarweb,
  Klaviyo, Supermetrics, Google Analytics), plus the tools that make MCP
  cheaper and safer. It prints installs; it never runs them.
- **Ships its MCP servers.** HubSpot, Attio, Close, Apollo, Buffer, Canva,
  Figma, Ahrefs, Similarweb, Klaviyo, Resend, MailerLite, Amplitude, Supermetrics and Notion come
  with the plugin, so Claude always knows they exist. Each stays idle until
  you sign in with `/mcp`. `ums needs <job>` lists, in order, what a job needs
  and what is still missing, so Claude asks for the right thing instead of
  doing less. Prefer no MCP at all? `ums mcp off` keeps Claude off them; it
  works from your exports and only recommends a server, and asks, when one
  would clearly change the result. `ums packs` keeps the tools that make MCP
  cheaper and safer either way.
- **Runs email.** `ums email sequence` drafts welcome, onboarding, launch,
  game-launch and win-back sequences; `ums email check` holds each draft to
  CAN-SPAM, PECR and CASL and the Gmail and Yahoo sender rules; `ums email build`
  turns it into styled email HTML (three themes, logo, hero image, cards,
  image-beside-text sections, dark mode) plus a plain-text part. Klaviyo, Resend and
  MailerLite ship as MCP servers for sending, after you approve each send.
- **Sells, too.** A local pipeline (`ums pipeline`), discovery-call prep,
  one-to-one outreach drafts checked against CAN-SPAM, UK PECR and the Gmail,
  Yahoo and Outlook sender rules, and publisher and creator deal notes. A
  person sends every message.

## Slash commands

| Command | Does |
|---|---|
| `/ultimate-marketing-skills:market` | the whole job, brief to queue |
| `/ultimate-marketing-skills:advise` | the approach for this project |
| `/ultimate-marketing-skills:video` | one short video, built, checked and queued |
| `/ultimate-marketing-skills:visual-research` | what is working in the category now |
| `/ultimate-marketing-skills:autopilot` | the weekly loop |
| `/ultimate-marketing-skills:queue` | list, approve, reject, mark posted |
| `/ultimate-marketing-skills:launch` | launch week, every post ready |
| `/ultimate-marketing-skills:copy-check` | copy audit and platform check |
| `/ultimate-marketing-skills:specs` | platform limits with sources |
| `/ultimate-marketing-skills:doctor` | what this machine can do, and the tool bench |
| `/ultimate-marketing-skills:packs` | integrations and MCP servers |
| `/ultimate-marketing-skills:sell` | pipeline, outreach drafts, call prep |
| `/ultimate-marketing-skills:email` | sequences, newsletters, launch emails |

## Using it with Claude

UMS is written for Claude and plays to each Claude surface: Claude Code runs
the scripts and renders; Claude reads its own contact sheets; Claude in Chrome
does ad-library research and fills composers; Claude Code `/schedule` routines
run the weekly loop; Claude artifacts turn `.ums/reports/` into a dashboard
the team can open; Claude's MCP connectors bring in real numbers. See
[which Claude does which job](skills/ultimate-marketing-skills/references/claude-surfaces.md).

## The research

Platform limits, tactics and rules come from research run on 25 November
2026 and fact-checked in a second, independent pass. Every value in
`skills/ultimate-marketing-skills/data/` names its source and whether it was
read on the platform's own page. [How to refresh it](skills/ultimate-marketing-skills/references/research.md).

## Privacy and licence

No telemetry, no server. What leaves your machine, and when, is in
[PRIVACY.md](PRIVACY.md). MIT licensed; see [CREDITS.md](CREDITS.md).
