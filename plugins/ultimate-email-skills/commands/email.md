---
description: Email marketing - sequences, newsletters and launch emails written, checked and built into email HTML, with every send approved by a person
argument-hint: "<what to send: welcome sequence, launch email, newsletter issue, or a draft to check>"
---

Use the `email-marketing` skill for everything below.
Nothing is sent without the person's approval of that email. No emoji anywhere.

The text typed with this command is the request (Claude Code appends it below as
ARGUMENTS; in Codex it is the rest of the message).

`${CLAUDE_PLUGIN_ROOT}` is this plugin's folder. Codex leaves it empty: put the folder
that holds `.codex-plugin/` in its place in every command.

1. `node "${CLAUDE_PLUGIN_ROOT}/scripts/email-cli.mjs" needs` and tell the person, in order,
   what is missing (an email service sign-in through /mcp, SPF, DKIM and DMARC).
2. For a sequence: `node "${CLAUDE_PLUGIN_ROOT}/scripts/email-cli.mjs" sequence <type> --name
   "<product>" --out .ums/email/<type>`, then write every `[[write: ...]]` line in the
   founder's voice from things the founder wrote. For a single email, write the draft with
   subject, preheader, kind, address and unsubscribe frontmatter.
3. `node "${CLAUDE_PLUGIN_ROOT}/scripts/email-cli.mjs" check <draft.md>` until it passes.
4. `node "${CLAUDE_PLUGIN_ROOT}/scripts/email-cli.mjs" build <draft.md>`; open the HTML at
   phone width and look at it.
5. Queue it with the approval step (the person reads it and says send) and show the
   person. They approve each send.

references/email.md has the rules (CAN-SPAM, PECR, CASL, Gmail and Yahoo sender
requirements, one-click unsubscribe, BIMI, what to measure).
