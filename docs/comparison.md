# How UMS compares

Research on 2026-11-26 (notes: research_notes/Ultimate Marketing Skills
research/new_era_and_similar.md). Prices and features change; check each
vendor before relying on a line here.

## How teams make marketing now

- HubSpot's 2026 State of Marketing (1,500+ marketers): short-form video has
  the highest reported ROI (48.6%); 49.4% reuse the same content across
  platforms and 39.5% tailor it; 86.4% use AI.
- Content Marketing Institute (fielded June to August 2026, n=1,132): 88% of
  B2B teams use AI content tools and 59% use agents; AI is credited for speed
  (78%) far more than quality (17%); under speed pressure 29% report more
  generic content, and 52% have no policy on disclosing AI use.

UMS is built for that gap: fast production with checks for generic copy,
platform rules and disclosure, and a person approving what goes out.

## Similar tools

| Tool | What it is | Publishes | Approval |
|---|---|---|---|
| marketingskills (Corey Haines) | 53 Claude skills, MIT | no (advice) | n/a |
| Anthropic marketing plugin | campaign, content, SEO, reports, connectors | no | n/a |
| Postiz | open-source scheduler (AGPL), 14 platforms, AI and MCP | yes | not described |
| Blotato | hosted posting API and MCP | yes | not described |
| Buffer | scheduler with AI assistant | yes | approvals on the Team plan |

## What others have that UMS does not (yet)

Analytics dashboards, multi-seat approvals, more publishing platforms,
comment and DM inboxes, AI video generation and clipping, brand kits, hosted
MCP, direct email sending. UMS routes to MCP servers for several of these
(Supermetrics, Buffer, Canva, Klaviyo, Resend, MailerLite).

## What UMS does that we did not find elsewhere

Platform-limit checks with a source for each value, autonomy modes enforced
in code with tests, local ffmpeg rendering with a contact sheet Claude looks
at, a copy-tell audit, and advice, rendering, checks, queue and publishing in
one plugin. Absence elsewhere is what the research found, not proof.
