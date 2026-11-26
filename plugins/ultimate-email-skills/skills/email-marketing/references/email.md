# Email marketing

Email is the one channel no feed can take away. Every post and video should
point at one thing people can sign up for, and the list should hear the news
first. Checked 2026-11-26.

## The tools

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/email-cli.mjs" sequence welcome --name "<product>" --out .ums/email/welcome
node "${CLAUDE_PLUGIN_ROOT}/scripts/email-cli.mjs" check .ums/email/welcome/01-deliver.md
node "${CLAUDE_PLUGIN_ROOT}/scripts/email-cli.mjs" build .ums/email/welcome/01-deliver.md
```

- `sequence` writes the drafts for welcome, onboarding, launch, game-launch
  or winback, each with when it sends and the one job it does. Every
  `[[write: ...]]` line must be replaced; `check` fails while one is left.
- `check` reads a draft (Markdown with `subject`, `preheader`, `kind`,
  `address`, `unsubscribe` frontmatter) and fails on a missing subject,
  unsubscribe or postal address, images without alt text, unfilled scaffold,
  or a built size over the clipping limit; it warns on long subjects and
  preheaders, plain-http links, link shorteners, too many links, image-heavy
  mail, and the copy tells.
- `build` writes `<name>.html` (600 px, table layout email clients render,
  light and dark colour-scheme hints, hidden preheader, footer with address
  and unsubscribe) and `<name>.txt` (the plain-text part), then checks the
  built size.

Paste both into your email service, or send them through a connected email
MCP server (Klaviyo, Resend and MailerLite ship with UMS; sign in with
`/mcp`) after the person approves that send. Merge tags of the common
services (`{{ unsubscribe_url }}`, `*|UNSUB|*`, `{% unsubscribe %}`) pass
through untouched.

## Images and style (version 2 builder)

Frontmatter picks the look; the body adds sections:

```
theme: editorial            clean | editorial | night (night is already dark)
brand: Moss Lane            name in the header when there is no logo
logo: https://.../logo.png  32 px high in the header; logoalt: Moss Lane
hero: https://.../hero.jpg  full width under the header; heroalt is required
accent: #9a3f1c             override any of accent, paper, surface, ink, muted

::: card                    a shaded box for one point or an offer
...
:::
::: split https://.../shot.png | alt text
## Text beside the picture  stacks under it on phones
:::
---                         a divider
-> [Button text](https://...)
```

- Light themes carry dark-mode colours for the clients that honour
  `prefers-color-scheme` (Apple Mail, some Outlook) and the Outlook app's
  `data-ogsc` attributes; Gmail applies its own inversion, so test there.
- Dark mode differs by client (Litmus, February 2025): Gmail on iOS fully
  inverts colours, Gmail on Android partly, Gmail on the web not at all;
  Apple Mail honours the theme's dark colours; classic Outlook on Windows
  fully inverts and ignores both techniques. Logos need to read on light and
  dark grounds (a transparent PNG with a thin outline does).
- Classic Outlook (the Word rendering engine) is supported until at least
  2029, so code for it as well as the new Outlook through 2027 at least.
- Plain founder-style emails often beat designed ones for software and
  newsletters (HubSpot's own test: 21% lower click-through for image-heavy
  HTML; vendor data, and shops can see the opposite). Use `theme: clean` with
  no hero for those, and save heroes for launches and product news.
- Web fonts work in only about a quarter of clients, so every theme uses
  system font stacks. Avoid WebP images (Gmail converts them); use JPG or PNG.
- Accessibility: the Email Markup Consortium's 2025 report found serious
  issues in 99.89% of 443,585 emails, and 96% had no `lang`. Every UMS email
  sets `lang` and `dir`, marks layout tables `role="presentation"`, uses
  real headings and 16 px body text, and requires alt text.
- Phones under 620 px stack split sections and tighten card padding.
- Outlook on Windows gets a fixed 600 px table through a conditional comment.
- Images must be hosted at https before sending; local paths work for a
  preview only, and `email-cli check` warns about each one. Export hero
  images at 1200 px wide (shown at 600) so they stay sharp on high-density
  screens, and keep each under a few hundred kilobytes.
- Every image needs alt text: many inboxes block images until the reader
  allows them, so the email must make sense without them.
- `examples/email-launch/` is a full example, rendered at phone and desktop
  width in light and dark mode.

## What to measure

- **Opens are unreliable.** Apple Mail Privacy Protection loads remote
  content in the background whether or not the email is opened, so open
  rates are inflated for Apple Mail readers. Judge an email by clicks,
  replies and the action it asked for.
- **Benchmarks** (MailerLite, 3.6M campaigns from 181k accounts, December
  2024 to November 2025): median open 43.46%, click 2.09%; software 1.15%
  click, games 2.11%. Compare against your own list first.

## Sequences

Each email has one job and one button. Timing below is practice, not
measured; no source tested the best number or spacing of emails.

| Sequence | Emails | Job |
|---|---|---|
| welcome | now, day 2, day 5 | deliver what was promised; the founder's reason; one real result |
| onboarding | now, day 1 if stuck, day 3, 2 days before a trial ends | move a new user one step to the first result |
| launch | 7 days before, 1 day before, launch day, 2 days after only with a real deadline | the list hears first |
| game-launch | Next Fest week, 14 days before release, release day | demo, date, out |
| winback | 90 days quiet, +7, +14 then remove | ask, remind, remove (sunset) |

## Deliverability

- **Gmail, Yahoo, Outlook.com bulk senders** (about 5,000 a day and up):
  SPF, DKIM and DMARC, aligned From domain, one-click unsubscribe, spam
  complaints under 0.10% at Gmail (never 0.30%) and under 0.3% at Yahoo.
  Ultimate Marketing Skills has the full outreach rules.
- **One-click unsubscribe** (RFC 8058): an HTTPS `List-Unsubscribe` header
  plus `List-Unsubscribe-Post: List-Unsubscribe=One-Click`, both covered by
  the DKIM signature; the POST must not redirect. Email services set these
  for you; check that yours does.
- **BIMI** (your logo in the inbox, Gmail): DMARC at quarantine or reject
  with pct=100, a VMC (needs a trademarked logo) or CMC certificate, and an
  SVG Tiny PS logo. Worth it only once the basics are clean.
- **Size:** keep built HTML well under about 100 KB. Email vendors report
  that Gmail clips larger messages and hides the rest, including the
  unsubscribe link; Google does not publish the figure, so UMS uses
  102,000 bytes as a conservative limit.
- **Hygiene:** remove addresses that bounce, and remove subscribers who stay
  quiet after a winback sequence. Quiet addresses drag down everything else.

## Law

- **US, CAN-SPAM:** honest From and subject, a valid postal address, a
  working unsubscribe honoured within 10 business days; up to $53,088 per
  violating email.
- **EU and UK:** consent first for individuals; UK PECR's soft opt-in covers
  existing customers for similar products, with an opt-out in every email.
- **Canada, CASL:** consent required; penalties up to $1M per violation for
  an individual and $10M for a business (section 20(4)).

## Choosing a service

Klaviyo (shops), Kit or beehiiv (creators and newsletters), MailerLite
(small teams, low cost), Resend (developers sending from code), Mailchimp.
Prices change often and published comparisons disagree: check the vendor's
own pricing page for your list size before choosing.
