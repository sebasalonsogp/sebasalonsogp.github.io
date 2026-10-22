import { site } from '../data/site';
import type { SystemData, SystemProject } from '../features/explorer/system';
import type { Project } from './content';
import { withBase } from './format';

/** The explorer's input, built at compile time from the collection, snapshot and site data. */
export function toSystemData(projects: readonly Project[]): SystemData {
  const years = site.earlierWork.map((repo) => repo.year);
  const from = Math.min(...years);
  const to = Math.max(...years);
  const span = from === to ? String(from) : `${from}–${String(to).slice(-2)}`;
  return {
    star: site.name.split(' ')[0]!,
    earlierWork: years.length ? `Earlier work · ${span}` : '',
    projects: projects.map(({ id, data, github }): SystemProject => ({
      id,
      href: withBase(`projects/${id}/`),
      short: data.short,
      domain: data.domain,
      lastCommit: github.lastCommit,
      loc: github.loc,
      live: Boolean(data.demoUrl),
      subsystems: data.subsystems,
    })),
  };
}
