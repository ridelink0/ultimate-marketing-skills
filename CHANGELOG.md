# Changelog

## 1.0.0 - 2026-11-25

First release.

- Four autonomy modes (advise, draft, supervised, autopilot) with a tested
  policy: per-item and batch approvals recorded with the person's own words,
  daily caps, and a forbidden list no mode can override.
- Approval queue and audit log in `.ums/`; `ums run` publishes approved, due
  X text posts and threads and Bluesky posts through official APIs.
- ffmpeg video engine: storyboard to captioned vertical video with push-ins,
  ducked voiceover, -14 LUFS loudness, per-platform export and checks,
  contact sheets, frame grabs and safe-area guides.
- Platform limits as data, each with its source page and verified flag.
- Advisor with tactic ladders for nine project types, each rung labelled
  measured, reported or practice.
- Copy audit for AI-sounding phrases, plus platform checks for length,
  hashtags, links and missing disclosures.
- Official ad-library links, pinned integrations and MCP servers, doctor.
- Sales: a local pipeline (ums pipeline), outreach rules (CAN-SPAM, UK PECR, Gmail, Yahoo
  and Outlook sender requirements, LinkedIn automation ban), sales copy tells, a
  founder-led sales rung for SaaS and developer tools, the sales-playbook skill.
- Thirteen official MCP servers ship with the plugin (HubSpot, Attio, Close, Apollo,
  Buffer, Canva, Figma, Ahrefs, Similarweb, Klaviyo, Amplitude, Supermetrics, Notion);
  ums needs lists what each job needs, in setup order; ums mcp off keeps Claude off
  MCP entirely (it may still recommend one server, and asks first).
- Field-tested in draft mode on RideLink (docs/field-tests/ridelink.md).
- Twelve slash commands, six skills; a directory edition with markdown and JSON only.
