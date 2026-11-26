# Field test: RideLink (draft mode)

Run 2026-11-26 on Windows 11, Node 22.21, ffmpeg 9.0.1. The RideLink app
repository was only read, never written: the whole test lives in its own
repository, `ums-field-ridelink`, with UMS in `draft` mode so nothing could
leave the machine.

## What was run

1. `ums init --name RideLink --type mobile-app --mode draft`; the brief was
   written from RideLink's own docs (live group map for rideouts, rider
   reports that expire after 30 minutes).
2. `ums advise --type mobile-app --stage launch --hours 6 --budget 0`:
   native vertical video first, then the store page, then owned slideshow
   accounts; paid UGC listed as "later" for want of budget.
3. An X post and a TikTok caption, both through `ums check`: no errors.
4. A four-scene storyboard built, checked for TikTok and Reels (both OK at
   1080x1920, 8.0 s), contact sheet and a frame opened and looked at.
5. Both posts queued; the TikTok item approved; `ums run --dry-run` held it.

## What it found, and what changed in UMS

- **A square app icon was cropped** to fill the 9:16 frame and the rider was
  cut off. Added `fit: "contain"` for scenes (pads with the scene colour);
  regression test in `test/video.test.mjs`.
- **A held item gave the wrong reason.** In draft mode an approved item was
  reported as needing an item approval; the real block is the mode. It now
  reports `mode-change`.
- **The brief needed a "never say" line** for this product: rider reports
  include police checkpoints, so no copy may present the app as a way to
  avoid police. The brief template already has that section; the test used it.

Nothing was published, no account was touched, and RideLink's repository is
unchanged.
