// Refreshes src/data/github.json (docs/content.md, "GitHub snapshot") for every repository it
// lists: `lastCommit` is the time of the newest commit on the default branch (UTC), `loc` the
// lines in tracked source files at that commit (code extensions only; no docs, config, data,
// lockfiles, minified or vendored files). Uses GITHUB_TOKEN when set (CI); public repositories
// also work without it. Prints what changed; exits 0 either way.
//
//   npm run sync:github

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { format, resolveConfig } from 'prettier';

const FILE = 'src/data/github.json';
const SOURCE = /\.(py|ts|tsx|js|jsx|mjs|cjs|astro|vue|svelte|css|scss|html|sql|sh)$/;
const SKIP = /(^|\/)(vendor|dist|build|node_modules)\/|\.min\./;

const api = async (path) => {
  const response = await fetch(`https://api.github.com/${path}`, {
    headers: {
      Accept: 'application/vnd.github+json',
      ...(process.env.GITHUB_TOKEN && { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }),
    },
  });
  if (!response.ok) throw new Error(`GitHub ${path}: ${response.status} ${response.statusText}`);
  return response.json();
};

/** Lines in tracked source files of a shallow clone (counted like `wc -l`, plus a last line). */
function linesOfCode(repo) {
  const dir = mkdtempSync(join(tmpdir(), 'loc-'));
  try {
    execFileSync('git', [
      'clone',
      '--quiet',
      '--depth',
      '1',
      `https://github.com/${repo}.git`,
      dir,
    ]);
    const files = execFileSync('git', ['-C', dir, 'ls-files', '-z'], { encoding: 'utf8' })
      .split('\0')
      .filter((file) => SOURCE.test(file) && !SKIP.test(file));
    let lines = 0;
    for (const file of files) {
      const text = readFileSync(join(dir, file), 'utf8');
      if (!text) continue;
      lines += text.split('\n').length - (text.endsWith('\n') ? 1 : 0);
    }
    return lines;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const snapshot = JSON.parse(readFileSync(FILE, 'utf8'));
const next = {};
for (const repo of Object.keys(snapshot)) {
  const { default_branch: branch } = await api(`repos/${repo}`);
  const head = await api(`repos/${repo}/commits/${branch}`);
  next[repo] = {
    lastCommit: new Date(head.commit.committer.date).toISOString().replace(/\.\d{3}Z$/, 'Z'),
    loc: linesOfCode(repo),
  };
  const before = snapshot[repo];
  const changed = before.lastCommit !== next[repo].lastCommit || before.loc !== next[repo].loc;
  console.log(
    `${changed ? 'changed' : 'same   '} ${repo}: ${before.lastCommit} → ${next[repo].lastCommit}, ` +
      `${before.loc} → ${next[repo].loc} lines`,
  );
}

const body = Object.entries(next)
  .map(
    ([repo, { lastCommit, loc }]) =>
      `  "${repo}": { "lastCommit": "${lastCommit}", "loc": ${loc} }`,
  )
  .join(',\n');
// Formatted like the rest of the repository, so the CI format check passes.
writeFileSync(
  FILE,
  await format(`{\n${body}\n}\n`, { ...(await resolveConfig(FILE)), filepath: FILE }),
);
