# Welcome email example

A first welcome email for a made-up receipt app, written as a draft and
built with:

```bash
node ../../scripts/ums.mjs email check welcome.md
node ../../scripts/ums.mjs email build welcome.md
```

Result on 2026-11-26: check OK; `welcome.html` 2,467 bytes and `welcome.txt`
written. `render-mobile.png` is that HTML rendered by headless Edge inside a
375 px frame and opened: text wraps inside the width, the button and footer
(address, unsubscribe) are visible. Real email clients (Gmail, Outlook,
Apple Mail) were not tested here; send a test to each before a real campaign.
