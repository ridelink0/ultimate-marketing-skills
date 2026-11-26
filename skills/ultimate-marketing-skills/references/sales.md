# Sales

Marketing brings people to the door; sales is the conversation that turns
one of them into a customer. For most small teams the founder sells, and
should, until the same conversation has been had enough times to write down.
Checked 2026-11-26; sources in `research.md`.

## What the evidence actually says

- **Founders sell first.** Merge's founders ran every sales conversation for
  the first eight months and changed messaging, demo, persona and price from
  meeting to meeting; before building they held about 100 discovery calls
  that pitched nothing. Retool reached about 40 customers on outbound alone,
  and its CEO warns that warm intros mislead because people take the call to
  be polite (both founder interviews in First Round Review, self-reported).
- **Never claim a logo you do not have.** TechCrunch (24 March 2025) reported
  an AI SDR company listing customers who said they were not customers.
- **AI SDR tools** (Clay, Apollo, Instantly, 11x, Artisan): no independent
  evidence of results was found. Treat vendor numbers as advertising.

## The pipeline

`ums pipeline` keeps it in `.ums/pipeline.json`, with no CRM needed:

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" pipeline add --name "Ana" --company "Studio A" --value 1200 --next "send demo link" --due 2026-12-01
node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" pipeline move <id> call --next "follow up with pricing" --due 2026-12-04
node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" pipeline next
```

Stages: lead, contacted, replied, call, trial, proposal, won, lost. Every
open deal has a next step with a date; `pipeline next` lists the due ones,
then the deals that have none (those are the ones that die quietly). With a
CRM connected (HubSpot, Attio or Close ship with UMS; sign in with `/mcp`),
read and update it there instead and keep `.ums/` for drafts.

## Discovery calls

Use The Mom Test (Rob Fitzpatrick): ask about the person's life and specific
past events, not opinions about your idea; talk less. SPIN's
situation, problem, implication, need-payoff order is the same idea with
more structure. For small deals, three questions from MEDDIC are enough: who
signs, what hurts, and how they decide. Write the answers into the deal's
notes the same day. (Framework summaries are secondary sources; label them
practice.)

## Outreach rules

UMS drafts outreach; a person sends each one. `outreach_email` and `dm`
queue items always need their own approval, in every mode. Never mass DMs.

- **US, CAN-SPAM:** honest sender and subject, a postal address, a working
  opt-out honoured within 10 business days and live for 30 days after
  sending; up to $53,088 per non-compliant email.
- **UK, PECR:** companies and LLPs ("corporate subscribers") may be emailed
  without consent, with your identity clear and an opt-out; sole traders and
  some partnerships count as individuals and need consent. Fines since
  5 February 2026: up to GBP 17.5M or 4% of worldwide turnover.
- **EU:** consent by default; how B2B email is treated varies by country.
- **Gmail** (bulk is close to 5,000 a day to Gmail, permanent once reached),
  **Yahoo** and **Outlook.com** (over 5,000 a day; non-compliant mail goes to
  Junk since 5 May 2025): SPF, DKIM and DMARC, an aligned From domain,
  one-click unsubscribe, spam complaints under 0.10% at Gmail (never 0.30%)
  and under 0.3% at Yahoo.
- **LinkedIn** bans third-party software that automates activity and
  restricts accounts that use it. It publishes no weekly invitation number;
  figures you see online come from tools that sell around the limit. Free
  members can add a personal note to only a few invitations a month (LinkedIn's
  own pages say three in one place and five in another). A person sends
  every LinkedIn message.

## Writing outreach that gets answered

One person, one reason you picked them, one question, under 100 words.
`ums tells` flags the habits that get cold email ignored: fake "Re:" or
"Fwd:" subjects, "just following up", "hope this finds you well", "quick
question" openers, and pretended familiarity ("as we discussed" when you did
not).

## Games and consumer apps

- **Publishers:** pitch a playable build or vertical slice, not a concept;
  warm introductions work best; most deals recoup and then split revenue; use
  a games-industry lawyer.
- **Creators and influencers:** every paid, gifted or affiliate post needs
  "ad", "advertisement" or "sponsored" in the post or video itself (FTC
  Endorsement Guides, 2023; UK ASA requires the same). Never pay for
  sentiment, never buy views or followers (FTC rule 16 CFR Part 465).
