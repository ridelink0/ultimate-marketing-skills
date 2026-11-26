---
name: sales-playbook
description: Use when someone wants to sell, not just market - finding first customers, a sales pipeline or CRM, cold email or LinkedIn outreach, discovery calls and demos, follow-ups, pricing conversations, publisher pitches for a game, or creator and influencer deals. Keeps a local pipeline, drafts outreach that follows CAN-SPAM, UK PECR and Gmail, Yahoo and Outlook sender rules, and never sends anything without the person's approval of that message.
---

# Sales playbook

Part of Ultimate Marketing Skills. The founder sells first, one person at a
time (`../ultimate-marketing-skills/references/new-era.md`). Read
`../ultimate-marketing-skills/references/sales.md`.

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" needs sales
node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" pipeline next
```

- Keep every deal in `ums pipeline` (or the connected CRM: HubSpot, Attio or
  Close ship with UMS; sign in with `/mcp`). Every open deal has a dated next step.
- Draft each outreach message for one named person; run `ums tells` on it;
  queue it as `--action outreach_email` or `--action dm`. A person approves
  and sends each one. No sequences sent by a machine, no mass DMs, no
  automation on LinkedIn.
- Prepare calls from the deal notes: three Mom Test questions about the
  person's recent past, the one decision you need, and the next step to ask for.
- Never claim a customer, logo, number or quote you cannot show.

`${CLAUDE_PLUGIN_ROOT}` is empty in Codex: use the folder holding `.codex-plugin/`.
