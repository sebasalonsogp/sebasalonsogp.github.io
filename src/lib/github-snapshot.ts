import { z } from 'astro/zod';
import snapshotJson from '../data/github.json';

// Committed snapshot of repository facts (see docs/content.md). Validated once at build time.
const snapshotSchema = z.record(
  z.string().regex(/^[\w.-]+\/[\w.-]+$/),
  z.strictObject({
    // When the newest commit on the default branch was made (UTC), from `npm run sync:github`.
    lastCommit: z.iso.datetime(),
    loc: z.number().int().positive(),
  }),
);

export type RepoSnapshot = z.infer<typeof snapshotSchema>[string];

export const githubSnapshot = snapshotSchema.parse(snapshotJson);
