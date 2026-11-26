# Privacy

Ultimate Marketing Skills runs on your machine. Gev operates no server,
account system, analytics or telemetry for it, and receives nothing from it.
That does not mean no data leaves your machine; here is exactly what does.

## Stored locally

- `.ums/` in your project: the brief, voice samples, queue items, rendered
  media, research screenshots, reports, and `log.jsonl`, an audit log of
  approvals (including the words a person used to approve) and publishes.
  You choose where it lives and delete it when you like. There is no fixed
  retention period.
- The prompt hook reads the current prompt to decide whether to suggest the
  skill. It does not store or send it.

## Sent elsewhere, only when you use the feature

- **Publishing to X**: approved post text goes to the X API with your own
  credentials (from environment variables, never written to disk by UMS).
- **Publishing to Bluesky**: your handle and app password go to your
  Bluesky service to start a session; approved post text and images follow.
- **Research links**: `ums adlib` only prints URLs. Opening them in a browser
  sends your search term to Meta, TikTok, Google, LinkedIn or Reddit.
- **Browser-assisted publishing**: when Claude in Chrome fills a composer, the
  content goes to that platform when you press publish.
- **MCP servers and other plugins** you install have their own policies.

Claude itself processes what you share in the conversation under your Claude
plan's terms. Each platform you post to applies its own privacy terms.

## Contact

Issues: https://github.com/ridelink0/ultimate-marketing-skills/issues
