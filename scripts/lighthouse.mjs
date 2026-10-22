// Lighthouse budgets (tasks/plan.md, Phase 8.2): on Lighthouse's mobile profile (slow 4G,
// 4× CPU slowdown) the median of three runs per page must keep LCP ≤ 2.5 s and CLS ≤ 0.1.
// Throttling is applied during the run ("devtools") rather than simulated afterwards: an
// unthrottled local load lets the explorer take over a project page before its first paint,
// so the simulation times the wrong element (an explorer label instead of the visit). Serves dist/ with `astro preview` and drives Playwright's
// Chromium, so CI needs no separate Chrome. Run after `astro build`; writes a summary to
// .lighthouse/ and exits non-zero when a budget is exceeded.
//
// The `lighthouse` package is used directly: @lhci/cli would add 11 high-severity
// advisories to `npm audit`, which CI enforces.

import { spawn } from 'node:child_process';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { setTimeout as sleep } from 'node:timers/promises';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { chromium } from 'playwright';

const PORT = 4323;
const PAGES = ['/', '/projects/eigenflow/'];
const RUNS = 3;
const BUDGETS = { lcp: 2500, cls: 0.1 };

// Astro's CLI through Node itself (no shell), so killing it stops the server everywhere.
const server = spawn(
  process.execPath,
  ['node_modules/astro/bin/astro.mjs', 'preview', '--port', String(PORT), '--host', '127.0.0.1'],
  { stdio: 'ignore' },
);
const base = `http://127.0.0.1:${PORT}`;
for (let i = 0; i < 60; i++) {
  try {
    if ((await fetch(base)).ok) break;
  } catch {
    // Not up yet.
  }
  await sleep(500);
}

const chrome = await launch({
  chromePath: chromium.executablePath(),
  chromeFlags: ['--headless=new', '--no-sandbox', '--disable-dev-shm-usage'],
});
const median = (values) => [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
const summary = [];
let failed = false;
try {
  for (const path of PAGES) {
    const runs = [];
    for (let i = 0; i < RUNS; i++) {
      const result = await lighthouse(`${base}${path}`, {
        port: chrome.port,
        output: 'json',
        logLevel: 'error',
        onlyCategories: ['performance'],
        throttlingMethod: 'devtools',
      });
      const audits = result.lhr.audits;
      runs.push({
        lcp: audits['largest-contentful-paint'].numericValue,
        cls: audits['cumulative-layout-shift'].numericValue,
        tbt: audits['total-blocking-time'].numericValue,
        score: result.lhr.categories.performance.score,
      });
    }
    const page = {
      path,
      lcp: Math.round(median(runs.map((r) => r.lcp))),
      cls: +median(runs.map((r) => r.cls)).toFixed(3),
      tbt: Math.round(median(runs.map((r) => r.tbt))),
      score: Math.round(median(runs.map((r) => r.score)) * 100),
    };
    const ok = page.lcp <= BUDGETS.lcp && page.cls <= BUDGETS.cls;
    failed ||= !ok;
    summary.push(page);
    console.log(
      `${ok ? 'ok  ' : 'OVER'} ${path.padEnd(22)} LCP ${page.lcp} ms (≤ ${BUDGETS.lcp})` +
        `  CLS ${page.cls} (≤ ${BUDGETS.cls})  TBT ${page.tbt} ms  score ${page.score}`,
    );
  }
} finally {
  await chrome.kill();
  server.kill();
}
mkdirSync('.lighthouse', { recursive: true });
writeFileSync('.lighthouse/summary.json', `${JSON.stringify(summary, null, 2)}\n`);
// In GitHub Actions the results also go to the job summary.
if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(
    process.env.GITHUB_STEP_SUMMARY,
    [
      '### Lighthouse (mobile, slow 4G, 4× CPU; median of 3)',
      '',
      `| Page | LCP (≤ ${BUDGETS.lcp} ms) | CLS (≤ ${BUDGETS.cls}) | TBT | Score |`,
      '| --- | --- | --- | --- | --- |',
      ...summary.map((p) => `| ${p.path} | ${p.lcp} ms | ${p.cls} | ${p.tbt} ms | ${p.score} |`),
      '',
    ].join('\n'),
  );
}
if (failed) {
  console.error('\nLighthouse budget exceeded.');
  process.exit(1);
}
