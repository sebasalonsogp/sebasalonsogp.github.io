---
title: Wine Journal
short: Wine Journal
summary: A private journal for the wines you try, with ratings, notes, photos and occasions.
domain: backend
repo: sebasalonsogp/wine-journal
subsystems: [Next.js web app, FastAPI API, Media worker]
tech: [Python, FastAPI, PostgreSQL, Supabase, Next.js, TypeScript]
brief: >-
  Record a wine and a date in seconds, then come back to add notes, a rating, photos or a whole
  occasion. Sign-in, search, rating history, private photo albums and draft recovery all work
  end to end against a real database. It isn’t hosted publicly yet.
log: >-
  A Next.js web app over a FastAPI modular monolith and Supabase Postgres. Media processing runs
  in a separate worker that pulls durable jobs from Postgres. Saves retry without creating
  duplicates, stale edits are flagged for review, and browser tests run real sign-in journeys.
media:
  - type: image
    src: wine-prototype.jpg
    alt: >-
      Wine Journal design prototype: the My wines page with search, type and sort filters
      above cards for sample wines.
    caption: Design prototype with sample data, not the running app
tour: 2
---
