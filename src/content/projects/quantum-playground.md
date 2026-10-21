---
title: Quantum Playground
short: Quantum
summary: Shows how a potential-energy landscape sets a particle’s energy levels and tunneling.
domain: math
repo: sebasalonsogp/Quantum-Playground
demoUrl: https://quantum-playground-app.streamlit.app
subsystems: []
tech: [Python, NumPy, SciPy, Streamlit, Plotly]
brief: >-
  Pick a quantum system, change one parameter and watch energy levels, wavefunctions and
  probabilities respond. In the double well you can scrub a particle tunneling from one side to
  the other.
log: >-
  Sparse finite-difference Hamiltonians solved with SciPy’s shift-invert eigensolver. Results
  are checked against exact answers, with residual, normalization and orthogonality diagnostics
  and measured second-order convergence. Solver medians are 1.9–6.4 ms.
media:
  - type: image
    src: quantum-app.jpg
    alt: >-
      Quantum Playground's infinite square well experiment: sliders for well width and grid
      resolution, and live results for the selected energy, analytic error and solve time.
    caption: The live app
tour: 3
---
