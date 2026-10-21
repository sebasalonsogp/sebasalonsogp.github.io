import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const httpUrl = z.url({ protocol: /^https?$/ });

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string().trim().min(1),
    summary: z.string().trim().min(1),
    technologies: z.array(z.string().trim().min(1)).min(1),
    order: z.number().int().nonnegative().default(0),
    draft: z.boolean().default(true),
    role: z.string().trim().min(1).optional(),
    repositoryUrl: httpUrl.optional(),
    demoUrl: httpUrl.optional(),
  }),
});

export const collections = { projects };
