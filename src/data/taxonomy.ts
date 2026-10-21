import type { CollectionEntry } from 'astro:content';

type Domain = CollectionEntry<'projects'>['data']['domain'];
type Lane = CollectionEntry<'experience'>['data']['lane'];

// Display labels for the enumerations in the content schemas.

export const domains = {
  backend: { label: 'Backend & product', world: 'Rocky world', color: 'var(--d-backend)' },
  ml: { label: 'Machine learning', world: 'Banded giant', color: 'var(--d-ml)' },
  data: { label: 'Data science', world: 'Ocean world', color: 'var(--d-data)' },
  math: { label: 'Math & scientific computing', world: 'Ice world', color: 'var(--d-math)' },
} as const satisfies Record<Domain, { label: string; world: string; color: string }>;

export const lanes = {
  research: 'Research',
  data: 'Data science',
  eng: 'Engineering',
  lead: 'Leadership',
} as const satisfies Record<Lane, string>;
