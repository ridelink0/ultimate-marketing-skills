# Visual research

Before making anything, look at what is already working in the category this
month. Pictures, not opinions.

## Where to look

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" adlib "<category or competitor>" --country US
```

prints the official pages, each with what it covers:

- **Meta Ad Library**: active Facebook and Instagram ads for any advertiser.
  The page shows commercial ads; the API returns political and EU-delivered
  ads only, so read the page.
- **TikTok Creative Center (Top Ads, trends)** and the **Commercial Content
  Library** (EEA, Switzerland, UK).
- **Google Ads Transparency Center**: Search, YouTube and Display.
- **LinkedIn Ad Library**, **Google Trends**, this week's YouTube uploads,
  top Reddit threads this month.

Open them in Claude in Chrome or the browser pane, read, and screenshot. Do
not scrape or bulk-download: their terms forbid it and it is not needed.

## What to capture

For each of 10 to 20 examples, save the screenshot to `.ums/research/` as
`<date>-<source>-<advertiser>.png` and one line in `.ums/research/board.md`:

- The first frame or the thumbnail, and what is in it (face, product, text).
- The hook in words.
- How long it has been running (long-running ads are the ones that pay).
- The format: UGC, demo, slideshow, talking head, gameplay.

Then make a contact sheet of the stills for a single look:
`ums video sheet` works on any video; for still screenshots, Ultimate
Frontend Skills' image deep research builds moodboards with the licence of
every image kept.

## What the evidence says about visuals

- Meta and Toluna: ads that show the brand and message in the first five
  seconds were 1.7x more likely to drive strong purchase intent.
- YouTube Test and Compare picks thumbnails by watch-time share, not clicks.
- Controlled evidence on faces, text on thumbnails, colour, and UGC versus
  polished was not found in primary sources. Test it on your own account
  instead of trusting a blog.

## Turning research into a brief

`board.md` ends with three hooks to test, each pointing to the examples that
suggested it, and one thing every competitor does that you will not do.
That brief feeds the storyboard (`video.md`) and the calendar.

## Store art

Steam capsules, App Store screenshots and previews have exact sizes:
`ums specs steam-trailer`, `ums specs appstore-preview`, and `platforms.md`.
