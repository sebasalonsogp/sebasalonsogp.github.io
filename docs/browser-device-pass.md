# Cross-browser and device pass (Phase 8.3)

Checked 2026-10-22 against the built site. Engines are Playwright's Chromium, Firefox and
WebKit builds on Windows (WebKit is Safari's engine, not Safari); phones are emulated
(viewport, touch, user agent), not real devices.

## Verified

| Check                                      | Chromium | Firefox | WebKit | How                                                                                                                                      |
| ------------------------------------------ | -------- | ------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Full test suite (117 tests in each engine) | pass     | pass    | pass   | `npm test`                                                                                                                               |
| Layout of hero, timeline, skills, contact  | ok       | ok      | ok     | Screenshots at 1440×900 compared by eye. Only difference: the hero heading wraps in four lines in Chromium and Firefox, three in WebKit. |
| Project page at 390×844 with the explorer  | ok       | ok      | n/a    | Playwright's Windows WebKit cannot load the WebM demo (known; see below).                                                                |
| Touch: planet label, back, timeline, stars | ok       | —       | ok     | Emulated Pixel 7 (Chromium) and iPhone 13 (WebKit): every timeline role and a star respond to taps; no horizontal overflow.              |
| Software WebGL                             | ok       | —       | —      | The explorer holds still (as with reduced motion) and the black hole draws one frame; at 4× CPU the page keeps 60 fps (was 26).          |
| No WebGL                                   | ok       | ok (CI) | —      | Readable page, no empty canvas boxes; CI's Linux Firefox has no WebGL at all.                                                            |

## Needs real devices (Sebastian)

- **Safari on macOS and iOS:** the Eigenflow demo is WebM only. Safari's support for WebM in
  `<video>` depends on version; if it does not play, the poster stays and the page works,
  but the demo is lost. Fix if needed: add an MP4 (H.264) source (needs ffmpeg, not
  available here).
- **iOS and Android:** dragging the system (touch) while vertical swipes still scroll the
  page; the lightbox; the copy-email button; the resume download; the phone link.
- **Performance on a mid-range laptop and a mid-range phone:** sky, explorer and black hole
  frame times (this machine has an RTX 2070); the black hole steps its resolution down by
  itself, the explorer has no adaptive resolution.
- **Screen readers** (from 8.1): see `docs/accessibility-audit.md`.
