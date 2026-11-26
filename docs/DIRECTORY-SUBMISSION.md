# Claude directory submission packet

Prepared 2026-11-26. Portal: https://claude.ai/directory/manage, submission
type "Plugin bundle", one plugin folder per submission. A submitted
repository folder cannot be changed in place: if a listing already exists for
UFS or Usage Limits, update that listing (check for the new commit, or the
review tab's resubmit action) instead of creating a duplicate.

Every folder below passes `claude plugin validate` (UFS and Usage Limits also
with `--profile directory --strict`). Each is Markdown, JSON and one PNG icon:
no hooks, no scripts, no MCP servers, under 100 files, no file over 256 KiB.

| Plugin | Repository | Folder | Commit | Version |
|---|---|---|---|---|
| ultimate-frontend-skills | ridelink0/ultimate-frontend-skills | directory/ultimate-frontend-skills | 2bd1c4e (master) | 6.12.0 |
| usage-limits | ridelink0/ultimate-frontend-skills | directory/usage-limits | 2bd1c4e (master) | 1.46.0 |
| ultimate-marketing-skills | ridelink0/ultimate-marketing-skills | directory/ultimate-marketing-skills | master | 1.0.0 |

Author: Gev. Contact: app.ridelink@gmail.com. Licence: MIT.

## Privacy policy links

- UFS: https://github.com/ridelink0/ultimate-frontend-skills/blob/master/directory/ultimate-frontend-skills/PRIVACY.md
- Usage Limits: https://github.com/ridelink0/ultimate-frontend-skills/blob/master/directory/usage-limits/PRIVACY.md
- UMS: https://github.com/ridelink0/ultimate-marketing-skills/blob/master/directory/ultimate-marketing-skills/PRIVACY.md

## Data handling (same answer for all three directory editions)

The editions are instructions and data only. They run no code, operate no
server, collect nothing and send nothing. Files Claude writes because of them
stay in the folder the user chooses. Websites the user asks Claude to open
apply their own terms.

## Three working example prompts each

UFS:
1. "Build a landing page for a dive watch called Fathom 300."
2. "Restyle this site folder so it stops looking AI-generated."
3. "Design the start screen for my pixel-art roguelike."

Usage Limits:
1. "Will refactoring this whole repo fit in my usage limit?"
2. "I have 20% of my 5-hour window left; what should I do first?"
3. "Plan this migration so a cutoff halfway costs little."

UMS:
1. "Market my game. It's a cozy farming roguelike, the Steam page is live, I have six hours a week and no budget."
2. "Plan a week of posts for my receipt-scanning app on TikTok, Instagram and X."
3. "What should I do to get the first 100 users for this SaaS?"

## Category

Marketing for UMS; Design (or Development) for UFS; Productivity (or
Development) for Usage Limits. Use the closest category the portal offers.

## Policy notes for the reviewer

- No AI image, video or audio generation in any directory edition
  (Software Directory Policy 4B): the UFS edition omits its image-generation
  reference; UMS's directory edition omits AI video and voice guidance.
- UMS never publishes, sends or spends without a person's approval of that
  item; it does not serve ads (4C) and does not move money (4A).

## What only Gev can do

Sign in, connect GitHub if asked, confirm the attestation and compliance
checkboxes, and press Submit for each plugin.
