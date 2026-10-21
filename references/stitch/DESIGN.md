---
name: Deep Space Observatory
colors:
  surface: '#0C0E14'
  surface-dim: '#131316'
  surface-bright: '#39393c'
  surface-container-lowest: '#0e0e11'
  surface-container-low: '#1c1b1e'
  surface-container: '#201f22'
  surface-container-high: '#2a2a2d'
  surface-container-highest: '#353438'
  on-surface: '#e5e1e5'
  on-surface-variant: '#c7c5d5'
  inverse-surface: '#e5e1e5'
  inverse-on-surface: '#313033'
  outline: '#918f9e'
  outline-variant: '#464553'
  surface-tint: '#c1c1ff'
  primary: '#c1c1ff'
  on-primary: '#1e1990'
  primary-container: '#8b8cff'
  on-primary-container: '#1e1991'
  inverse-primary: '#5050c0'
  secondary: '#c2c6d3'
  on-secondary: '#2b313a'
  secondary-container: '#444954'
  on-secondary-container: '#b3b8c5'
  tertiary: '#c2c4e4'
  on-tertiary: '#2b2f48'
  tertiary-container: '#9496b5'
  on-tertiary-container: '#2c2f48'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c1c1ff'
  on-primary-fixed: '#0a006b'
  on-primary-fixed-variant: '#3736a7'
  secondary-fixed: '#dee2ef'
  secondary-fixed-dim: '#c2c6d3'
  on-secondary-fixed: '#161c25'
  on-secondary-fixed-variant: '#424751'
  tertiary-fixed: '#dfe0ff'
  tertiary-fixed-dim: '#c2c4e4'
  on-tertiary-fixed: '#161a32'
  on-tertiary-fixed-variant: '#42455f'
  background: '#131316'
  on-background: '#e5e1e5'
  surface-variant: '#353438'
  surface-subtle: '#090A10'
  surface-deep: '#07080C'
  border-subtle: '#1C202A'
  text-primary: '#F1F3F5'
  accent-soft: rgba(139, 140, 255, 0.15)
  accent-glow: rgba(139, 140, 255, 0.08)
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 48px
    fontWeight: '500'
    lineHeight: 56px
    letterSpacing: -0.03em
  headline-xl-mobile:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 32px
    fontWeight: '500'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 24px
    fontWeight: '500'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Geist
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Geist
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 20px
  label-mono:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
    letterSpacing: 0.04em
  label-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
    letterSpacing: 0.06em
  telemetry-tag:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 12px
    letterSpacing: 0.08em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.5rem
  gutter-mobile: 1rem
  margin: 4rem
  margin-mobile: 1.25rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
  space-2xl: 4rem
  space-3xl: 6rem
---

Personal Portfolio — Design Specification
1. Design Vision
The portfolio should feel like entering a quiet, expansive observatory in deep space.
The overall aesthetic is:
Dark. Minimal. Technical. Cinematic. Precise.
Space is not decoration layered on top of the interface. It is the visual language used to organize information:
Stars represent points of interest.
Orbits represent relationships.
Planets represent projects.
Spacetime events represent career milestones.
Distant celestial objects create depth without competing with content.
The website should immediately communicate:
Software engineer with strong technical depth, mathematical curiosity, and an interest in building complex systems.
It should feel sophisticated enough for recruiters and engineers while still having enough personality to be memorable.
The experience should never feel like a video game, sci-fi dashboard, or Marvel fan site.
The interface remains fundamentally clean and familiar.

2. Core Design Principles
2.1 Content First
Every visual effect exists to reinforce content.
2.2 Depth Without Clutter
Foreground: UI, Typography, Project info, Navigation.
Midground: Orbits, Timeline/worldline, Interactive planets.
Background: Sparse stars, Nebula haze, Galaxy fragments.
Deep Background: Nearly black space.
2.3 Scientific Rather Than Sci-Fi
NASA visualization + Apple minimalism + cinematic cosmology. Avoid spaceship HUDs, neon glows, techno fonts.

3. Site Architecture
Home -> Experience, Projects, About, Logs (Writing/Field Notes). Persistent clean navigation.

4. Global Visual Language & Palette
Base background: #050507, #07080C, #090A10.
Surface: #0C0E14
Primary Text: #F1F3F5
Secondary Text: #9297A3
Border: #1C202A
Accent: #8B8CFF (restrained cosmic indigo/stellar blue/violet)
Accent Soft: rgba(139, 140, 255, 0.15)

16. Typography
Primary: Clean grotesk / geometric sans-serif (Inter, Geist, Suisse-style grotesk, IBM Plex Sans).
Monospace: Sparingly for dates, metadata, coordinates, event IDs (e.g. EVENT_004, 2026.05).

18. UI Surfaces
Open layouts, thin 1px low-opacity borders (#1C202A), subtle radiuses, minimal card usage, large whitespace rhythm.

19. Motion & Restraint
Quiet, slow celestial mechanics, restrained glows, accessible high contrast.
