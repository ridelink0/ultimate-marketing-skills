# Text-hook example

A 7.6-second vertical text video for a made-up receipt app, the cheapest
format that still works for apps: the problem, the change, the proof, the
next step. No footage needed.

Built and checked on 2026-11-25 (Windows 11, ffmpeg 9.0.1, Node 22.21):

```bash
node ../../scripts/ums.mjs video build storyboard.json --out example.mp4
node ../../scripts/ums.mjs video check example.mp4 --platform tiktok
node ../../scripts/ums.mjs video sheet example.mp4 --out contact-sheet.png --cols 4 --rows 2
```

Result: 1080x1920, 7.60 s, 30 fps, H.264 with a silent AAC track, "OK for
tiktok". `contact-sheet.png` is that render, opened and checked: every line
sits inside the margins and the lower captions clear the platform's
caption and button area.

The rendered MP4 is not committed; build it with the first command.
