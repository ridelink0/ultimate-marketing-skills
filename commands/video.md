---
description: Make a short-form marketing video from an idea, clips or screenshots, checked for each platform
argument-hint: "<idea, script, or clip and image paths> [--platform tiktok|reels|shorts]"
---

Use the `ultimate-marketing-skills` skill for everything below and follow its rule zero:
nothing is published, sent or paid for unless `scripts/policy.mjs` allows it for the
workspace's mode. No emoji anywhere.

The text typed with this command is the request (Claude Code appends it below as
ARGUMENTS; in Codex it is the rest of the message).

`${CLAUDE_PLUGIN_ROOT}` is this plugin's folder. Codex leaves it empty: put the folder
that holds `.codex-plugin/` in its place in every command.

Follow references/video.md exactly:

1. One idea, one hook that works with the sound off in the first two seconds.
2. Write `storyboard.json` next to the media.
3. `node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" video build storyboard.json --out .ums/video/<name>.mp4`
4. `node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" video sheet <mp4> --out .ums/video/<name>-sheet.png` and open the PNG. Fix anything cut
   off, unreadable, or covered by the platform's interface (`node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" video safezone <platform>`).
5. `node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" video check <mp4> --platform <p>` for each target platform; export where needed.
6. Write the caption, run `node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" check --platform <p>`, then `node "${CLAUDE_PLUGIN_ROOT}/scripts/ums.mjs" queue add` with the video.

Nothing is posted by this command.
