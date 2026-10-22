// Structured data (schema.org JSON-LD) for search engines, built only from facts the site
// already states: the profile in src/data/site.ts and each project's entry.

import { role, site } from '../data/site';
import type { Project } from './content';

/** The person the site is about, for the home page. */
export function personData(url: string, image?: string) {
  const [locality, region] = site.location.split(',').map((part) => part.trim());
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: site.name,
    jobTitle: role,
    url,
    ...(image && { image }),
    email: `mailto:${site.email}`,
    address: { '@type': 'PostalAddress', addressLocality: locality, addressRegion: region },
    sameAs: [site.linkedin.url, site.github.url],
  };
}

/** A project page: its source code, by the person above. */
export function projectData(project: Project, url: string, home: string, image?: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    name: project.data.title,
    description: project.data.summary,
    url,
    ...(image && { image }),
    codeRepository: `https://github.com/${project.data.repo}`,
    dateModified: project.github.lastCommit,
    author: { '@type': 'Person', name: site.name, url: home },
  };
}
