import { getCollection, type CollectionEntry } from 'astro:content';
import { githubSnapshot, type RepoSnapshot } from './github-snapshot';
import { resolveMedia, type ProjectMedia } from './media';

export type Project = CollectionEntry<'projects'> & { github: RepoSnapshot; media: ProjectMedia[] };
export type Role = CollectionEntry<'experience'>;
export type Education = CollectionEntry<'education'>;

/**
 * Published projects with their GitHub facts and resolved media, most recent commit first
 * (inner orbit first).
 */
export async function getProjects(): Promise<Project[]> {
  const entries = await getCollection('projects', ({ data }) => !data.draft);
  const projects = entries
    .map((entry) => ({
      ...entry,
      github: githubSnapshot[entry.data.repo]!,
      media: resolveMedia(entry.id, entry.data.media),
    }))
    .sort(
      (a, b) => b.github.lastCommit.localeCompare(a.github.lastCommit) || a.id.localeCompare(b.id),
    );

  const tourStops = new Map<number, string>();
  for (const { id, data } of projects) {
    if (data.tour === undefined) continue;
    const other = tourStops.get(data.tour);
    if (other) throw new Error(`Projects ${other} and ${id} share tour position ${data.tour}`);
    tourStops.set(data.tour, id);
  }
  return projects;
}

/** Roles in start order; current roles (no end) last among equal starts. */
export async function getRoles(): Promise<Role[]> {
  const roles = await getCollection('experience');
  return roles.sort(
    (a, b) =>
      a.data.start.localeCompare(b.data.start) ||
      (a.data.end ?? '9999-12').localeCompare(b.data.end ?? '9999-12') ||
      a.id.localeCompare(b.id),
  );
}

/** Education entries, most recent first. */
export async function getEducation(): Promise<Education[]> {
  const schools = await getCollection('education');
  return schools.sort((a, b) => b.data.end.localeCompare(a.data.end));
}
