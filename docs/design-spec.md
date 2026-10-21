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
- 30 fps cap; paused when hidden; reduced motion draws one static frame.

## Hero and explorer

- Copy: eyebrow "Backend · ML systems · Miami"; h1 "I build backends for data and ML
  products, _down to the math._" (draft); lede "Most recently Founding Software Engineer at
  PadStats. Each planet is one of my projects."; CTAs "Take the 60-second tour" (primary),
  "See the list instead".
- Bottom hint: "Drag to turn · Select a world · Esc to return" and "How to read the
  system" popover (Surface, Orbit, Ring, Size, Moons, Belt).
- Encodings: surface = domain; orbit order = most recent commit innermost; size = lines of
  code on a log scale (`0.6 + 0.45·log10(loc/1000)`); ring = live demo; moons = separately
  running subsystems; outer belt = earlier repositories.
- Star label "SEBASTIAN"; planet labels = short name (body 12.5 px) + "Mon YYYY · live"
  (mono, desktop only); labels avoid each other and stay on screen.
- Idle yaw drift 0.012 rad/s; orbital motion slows to stop during a visit.

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
- Tour: Eigenflow → Wine Journal → Quantum Playground, 8.5 s each, progress bar, stops on
  any interaction.

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

## Readable equivalents (no graphics)

The timeline and constellation enhance these lists, which are always in the HTML:

- Experience: roles newest first, each with lane (eyebrow), title, org · place, dates ·
  duration, note, bullets, skill chips linking to `#skill-<name>`, and the optional link;
  then the education entry (school, place · honors · GPA, degrees, minor, coursework).
- Skills: Python under "Core", then each group's skills, most used first, with the use
  count (screen readers hear "used in N projects and M roles"); 3+ uses are bold. Header
  fact "35 skills from 5 projects and 7 roles" (derived).
- Hero: the tour button arrives with the tour (Phase 4.4); until then only "See the list
  instead" shows. The footer's star-colors note arrives with the sky (Phase 2.1).

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
