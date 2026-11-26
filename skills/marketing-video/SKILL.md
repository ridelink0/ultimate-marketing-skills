---
name: marketing-video
description: Use when someone wants a short marketing video - a TikTok, Instagram Reel, YouTube Short, app preview, Steam trailer cut, launch clip, devlog clip, product demo or slideshow - made from an idea, a script, screenshots, screen recordings or footage, or wants an existing video reframed, captioned, loudness-fixed or checked against a platform's limits. Builds from a storyboard with ffmpeg, looks at its own contact sheet, and checks every export.
---

# Marketing video

Part of Ultimate Marketing Skills. Read
`../ultimate-marketing-skills/references/video.md` and follow its loop:
one idea, a hook that works muted in the first two seconds, storyboard,
build, contact sheet (open the PNG and look), fix, check, export, queue.

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" video build storyboard.json --out .ums/video/<name>.mp4
node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" video sheet .ums/video/<name>.mp4 --out .ums/video/<name>-sheet.png
node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" video check .ums/video/<name>.mp4 --platform tiktok
```

`${CLAUDE_PLUGIN_ROOT}` is empty in Codex: use the folder holding
`.codex-plugin/`. Without ffmpeg (`ums doctor` says), write the storyboard
and shot list and say the render was not run.

Nothing is posted from here; posting goes through the queue and the
policy in `../ultimate-marketing-skills/references/autonomy.md`. No emoji in
any on-screen text or caption. Business accounts use licensed music only.
