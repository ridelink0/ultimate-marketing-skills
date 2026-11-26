# Which Claude does which job

UMS is written for Claude and runs on whichever Claude surface the person is
using. Each one is good at a different part of the work.

| Job | Best Claude surface | Why |
|---|---|---|
| Brief, plan, calendar, copy | Claude Code or Claude (chat, Cowork) | Reads the repo or the files, writes to `.ums/` |
| Rendering video, checks, queue | Claude Code (or Codex) with this plugin | Runs `scripts/ums.mjs` and ffmpeg locally |
| Looking at a render | Claude Code reading the contact-sheet PNG | Claude sees the frames and catches cut-off text and weak first frames |
| Ad-library and trend research | Claude in Chrome, or the Claude desktop app's browser pane | Reads the live pages as a person would |
| Assisted publishing | Claude in Chrome | Already signed in; Claude fills the composer, the person presses publish |
| The weekly loop on a timer | Claude Code `/schedule` routines or Claude Desktop scheduled tasks | Runs `/ultimate-marketing-skills:autopilot` without anyone typing |
| Landing pages, store pages, share cards | Claude Code with Ultimate Frontend Skills | The sister plugin |
| Dashboards of results | Claude artifacts | A page the team can open, built from `.ums/reports/` |
| Marketing data | Claude with MCP connectors (HubSpot, Ahrefs, Similarweb, Klaviyo, Supermetrics, Canva) | Real numbers instead of guesses |

## Working well with Claude on marketing

- Give Claude the brief once (`.ums/brief.md`); every later command reads it.
- Ask for one week at a time. Claude makes the whole batch, the person
  approves once, Claude publishes what the policy allows.
- Let Claude look at its own videos: the contact sheet is the cheapest
  quality check there is.
- Keep credentials out of chat. Claude reads them from the environment and
  never needs to see them.
- Long sessions: the queue, the log and the reports are files, so a new
  Claude session picks up exactly where the last one stopped.
