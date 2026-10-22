// Size budgets (tasks/plan.md, Phase 8.2), checked against the built site in dist/:
// - initial JavaScript per page (module scripts, inline or linked, plus everything they import
//   statically; dynamic imports such as the explorer and the black hole load later): 60 KB gzip
// - the explorer chunk: 200 KB gzip
// - media one project visit can load (every image at its largest size, the video and poster):
//   2 MB
// Run after `astro build`; exits non-zero when a budget is exceeded.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { gzipSync } from 'node:zlib';

const DIST = 'dist';
const KB = 1024;
const BUDGETS = { initialJs: 60 * KB, explorer: 200 * KB, visitMedia: 2048 * KB };

const gzip = (buffer) => gzipSync(buffer, { level: 9 }).length;
const kb = (bytes) => `${(bytes / KB).toFixed(1)} KB`;
const fileFor = (url) => join(DIST, decodeURIComponent(url.replace(/^\//, '').split(/[?#]/)[0]));

function pages(dir = DIST) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return pages(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

/** Static imports of a chunk (`import … from "./x.js"`, `import "./x.js"`), as dist paths. */
function staticImports(file) {
  const code = readFileSync(file, 'utf8');
  const found = [];
  for (const match of code.matchAll(
    /\bimport\s*(?:[\w$*{}\s,]*?from\s*)?["'](\.{1,2}\/[^"']+\.js)["']/g,
  )) {
    found.push(join(dirname(file), match[1]));
  }
  return found;
}

function initialJs(html) {
  let bytes = 0;
  const seen = new Set();
  const visit = (file) => {
    if (seen.has(file) || !existsSync(file)) return;
    seen.add(file);
    bytes += gzip(readFileSync(file));
    staticImports(file).forEach(visit);
  };
  for (const [, attrs, body] of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (!/type="module"/.test(attrs)) continue;
    const src = attrs.match(/src="([^"]+)"/)?.[1];
    if (src) visit(fileFor(src));
    else bytes += gzip(Buffer.from(body));
  }
  return bytes;
}

/** Bytes of the media in a project page's visit, taking each image's largest candidate. */
function visitMedia(html) {
  const start = html.indexOf('<article class="visit');
  if (start === -1) return 0;
  const visit = html.slice(start, html.indexOf('</article>', start));
  const urls = new Set();
  for (const [, srcset] of visit.matchAll(/srcset="([^"]+)"/g)) {
    const largest = srcset
      .split(',')
      .map((c) => c.trim().split(/\s+/))
      .sort((a, b) => parseFloat(b[1] ?? '0') - parseFloat(a[1] ?? '0'))[0];
    if (largest) urls.add(largest[0]);
  }
  for (const [, url] of visit.matchAll(/<(?:video|source)[^>]*\s(?:src|poster)="([^"]+)"/g))
    urls.add(url);
  for (const [, url] of visit.matchAll(/<video[^>]*\sposter="([^"]+)"/g)) urls.add(url);
  return [...urls].reduce(
    (sum, url) => sum + (existsSync(fileFor(url)) ? statSync(fileFor(url)).size : 0),
    0,
  );
}

const failures = [];
const report = (label, bytes, budget) => {
  const ok = bytes <= budget;
  console.log(
    `${ok ? 'ok  ' : 'OVER'} ${label.padEnd(44)} ${kb(bytes).padStart(10)} / ${kb(budget)}`,
  );
  if (!ok) failures.push(label);
};

for (const page of pages()) {
  const html = readFileSync(page, 'utf8');
  const name = posix.join(...page.split(/[\\/]/).slice(1));
  report(`initial JS (gzip): ${name}`, initialJs(html), BUDGETS.initialJs);
  if (name.startsWith('projects/'))
    report(`visit media: ${name}`, visitMedia(html), BUDGETS.visitMedia);
}
const explorer = readdirSync(join(DIST, '_astro')).find((f) => /^explorer\..+\.js$/.test(f));
if (!explorer) failures.push('explorer chunk not found');
else
  report(
    'explorer chunk (gzip)',
    gzip(readFileSync(join(DIST, '_astro', explorer))),
    BUDGETS.explorer,
  );

if (failures.length) {
  console.error(`\nOver budget: ${failures.join('; ')}`);
  process.exit(1);
}
