# Research behind UMS

Every number in UMS's data and references carries its source and date. The
research ran on 25 November 2026 in two passes: eight topic studies, then an
independent fact-check of the high-stakes claims and a primary-source pass on
platform limits. Where the second pass corrected the first, UMS uses the
correction.

## Evidence labels

- **verified**: read on the platform's or regulator's own page.
- **measured**: a dataset with a stated sample (Socialinsider, Buffer, Pew,
  howtomarketagame survey).
- **reported**: a team's own claim about its results. Shown, never promoted.
- **practice**: common advice without data. Labelled so.

## Corrections the second pass made

- EU AI Act Article 50(2) marking: postponed to 2 December 2026 only for
  generative systems on the market before 2 August 2026.
- FTC fake-review penalty: $53,088 per violation (from 17 January 2025).
- Instagram API: 100 published posts per 24 hours; a carousel counts as one.
- YouTube upload API: `videos.insert` is limited to 100 calls a day in its
  own quota bucket.
- Remotion: free for three or fewer people (people, not employees).
- The claim that 68 to 88 percent of Next Fest wishlists came from people who
  never played the demo was dropped: no source states it.
- Instagram's five-hashtag cap and any platform loudness target are
  unverified; UMS treats them as warnings.

## Refreshing

Platforms change monthly. Before a paid campaign or a launch, re-read the
pages linked in `data/platforms.json` and update `checked`. A value whose
page no longer says it becomes `verified: false` until it is read again.
