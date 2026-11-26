---
name: email-marketing
description: Use when someone wants email marketing - a newsletter, a welcome or onboarding sequence, a launch or game-release email, a trial-ending or win-back email, list growth, an email service choice, deliverability (SPF, DKIM, DMARC, one-click unsubscribe, BIMI, spam folder problems), or a draft turned into email-client HTML with a plain-text part. Writes the drafts, checks them against CAN-SPAM, PECR and CASL and the Gmail and Yahoo sender rules, and builds the HTML; a person approves every send.
---

# Email marketing

Part of Ultimate Marketing Skills. Read
`../ultimate-marketing-skills/references/email.md`.

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" needs email
node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" email sequence <welcome|onboarding|launch|game-launch|winback> --name "<product>" --out .ums/email/<type>
node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" email check <draft.md>
node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" email build <draft.md>
```

- Write every draft in the founder's voice from `.ums/voice.md`; one job and
  one button per email. Replace every `[[write: ...]]` line.
- `check` must pass before a draft is queued. Then queue it:
  `ums queue add --platform newsletter --file <draft.md>`.
- Open the built HTML in a browser at phone width and look at it before
  calling it done.
- A person approves each send. With Klaviyo, Resend or MailerLite signed in
  through `/mcp`, Claude may send the approved email through it; otherwise
  the person pastes the HTML and text into their email service.
- Judge results by clicks and replies, not opens.

`${CLAUDE_PLUGIN_ROOT}` is empty in Codex: use the folder holding `.codex-plugin/`.
