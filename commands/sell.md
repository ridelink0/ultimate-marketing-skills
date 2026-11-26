---
description: Run sales for a project - pipeline, outreach drafts, call prep and follow-ups, with every send approved by a person
argument-hint: "<who you sell to, or a deal to work on>"
---

Use the `ultimate-marketing-skills` and `sales-playbook` skills for everything below.
Nothing is sent without the person's approval of that message. No emoji anywhere.

The text typed with this command is the request (Claude Code appends it below as
ARGUMENTS; in Codex it is the rest of the message).

`${CLAUDE_PLUGIN_ROOT}` is this plugin's folder. Codex leaves it empty: put the folder
that holds `.codex-plugin/` in its place in every command.

1. `node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" needs sales` and tell the person, in order,
   what is missing for this job (a CRM sign-in through /mcp, email authentication on the
   sending domain).
2. `node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" pipeline next` and work the due deals first.
3. For new prospects, write who they are and why them into the pipeline
   (`pipeline add`), then draft one message each, under 100 words, run
   `ums tells` on it, and queue it with `--action outreach_email` or `--action dm`.
4. For calls, write the prep into the deal notes: three questions about the person's
   recent past, the decision needed, the next step to ask for.
5. Show the queue. The person approves and sends each message; then move the deal.

references/sales.md has the rules (CAN-SPAM, UK PECR, Gmail, Yahoo and Outlook sender
requirements, LinkedIn's automation ban).
