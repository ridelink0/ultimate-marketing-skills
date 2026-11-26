---
name: launch-playbook
description: Use when someone is launching or about to launch an app, game, SaaS, developer tool, open-source project or website - Product Hunt, Show HN, Steam Next Fest, a store release, a Kickstarter or a beta - and needs the launch week planned with every post, email and video ready, and the rules of each launch site respected.
---

# Launch playbook

Part of Ultimate Marketing Skills. Distribution is built before launch
(`../ultimate-marketing-skills/references/new-era.md`); launch week cashes in
attention already earned. Run the advisor for the launch stage, then build the
week:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" advise --type <type> --stage launch --hours <h> --budget <usd>
```

In `.ums/launch/`: Show HN post and the maker's first comment; Product Hunt
listing and maker comment; posts for the one or two subreddits whose rules
allow it (quote the rule); X, Bluesky and LinkedIn posts; a Discord
announcement; short creator emails; the launch video
(`../ultimate-marketing-skills/references/video.md`); and `run-sheet.md`,
hour by hour, who posts what where.

Hacker News, Product Hunt, Reddit and LinkedIn ban automated posting and vote
solicitation, so a person posts there; queue only the X and Bluesky items.
Never ask for upvotes, never use a second account, and check the store page
and share card first (`../ultimate-marketing-skills/references/platforms.md`).
