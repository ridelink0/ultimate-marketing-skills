# Tools that help UMS

Research on 2026-11-26 (notes: research_notes/Ultimate Marketing Skills
research/new_era_and_similar.md and email_design.md). These are tools UMS
works with, each pinned in `skills/ultimate-marketing-skills/data/integrations.json`;
`ums packs` prints the install command, and nothing is installed without the
person saying so.

## What the research says teams need

- Short-form video has the highest reported ROI (HubSpot 2026 State of
  Marketing, 1,500+ marketers); 49.4% reuse one piece across platforms.
- AI is credited for speed (78%) far more than quality (17%), and under speed
  pressure 29% report more generic content (CMI, n=1,132, 2026).

So UMS uses other tools for reach and depth, and keeps its own checks,
voice rules and approval policy over everything they produce.

## How each one helps

| Tool | Licence | How UMS uses it |
|---|---|---|
| marketingskills (Corey Haines) | MIT | conversion, pricing, lifecycle depth |
| ai-marketing-claude | MIT | parallel site and funnel audits feeding the calendar |
| openclaudia-skills | MIT | niche jobs (77 skills); install only what a job needs |
| marketing-os | MIT | a scored audit before a campaign |
| MJML email skill (framix-team) | MIT | complex email layouts; checked with ums email check |
| email-design (CosmoBlk) | MIT | layout archetypes for brand-heavy emails |
| Postiz | AGPL-3.0 | self-hosted scheduling for platforms without a UMS API route |
| Buffer, Canva, Klaviyo, Resend, MailerLite, Supermetrics | vendor MCP | scheduling, design, email, metrics (bundled MCP servers) |
| HyperFrames, Remotion | Apache-2.0, Remotion licence | motion-heavy video beyond the ffmpeg engine |

## Gaps the helpers fill, and what UMS adds on top

Helpers bring dashboards, scheduling, design kits, audits and email layout.
UMS adds what the research did not find in them: sourced platform-limit
checks, autonomy modes enforced in code, local ffmpeg rendering checked by
Claude looking at a contact sheet, the AI-copy audit, and one queue with an
approval for everything that goes out.
