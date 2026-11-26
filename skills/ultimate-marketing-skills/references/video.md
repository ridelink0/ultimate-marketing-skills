# Video

Short vertical video is where attention is. UMS makes it from a storyboard
with ffmpeg alone, checks it against each platform, and looks at its own
render before anything is queued.

## The loop (never skip a step)

1. **One idea.** A video says one thing. Write it as a sentence first.
2. **Hook.** The payoff, the result or the problem on screen in the first
   two seconds, readable without sound. Most feeds start muted.
3. **Storyboard** `storyboard.json` (schema below). 15 to 45 seconds for a
   first test; Shorts take up to 3 minutes, Reels 3, TikTok more, but long
   only works once short works.
4. **Build** `ums video build storyboard.json --out .ums/video/<name>.mp4`
5. **Look** `ums video sheet <mp4> --out <png>` and open the PNG. Check the
   first frame works as a still, text is inside the safe area, nothing is
   cut off, captions do not cover the subject. Fix and rebuild.
6. **Check** `ums video check <mp4> --platform tiktok` (and reels, shorts).
7. **Export per platform** `ums video export <mp4> --platform reels --out ...`
   only when a platform needs a different size. Never upload a file carrying
   another app's watermark: Instagram demotes it.
8. **Queue** with the caption: `ums queue add --platform tiktok --media <mp4> --file caption.txt`

## Storyboard schema

```json
{
  "platform": "tiktok",
  "fps": 30,
  "background": "#0c0a03",
  "font": "Arial",
  "fontFile": "fonts/Inter-Bold.ttf",
  "voiceover": "vo.wav",
  "music": "bed.mp3",
  "musicVolume": 0.18,
  "captions": "vo.words.json",
  "captionWords": 3,
  "loudness": -14,
  "style": { "color": "#ffffff", "outline": "#000000", "titleSize": 86, "captionSize": 64, "captionLift": 0.22 },
  "scenes": [
    { "duration": 1.8, "text": "Three taps.\nThat is the whole app." },
    { "duration": 3, "image": "shots/scan.png", "caption": "Point it at the receipt", "zoom": true },
    { "duration": 4, "video": "clips/demo.mp4", "start": 12.5 },
    { "duration": 2, "background": "#f2ede4", "text": "Free on iOS", "align": "top" }
  ]
}
```

- `platform` sets the size from `data/platforms.json`; or give `size: "1080x1920"`.
- Paths are relative to the storyboard file.
- `fit: "contain"` on an `image` or `video` scene keeps the whole picture (icons, logos,
  screenshots) and pads with the scene colour; the default fills the frame and crops.
- Scene sources: `video` (with `start` seconds), `image` (slow push-in
  unless `zoom: false`), or a flat `background` colour.
- `text` is the large centred line (`align: "top"` moves it up); `caption`
  is the lower line. Both sit inside the platform's interface margins.
- `captions` takes an `.srt` file or word timings as JSON (faster-whisper
  with word timestamps, or a plain `[{"word","start","end"}]` list), grouped
  `captionWords` at a time.
- Audio: a voiceover is ducked under the music automatically; everything is
  normalised to -14 LUFS integrated and -1 dBTP. No audio at all still gets a
  silent track, because some uploads reject a video without one.
- `fontFile` is copied next to the job; `font` must then be that file's
  family name.

## Formats that work, by project

| Project | Format | First two seconds |
|---|---|---|
| Game | Gameplay clip, devlog moment, before and after | The mechanic happening, not the logo |
| Mobile app | Screen recording of the result, slideshow of three steps | The result screen |
| SaaS / devtool | Terminal or UI demo with one claim | The output, then how |
| Local business | The thing only you do, filmed on a phone | Hands, food, the fix |
| E-commerce | Product in use, unboxing by a real customer (with permission) | The product doing its job |

Slideshows (TikTok photo mode, Instagram carousels) are cheap and still work
for apps: build each slide as a scene with `text`, export stills with
`ums video frames`, or post the video version.

## Capture

- Phone footage: shoot vertical, 1080x1920, 30 fps, in good light. Keep the
  raw file; `ums video export` handles the rest.
- App and website demos: record the screen (Xcode Simulator, Android
  emulator, OBS, or the browser's own recorder), then use the clip as a
  `video` scene.
- Ultimate Frontend Skills, when installed, renders websites and product
  shots and has a Remotion route for motion-heavy pieces.
- Long video to shorts: cut highlights by timestamp (`video` scenes with
  `start`), one idea per short.

## Sound

Business accounts may only use music they have a licence for: TikTok's
Commercial Music Library for TikTok, YouTube's Audio Library, or tracks you
own or license. Trending sounds on TikTok are not cleared for business use.
Original sound (voice, the product's own noise) is always safe.

## Generated video and voices (GitHub edition only)

AI video models (Veo, Kling, Runway, Luma, Wan) and text-to-speech can fill
gaps, at a price per second, and must be labelled where the platform asks:
TikTok's AI-generated label, YouTube's altered or synthetic content setting,
Meta's AI info. EU AI Act Article 50 transparency duties apply from
2 August 2026. Sora 2's API was shut down on 24 September 2026; do not build
on it. Real product footage beats generated footage for trust; use generation
for backgrounds and transitions, never to fake the product or a customer.
