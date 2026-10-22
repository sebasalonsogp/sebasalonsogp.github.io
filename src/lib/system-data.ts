import type { SystemProject } from '../features/explorer/system';
import type { Project } from './content';

/** The explorer's input, built at compile time from the collection and GitHub snapshot. */
export function toSystemProjects(projects: readonly Project[]): SystemProject[] {
  return projects.map(({ id, data, github }) => ({
    id,
    short: data.short,
    domain: data.domain,
    lastCommit: github.lastCommit,
    loc: github.loc,
    live: Boolean(data.demoUrl),
    subsystems: data.subsystems,
  }));
}
