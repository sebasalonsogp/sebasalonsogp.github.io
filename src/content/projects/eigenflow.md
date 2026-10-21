---
title: Eigenflow
short: Eigenflow
summary: Shows how one weak link in a network slows everything down, using the graph Laplacian.
domain: ml
repo: sebasalonsogp/eigenflow
demoUrl: https://eigenflow-8tdq.onrender.com
subsystems: [FastAPI numerical API, React + D3 client]
tech: [Python, FastAPI, NumPy, React, TypeScript, D3, Docker]
brief: >-
  Inject heat into a network and watch it spread. Weaken the single bridge between two
  communities and the spread stalls, and the spectrum explains why. It makes a piece of linear
  algebra visible and testable in seconds.
log: >-
  FastAPI and NumPy build L = D − A, eigendecompose it and sample the diffusion solution; React
  and D3 interpolate those samples locally, so playback never calls the API per frame. 57
  backend tests at 99% line coverage, 77 frontend tests, Playwright on desktop and mobile, one
  non-root Docker image.
media:
  - { type: video, src: eigenflow-demo.webm, poster: eigenflow-poster.jpg, caption: Demo recording }
  - type: image
    src: eigenflow-experiment.jpg
    alt: >-
      Eigenflow's bottleneck experiment: two four-node clusters joined by one weak bridge, with
      heat injected into the left cluster and sliders for bridge strength and simulation time.
    caption: The bottleneck experiment
  - type: image
    src: eigenflow-fiedler.jpg
    alt: >-
      Eigenflow's Fiedler partition view: the two clusters split into negative and positive
      groups, 9.2% of the heat across the bridge, and the Laplacian spectrum with algebraic
      connectivity 0.048.
    caption: Fiedler partition and spectrum
    fit: contain
tour: 1
---
