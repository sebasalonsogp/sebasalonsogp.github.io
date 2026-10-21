---
title: Exoplanet Transit Lab
short: Exoplanets
summary: Finds the periodic dip a passing planet leaves in NASA TESS telescope data.
domain: data
repo: sebasalonsogp/exoplanet-transit-detection
demoUrl: https://exoplanet-transit-lab-nbwmcaxjydlejrmnvwzaug.streamlit.app/
subsystems: []
tech: [Python, NumPy, SciPy, Astropy, Streamlit, Plotly]
brief: >-
  Follows one TESS observation from raw signal to a detected orbit. The strongest candidate has
  a period of 1.76299 days, about 0.9 minutes from NASA’s published value for KOI-13 b.
log: >-
  18,420 two-minute measurements from TESS Sector 14 are normalized and detrended, then Fourier,
  SVD-assisted Fourier and Box Least Squares searches are compared and the top candidates
  phase-folded. Began as an MTH 520 mini-project; checked with pytest, Ruff and mypy in CI.
media:
  - type: image
    src: exoplanet-dashboard.jpg
    alt: >-
      Transit Lab dashboard: target KOI-13 b, 18,420 observations and a best BLS period of
      1.76299 days, above the raw TESS light curve with its periodic dips.
    caption: The live dashboard
---
