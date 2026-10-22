# Release candidate (Phase 8 checkpoint)

Candidate: `main` at `ae65c9f`, live at https://sebasalonsogp.github.io/ (still `noindex`).
Prepared 2026-10-22. Phase 8.6 (analytics) was skipped by Sebastian.

## What is in it

Every planned feature through Phase 8: the twinkling sky; the solar-system explorer with
visits, landing previews, the lightbox, shareable project URLs and the 60-second tour; the
project list; the experience timeline with selection and playback; the skills
constellation with filter and cross-links; contact with copy-email, the resume download and
the ray-traced black hole; the 404; search and sharing metadata, sitemap, robots.txt, icons
and a sharing card per page; the weekly GitHub-data refresh. Without WebGL, JavaScript or
motion the site stays complete and readable.

## What every push checks (CI, then deploy only when green)

| Gate                                              | Now                                                                                                                          |
| ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Format, types, build                              | `npm run verify`: 0 errors, 0 warnings, 0 hints                                                                              |
| Dependency audit                                  | `npm audit --audit-level=high`: clean                                                                                        |
| Size budgets                                      | initial JS 9.6 / 60 KB gzip; explorer 140 / 200 KB gzip; heaviest visit 1.52 / 2 MB                                          |
| Browser tests                                     | 122 Playwright tests in Chromium, Firefox and WebKit (363 pass, 3 skip), with axe WCAG 2.2 AA, target-size and journey tests |
| Lighthouse (mobile, slow 4G, 4× CPU, median of 3) | home LCP 0.83 s, CLS 0.003; Eigenflow LCP 2.10 s, CLS 0 (budgets 2.5 s / 0.1)                                                |

CI runs in the Playwright container (no apt mirror). Records: `docs/accessibility-audit.md`,
`docs/browser-device-pass.md`, `docs/handoff.md`.

## Manual checks before launch (Sebastian)

Tick these on real hardware; anything that fails becomes a fix before Phase 9.

### Screen readers (from 8.1)

- [ ] **NVDA + Firefox or Chrome (Windows):** landmarks and headings make sense; the hero
      tour button and "How to read the system" popover; open a visit (focus lands on its
      title), switch tabs, open and close the lightbox, go back (focus returns).
- [ ] **VoiceOver + Safari (macOS and iOS):** the same path; timeline roles announce as
      pressed buttons and their details follow; constellation filter, a star, panel links.
- [ ] Contact: "Copy email" announces "Copied"; the resume card reads as a download.

### Devices and browsers (from 8.3)

- [ ] **Safari (macOS) and iOS Safari:** the Eigenflow demo video plays (it is WebM only;
      if it does not, the poster shows and an MP4 copy is needed).
- [ ] **iPhone and an Android phone:** drag the solar system sideways while vertical swipes
      still scroll the page; tap a planet, the lightbox, back; play the timeline; tap stars;
      copy email; download the resume; the phone link dials.
- [ ] **A mid-range laptop and phone:** the sky, explorer and black hole feel smooth (the
      black hole lowers its resolution or freezes on its own; the explorer has no adaptive
      resolution yet).
- [ ] **Sharing:** paste the home URL and a project URL into LinkedIn's Post Inspector and a
      chat app; the card, title and description appear (`noindex` does not block previews).

### Settings

- [ ] GitHub repository → Settings → Actions → General → "Allow GitHub Actions to create
      and approve pull requests", so the weekly data refresh can open its PR (otherwise it
      pushes `data/github-refresh` and links to open the PR by hand).

## Decisions for Phase 9 (9.1 content review)

- [x] **Pitch:** the hero line is still the draft ("I build backends for data and ML
      products, down to the math.").
      **Decided:** keep the draft (2026-10-22).
- [x] **PadStats title:** LinkedIn says "Software Engineer"; the site and resume say
      "Founding Software Engineer" (resume: "… – Cloud & ML Systems"). Align one way.
      **Decided:** keep "Founding Software Engineer" on the site; Sebastian updates LinkedIn.
- [x] **Phone number:** shown today (also in the resume and the public repository); keep?
      **Decided:** keep it shown.
- [ ] **Screenshots:** SVD Lens has none; Wine Journal shows the design prototype, labelled
      as such. Real captures when available.
- [ ] **Eigenflow demo description:** the 14-second recording is silent (checked), so it needs
      no captions, but WCAG 1.2.1 asks for a short text description of what it shows; today
      the caption is only "Demo recording". One sentence.
- [x] **Headline font:** kept the optical-size Newsreader; the lighter weight-only files would
      improve PageSpeed Insights' simulated mobile LCP (~3.2 → ~2.4 s) but draw the hero wider.
      **Decided:** keep the optical-size Newsreader.
- [ ] **Streamlit demos sleep** when idle (Quantum Playground showed the wake-up screen); a
      note by the demo buttons, or a keep-alive, is optional.
- [ ] **Custom domain** (optional) and the release tag `v1.0.0`.

## Known limitations (accepted unless a check above says otherwise)

- With no JavaScript, Eigenflow's project page stacks its three media items before the text
  on phones (with JavaScript the visit shows one preview at a time).
- CI's Lighthouse TBT is ~0.7 s on its GPU-less runner (not budgeted; ~0.2–0.8 s with a GPU).
- Playwright's Windows WebKit cannot load the WebM demo, so the Eigenflow page is not tested
  in WebKit with the explorer; covered by the Safari check above.
