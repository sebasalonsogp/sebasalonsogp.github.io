import { z } from 'astro/zod';
import snapshotJson from '../data/github.json';

// Committed snapshot of repository facts (see docs/content.md). Validated once at build time.
const snapshotSchema = z.record(
  z.string().regex(/^[\w.-]+\/[\w.-]+$/),
  z.strictObject({
    lastCommit: z.iso.date(),
    loc: z.number().int().positive(),
  }),
);

export type RepoSnapshot = z.infer<typeof snapshotSchema>[string];

export const githubSnapshot = snapshotSchema.parse(snapshotJson);
