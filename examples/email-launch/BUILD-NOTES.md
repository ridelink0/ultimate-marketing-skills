# Launch email example (version 2 builder)

A game-launch email for a made-up indie game, editorial theme, with a logo,
a hero image, an image-beside-text section, a card and a divider. The images
are placeholders made with ffmpeg so the example needs no downloads.

```bash
node ../../scripts/ums.mjs email build launch.md
```

Result on 2026-11-26: check OK with three warnings, one per local image
("host it at https before sending"), which is correct for a preview.
`launch.html` is 5,327 bytes. `render-light.png` and `render-dark.png` are
headless Edge renders at 375 px and 680 px in light and dark colour schemes,
opened and checked: the split section stacks on the phone width and sits side
by side on desktop; dark mode swaps paper, surface and text colours.

Not tested here: Gmail, Outlook and Apple Mail themselves. Send a test to each
before a real campaign; Gmail applies its own dark-mode inversion.
