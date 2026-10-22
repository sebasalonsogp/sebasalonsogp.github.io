# Design spec

The contract for building the approved concept. Visual reference:
`references/concept/orbit-concept-v19.html` (open in a browser; its media lives in the
project repositories listed under "Media"). When implementation needs a value not listed
here, take it from the concept and add it to this file in the same change.

## Principles

- The site is for hiring managers and engineers. Everything readable without operating the
  3D scene; the scene makes it memorable.
- Space is the language, not decoration: planets encode facts about projects; the timeline
  is a spacetime diagram; skills are constellations.
- No explanatory bulk. Plain section headings; help lives in small "How to read this"
  popovers.
- Honest content only. No invented metrics, proficiency bars or demo links. Prototype media
  is labeled as such.

## Color tokens (single dark theme: "twilight sky, warm star")

| Token         | Value     | Use                                         |
| ------------- | --------- | ------------------------------------------- |
| `--void`      | `#030408` | Page background                             |
| `--void-2`    | `#0A0B12` | Panels, cards                               |
| `--ink`       | `#E9EAF0` | Primary text                                |
| `--dim`       | `#9297A8` | Secondary text                              |
| `--faint`     | `#2F3342` | Borders, inactive marks                     |
| `--rule`      | `#161923` | Dividers                                    |
| `--sol`       | `#FFC27A` | Accent: actions, the star, highlights       |
| `--sol-ink`   | `#1B1307` | Text on accent                              |
| `--cold`      | `#B6BEE6` | Secondary accent: college band, "both" ring |
| `--d-backend` | `#C9A27A` | Domain dot: backend & product               |
| `--d-ml`      | `#B9A8D8` | Domain dot: machine learning                |
| `--d-data`    | `#6FA7C4` | Domain dot: data science                    |
| `--d-math`    | `#C7D6E6` | Domain dot: math & scientific computing     |

Measured contrast on `--void`: ink 16.6:1, dim 6.9:1, sol 12.6:1. Never dim text below
4.5:1 (focus/fade states included).

## Typography

| Role    | Face                        | Notes                                                                                    |
| ------- | --------------------------- | ---------------------------------------------------------------------------------------- |
| Display | Newsreader (variable, opsz) | Headings and names. Weight 380–400. Italic + `--sol` only for the hero's closing phrase. |
| Body    | Schibsted Grotesk           | All running text, labels, skill and planet names.                                        |
| Data    | IBM Plex Mono               | Only dates, numbers, code and tiny eyebrow labels.                                       |

Scale: h1 `clamp(2.05rem, 3.7vw, 3.35rem)`, h2 `clamp(1.85rem, 3.2vw, 2.6rem)`, body 1rem,
lede 1.125rem, small 0.875rem, caption 0.75rem. Nothing under 12 px on desktop; on phones
only chart data labels may reach 11 px. `text-wrap: balance` on headings.

Applied in slice 2.3: mono covers dates, years, counts, profile handles, eyebrow labels and
the "Resume · PDF" tag only; skill tags, section facts, captions, the visit panel's back and
previous/next links, status messages and the footer use the body face (the concept used
mono for several of these; the spec wins).

Text over the sky: small dim text (eyebrows, dates, counts) carries `--halo`, a
void-coloured `text-shadow` that darkens the sky only around the glyphs. Measured with the
sky running (text hidden, three frames per view, brightest pixel kept), 1,473 text runs on
home, a project page and 404 at 1440 and 390 px: all ≥ 4.5:1; worst 5.12:1 against a
4 px-blurred 95th-percentile background, 5.69:1 against the mean background.

Fonts are self-hosted Latin subsets (Fontsource files, declared in
`src/components/Fonts.astro`, `font-display: swap`); Newsreader and Schibsted Grotesk
upright are preloaded.

## Spacing, shape and motion tokens

All tokens live in `src/styles/tokens.css`; values taken from the concept.

- Space scale 4, 8, 12, 16, 24, 32, 48 px (`--sp-1`…`--sp-7`). Section padding 96 px
  (72 px on phones), section header gap 36 px, scroll offset 48 px.
- Radii 2 px (tags, inputs), 3 px (cards, resume card), 4 px (landing screen).
- UI motion: fast 0.2 s (hover, color), base 0.4 s (fades), panel 0.6 s with delays 0.75 s
  (panel) and 0.95 s (landing screen), easing `cubic-bezier(.2, .7, .2, 1)`. Reduced motion
  sets all of these to 0 s. Camera timings are listed under "Visit and landing".
- Breakpoints: phones ≤ 760 px; secondary 600, 900 and 1000 px.

## Layout

- Content width 1120 px; side gutter `max(16px, env(safe-area-inset-*))`.
- Section header: `h2` left, short fact or "How to read this" right, rule underneath.
- Section order: Hero (system) → Projects → Experience → Skills → Contact → Footer.
- Nav: name (left); Projects, Experience, Skills, Contact, **Resume** (outlined) right.
  Phones hide the links and keep the name.

## Sky

- Fixed full-viewport 2D canvas behind everything.
- Stars: magnitude-distributed (≈ 1 per 520 px², capped 3,400), colors from blackbody
  temperatures, bright stars (m < 4.1) twinkle via two-frequency scintillation with a slow
  envelope, amplitude stronger toward the bottom (horizon).
- Milky Way band: diagonal, haze strength 0.024 with cool colors `#9AA6CC` / `#B3A8D6`.
- Parallax: horizontal with explorer yaw (±40 px), vertical with scroll (up to 55 px).
- 30 fps cap; paused when hidden; reduced motion draws one static frame with no parallax.
- Implementation (`src/features/sky/`, `src/features/motion/`): seed 7; two canvases, a
  static layer (haze + faint stars) painted once and a star layer where only each bright
  star's square is repainted per frame; parallax moves both with a CSS transform. Sized to
  the large viewport (`100lvh`) so phone toolbars do not regenerate the stars. Measured
  cost: ~1.3–1.6 ms per frame in GPU-rasterized Chromium (~3.1 ms in software rendering);
  script alone ~0.35 ms.

## Hero and explorer

- Copy: eyebrow "Backend · ML systems · Miami"; h1 "I build backends for data and ML
  products, _down to the math._" (draft); lede "Most recently Founding Software Engineer at
  PadStats. Each planet is one of my projects."; CTAs "Take the 60-second tour" (primary),
  "See the list instead".
- Bottom hint: "Drag to turn · Select a world · Esc to return" and "How to read the
  system" popover (Surface, Orbit, Ring, Size, Moons, Belt). Body face per the type rule (the
  Esc part was added with visits in 4.1).
  Hint and popover show only once the explorer has mounted (no WebGL, no JavaScript: hidden).
  The popover is the reusable `HowToRead` component (native `<details>`, Escape and outside
  click close it, one open at a time); on phones the hint row stacks so it opens from the left.
- Encodings: surface = domain; orbit order = most recent commit innermost; size = lines of
  code on a log scale (`0.6 + 0.45·log10(loc/1000)`); ring = live demo; moons = separately
  running subsystems; outer belt = earlier repositories.
- Star label "SEBASTIAN"; planet labels = short name (body 12.5 px) + "Mon YYYY · live"
  (mono, desktop only); labels avoid each other and stay on screen.
- Idle yaw drift 0.012 rad/s; orbital motion slows to stop during a visit.
- Camera (ported from the concept's projection, `src/features/explorer/camera.ts`): focal
  length `min(0.95·H, 1.35·W)` px; explore pose yaw 0.7, pitch 0.4 (phone 0.62), distance
  `max(12, f·10.6 / (0.34·W))` (phone `f·7.9 / (0.47·W)`), system centre at 64% / 56% of the
  hero (phone 50% / 68%) via `setViewOffset`. Phones are < 760 px wide. The fit radius scales
  with the system's outer edge (×1.184 desktop, ×0.883 phone), so more projects zoom out.
- Bodies (`src/features/explorer/system.ts`, `bodies.ts`, `shaders.ts`), from the page's
  embedded project data: orbit `2.3 + 1.15·i` in last-commit order; starting angle
  `2.2 + i·2.39996` (golden angle, ≈ the concept's hand-picked angles); Kepler speed
  `0.32·r^-1.5`; radius `0.17 × size`; surface seed hashed from the project id; rings
  (concept's nine bands) for live demos; one moon per subsystem; 340-grain belt from
  last orbit + 1.2 to + 2.05 (grains ≥ 1 CSS px, since WebGL may drop smaller points). Planet
  surfaces are the concept's noise recipes in GLSL, one program per domain (compile-time
  define), with its lighting curve and domain rim light. Star: sprite, radius
  `max(1.1 units, 26 px)`, halo ×3.4.
- Project pages do not mount the explorer until Phase 4 can frame a visit (the system would
  sit behind the visit panel's text).
- Labels (`labels.ts`, slice 3.3) are HTML over the canvas: planet labels are links to the
  project pages (name 12.5 px body weight 500; "Mon YYYY · live" in mono at 12 px, desktop
  only, instead of the concept's 10.5 px, per the type rule), placed outside the planet,
  flipped to stay on screen and nudged down to avoid each other. "SEBASTIAN" (mono, --sol)
  sits under the star; "Earlier work · 2023–25" (years from the earlier repos) at the front of
  the belt, kept on screen horizontally and hidden within 70 px of the hero's bottom. Small
  label text carries `--halo`. Keyboard order: intro first, then the planet labels.
- Interaction: drag turns the system (0.0055 rad/px; mouse also tilts, 0.004 rad/px, pitch
  0.06–1.15; touch turns only, vertical swipes scroll); a press moving < 5 px is a click;
  hit radius `max(r + 10, 18)` px. Hover, label focus or project-row hover highlights the
  planet: --sol ring at r + 7 px, label and orbit in --sol (orbit 0.5 opacity). Clicking a
  planet opens its project page until Phase 4 adds the in-place visit. Idle yaw drift
  0.012 rad/s (paused while dragging or hovering, off with reduced motion) also turns the sky.

## Visit and landing

- Camera: fly 1.9 s, hop between planets 2.3 s, return 1.5 s, eased; instant for reduced
  motion. Panel fades in after 0.75 s; landing screen after 0.95 s.
- Panel (right on desktop, bottom sheet on phones): domain · month, "← Back to system Esc",
  title, one-liner, tabs "The short version" / "Engineering log", actions ("Land: open the
  live demo ↗" primary + "Source code ↗", or "Read the source ↗"), stack tags,
  previous / count / next.
- With media (desktop): planet moves to the upper left, screen (16:10, rounded 4 px, soft
  shadow) appears bottom-left with caption and dots for multiple items. Click → lightbox
  (arrows, Esc, focus trap). Video: muted loop autoplay; poster only for reduced motion.
  Browser Back / Forward with the lightbox open closes it along with the visit change.
- Tour: Eigenflow → Wine Journal → Quantum Playground, 8.5 s each, progress bar, stops on
  any interaction.
- Tour implemented in 4.4 (`explorer.ts`, `panel.ts`): stops come from each project's
  `tour` position, so content decides the order. Each stop is a 2 s flight allowance plus
  6.5 s of reading (6.5 s total under reduced motion, where the flight is instant). The panel
  shows a tour bar ("Tour · n of N", announced politely; "Stop tour"; a fill bar that
  reduced motion hides). Starting moves focus to "Stop tour"; "Stop tour" keeps the visit
  and focuses the title. The first stop pushes a history entry and later stops replace it,
  so Back leaves the tour in one step. Any other visit, Esc / back, previous / next, a drag
  on the scene, a tab, the landing dots or the lightbox stops it. After the last stop it
  returns to the system and focuses the tour button.
- Implemented in 4.1 (`explorer.ts`, `panel.ts`, `camera.ts`): modes explore → flying →
  visit → returning (hero `data-mode`); transitions start from wherever the camera is, so
  they can be interrupted; hop when moving between planets. Visit pose (concept): planet at
  33% / 50% (phone 50% / 26%), on-screen radius `min(0.27·H, 0.2·W)` (phone
  `min(0.19·H, 0.34·W)`), pitch 0.14, yaw chosen so the planet is side-lit. Orbital motion
  eases to a stop during visits (rate 3/s); other orbits dim to 0.12 and the belt to 0.25;
  the visited orbit is --sol. Intro, hint and labels step aside; labels come back as the
  return starts, so focus returns at once to whatever opened the visit (label, row link or
  the page). Planet clicks, labels and project rows open the visit in place; modified clicks
  (new tab) keep the link. Until 4.3 the URL does not change. Drag still turns the camera
  around a visited planet (no tilt). The panel is an `<aside>`, inert when closed; tabs
  are an ARIA tablist with arrow keys. Not ported: the concept's slower spin for the visited
  planet.
- Landing (4.2, `landing.ts`): with media on desktop the visit pose becomes planet at
  27% / 27%, radius `min(0.15·H, 0.11·W)`; the screen (`.landing`, `min(42vw, 580px)`,
  bottom 56 px, left at the content edge) fades in after 0.95 s with caption (body face) and
  dots for several items; "Expand ⤢" on hover. Phones put the preview in the panel above the
  tabs. Media is rendered only into the visible container (one video at a time). Images are
  responsive WebP from `getImage` (480–1600 w); video is muted, looping and plays inline,
  poster only with reduced motion. The lightbox is a native modal `<dialog>` (focus stays
  inside, page inert, scroll locked), Close / arrows / ← → keys; Escape closes it before
  leaving the visit; focus returns to the screen.
- Routes (4.3): see `docs/architecture.md`, "Page and route model".

## Project pages (readable visit)

`/projects/<id>/` is the full page with the visit open in the hero: domain · month and
"← Back to system" (link to `/`), title (`h1`), one-liner, media, "The short version" and
"Engineering log" one after the other (tabs arrive with JavaScript in Phase 4.1), actions,
stack tags linking to skills, and "← Previous / n of N / Next world →" (wraps). Desktop:
media column left, panel right (26 rem); ≤ 900 px: one column, media after the one-liner.
Media is static for now: every item shown with its caption, video with controls and poster
(autoplay, dots and lightbox in Phase 4.2). The first image loads eagerly. Project rows on
the home page link here; the whole row is the target and the open project is highlighted.

## Projects list

Rows (each links to its project page): month · name (display) · domain dot + label · one-liner · status ("Live demo" in
accent or "In development"). Section fact: "5 solo builds · 4 live demos". "Earlier work"
links to older repositories with years. Phones stack: date + status, name, domain,
one-liner.

## Experience timeline

- Time left → right (2022 → now); lanes Research, Data science, Engineering, Leadership.
- Role = horizontal bar for its duration; PadStats roles in `--sol`, others `--ink`.
  Labels: title above (body 14 px), short org/date below (mono 11.5 px).
- College band (`--cold` at 5.5%) to May 2025, two-line caption, selectable for degree
  details. Graduation dashed line. "NOW" line, dotted connector, light cone opening right,
  "Open to backend and ML-platform roles".
- Details below: lane, title, org · place, dates · duration, note, bullets, skill tags
  (link to constellation), optional link.
- Playback: "Play the timeline" → cursor eases between role starts (900–2,600 ms), roles
  draw and fade in as reached, riding dots on active roles, 4.6 s dwell, reveal now/cone,
  "Play again". Stop on click, Stop button or Esc.
- Implemented in 5.1 (`src/features/timeline/layout.ts`, `ExperienceTimeline.astro`): the
  SVG is drawn at build time above the readable list, in the concept's 960-unit viewBox.
  Time runs from a quarter before the first role to the build month ("now"), scaled so the
  cone ends at the lanes' right edge (150 units per year with today's data, as in the
  concept). Lanes keep the taxonomy order; a role that overlaps another in its lane (more
  than a shared month, or into its labels) gets an extra row below, and the chart grows.
  Now sits on the row of the role that ended last (an ongoing role ends at now); the dotted
  connector runs from that role's end. The cone stays below the axis; when there is no room
  above it, its title moves below with the availability text (`site.availability`, split
  into two lines). The SVG is never drawn narrower than its viewBox, so data labels are
  ≥ 12.8 px at 1440 px and 11 px minimum on phones, where the frame scrolls sideways (with
  "Swipe the timeline sideways →" below 992 px). Small text carries a void stroke halo
  (`paint-order: stroke`). Without JavaScript the SVG is one `role="img"` with a generated
  description and the scrolling frame is a focusable region.
- Selection, implemented in 5.2 (`src/features/timeline/selection.ts`): roles and the
  college band become buttons (`aria-pressed`, `aria-controls` the list entry); the SVG
  becomes a `group` and the frame stops being a tab stop. The details below the chart are
  the readable list itself: only the selected entry shows (fading up 6 px over 380 ms,
  instant with reduced motion), so there is one copy of the content and no-JS visitors still
  get every entry. Starts on the role that ended last. Mouse hover and keyboard focus preview
  roles; click, tap, Enter or Space select; the band responds to click and focus only (it
  spans all of college, so hover would keep stealing the view). Tab order: band, then roles
  by start. Selected bar 7 px, other roles at 0.86 opacity, band fill 10 %; focus shows a
  dashed `--sol` outline round the role's hit area (labels included). A `#role-…` or
  `#education-…` link selects that entry and scrolls to the chart. Each button's name starts
  with its visible label and sublabel (one `<text>` with two `<tspan>` lines, so the visible
  text reads as two phrases; WCAG 2.5.3), then the full title, organization and dates.
  Skill tags link to `#skill-…`. "How to read this" sits in the section header (Lanes,
  Lines, Band, Cone; `Section` gained an `aside` slot).
- Playback, implemented in 5.3 (`src/features/timeline/playback.ts`): the controls row
  (shown only with JavaScript) sits above the chart; while playing the button reads "Stop"
  and a bar shows "Role n of N" (announced politely) with a 2 px fill over each 4.6 s dwell,
  hidden under reduced motion. The cursor (line, tag, "MON YYYY" label that flips left past
  x 840) starts 0.3 years before the first role and eases (sine in-out) to each role start,
  1.5 s per year clamped to 0.9–2.6 s, instant with reduced motion. Roles not yet reached
  fade to 0.07; bars draw up to the cursor with a `--sol` dot riding each live one; the now
  marker and cone fade out and return at the end. The readout opens with a "Timeline · From
  YYYY to now" panel and closes with a "Now" panel (`site.availability`, `site.location`;
  both are hidden entries in the HTML), then the button reads "Play again". If the controls
  are off screen or low, playback first scrolls them to the top, so controls, chart and
  details stay on one screen at 1440×900. Hover and focus previews pause while it runs.
  Stop, Esc, selecting a role or the band, a `#role-…` link, or scrolling the chart out of
  view stops it (bars return to full length, the current details stay). Phones keep the
  cursor at 55 % of the frame.

## Skills constellation

- 35 skills, groups: Machine learning, Backend & web, Scientific Python, Data, Cloud,
  Leadership; Python as the central bright star.
- Star size `2.6 + 2.3·√count`; filled = projects, hollow = roles, cold ring = both;
  skills used 3+ times are bold.
- Resting state: ≤ 30 group lines (shortest tree per group), all labels readable, overview
  panel ("35 skills", groups and sources, "Most used" list).
- Select: star turns `--sol`, co-used skills stay bright, others fade to 24%; panel lists
  projects and roles with links; "Clear ×" or empty-sky click returns to overview. Filter
  All / Projects / Experience.
- Implemented in 6.1 (`src/features/constellation/layout.ts`, `Constellation.astro`): drawn
  at build time in the concept's 900 × 580 viewBox from the skills the content uses. Each
  group's `anchor` lives in `src/data/skill-groups.ts` (Python's in `coreAnchor`); members
  spiral out from it most used first (46 units per √index, golden angle, stretched 1.25 ×
  0.85), then star-plus-label boxes are pushed apart vertically until none overlap, inside
  x 30–860, y 40–566. Labels flip left from x 760. Lines: Prim's shortest tree per group
  (28 today). Group names centre above their stars. Labels are 14 units (group names mono
  with 0.16em tracking, raised from the concept's 11 so they also clear 12 px), with a void
  stroke halo; the SVG never draws narrower than 772 px, so every label is ≥ 12 px. The
  chart sits beside the overview (2.6 : 1) from 1180 px and stacks above it below that;
  under 804 px it scrolls with "Swipe the constellation sideways →". The overview is static
  HTML (count, groups and sources, "Most used" top six with filled / hollow icons), so it
  reads without JavaScript.
- Selection, implemented in 6.2 (`src/features/constellation/selection.ts`, data embedded as
  JSON at build time): stars become buttons (name starts with the skill; `aria-pressed`,
  `aria-controls` the panel); each has a hit area over star and label, a dashed `--sol`
  focus outline and a 12 % halo on hover. Selecting (click, tap, Enter, or keyboard focus)
  turns the star `--sol` with a 22 % halo, keeps co-used skills (same project stack or role
  skill tags) bright and fades the rest to 24 %; lines drop to 14 % and group names to 45 %.
  The panel shows "Selected skill", "Clear ×", the name, "n projects · m roles · used with
  k skills", then Projects (domain-coloured dot; links carry `data-visit`, which the
  explorer opens in place, falling back to the project page) and Experience (hollow dot;
  `#role-…` links that select the role in the timeline). "Most used" entries become buttons.
  Clear, Escape on a star or a click on empty sky returns to the overview. The filter (All /
  Projects / Experience, `aria-pressed`, shown only with JavaScript) dims other stars to
  12 % and their lines, takes them out of the tab order, recounts the overview and drops a
  selection it hides. Skill tags in the timeline (`#skill-…` links) select their star and
  bring the chart into view, also when the same tag is followed twice. The header carries
  "How to read this" (Stars, Lines, Filled, Hollow, Ringed, Select) in place of the count,
  which the overview states. The readable skill list stays visible below the chart.

## Readable equivalents (no graphics)

The timeline and constellation enhance these lists, which are always in the HTML:

- Experience: roles newest first, each with lane (eyebrow), title, org · place, dates ·
  duration, note, bullets, skill chips linking to `#skill-<name>`, and the optional link;
  then the education entry (school, place · honors · GPA, degrees, minor, coursework).
  With JavaScript the timeline shows one entry at a time as its details (5.2).
- Skills: Python under "Core", then each group's skills, most used first, with the use
  count (screen readers hear "used in N projects and M roles"); 3+ uses are bold. The
  counts ("35 skills", "6 groups · from 5 projects and 7 roles") are in the constellation's
  static overview; the header carries its key (6.2).
- Hero: "Take the 60-second tour" (primary) shows only once the explorer mounts and only
  if some project has a `tour` position; "See the list instead" always shows.

## Contact

- Header "Contact" + "Open to backend and ML-platform roles".
- Email (display size) + "Copy email" + "Open in mail app"; Phone; Location; resume card
  "Download my resume" (accent border); LinkedIn and GitHub rows.
- Black hole: ray-traced Schwarzschild lensing, thin disk from r = 3 to 8.8 (Rs = 1),
  Doppler-brightened, slow differential rotation, amber palette. Desktop: backdrop to the
  right, ~82 vw wide, faded under the left column. Phone: banner above the heading.
  Caption "Ray-traced live in your browser".

## 404

"This page fell past the event horizon." with the black hole and a link back to the system.

## Motion and accessibility rules

- All loops pause off-screen and in hidden tabs; ambient loops ≤ 30 fps.
- Reduced motion: static sky, no idle drift, instant camera, poster instead of video,
  single black-hole frame, timeline playback jumps between roles.
- Keyboard: every planet, role, star, tab, dot and popover reachable; visible `--sol` focus
  ring; Esc closes lightbox, then visit, then playback.
- Semantic HTML holds all text; canvases are `aria-hidden` with HTML equivalents.

## Media

| Project               | Media                                                                 | Source in its repository             |
| --------------------- | --------------------------------------------------------------------- | ------------------------------------ |
| Eigenflow             | Demo video, bottleneck experiment, Fiedler partition                  | `docs/media/`                        |
| Exoplanet Transit Lab | Dashboard screenshot                                                  | `docs/assets/dashboard-preview.png`  |
| Quantum Playground    | App screenshot                                                        | `assets/quantum-playground-demo.png` |
| Wine Journal          | Prototype screen (label as prototype) — replace with real screenshots | `design/prototype-v3/checks/`        |
| SVD Lens              | None yet — needs a screenshot or clip                                 | —                                    |
