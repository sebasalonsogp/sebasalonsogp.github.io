---
title: SVD Lens
short: SVD Lens
summary: Rebuilds an image from its most important patterns to show what singular value decomposition keeps.
domain: ml
repo: sebasalonsogp/svd-lens
demoUrl: https://svd-lens.streamlit.app
subsystems: []
tech: [Python, NumPy, Streamlit, Plotly]
brief: >-
  Upload a photo or pick a sample, then drag one slider. The image rebuilds from broad structure
  to fine detail while the spectrum and error metrics explain the change.
log: >-
  NumPy computes the compact SVD of a normalized grayscale matrix and rebuilds rank-k
  approximations. Uploads are capped at 10 MiB and 20 million pixels, resized and processed in
  memory. Grew out of MTH 520; tested in CI with pytest and Ruff.
---
