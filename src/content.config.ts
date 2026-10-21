import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { skillNames } from './data/skill-groups';
import { githubSnapshot } from './lib/github-snapshot';

const text = z.string().trim().min(1);
const httpUrl = z.url({ protocol: /^https?$/ });
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'Expected YYYY-MM');

const skill = z.enum(skillNames, {
  error: (issue) =>
    `Unknown skill "${String(issue.input)}". Add it to a group in src/data/skill-groups.ts.`,
});

// File names only; images move to src/assets/projects/<id>/ and videos to public/media/<id>/
// when media is copied into the repository (see docs/content.md).
const imageFile = z.string().regex(/^[a-z0-9-]+\.(jpe?g|png|webp|avif)$/, 'Expected an image file');
const videoFile = z.string().regex(/^[a-z0-9-]+\.(webm|mp4)$/, 'Expected a video file');

const media = z.discriminatedUnion('type', [
  z.strictObject({
    type: z.literal('image'),
    src: imageFile,
    caption: text,
    fit: z.enum(['cover', 'contain']).default('cover'),
  }),
  z.strictObject({
    type: z.literal('video'),
    src: videoFile,
    poster: imageFile,
    caption: text,
  }),
]);

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.strictObject({
    title: text,
    short: text,
    summary: text,
    domain: z.enum(['backend', 'ml', 'data', 'math']),
    repo: z
      .string()
      .regex(/^[\w.-]+\/[\w.-]+$/, 'Expected owner/name')
      .refine((repo) => repo in githubSnapshot, {
        error: (issue) => `${String(issue.input)} is missing from src/data/github.json`,
      }),
    demoUrl: httpUrl.optional(),
    subsystems: z.array(text),
    tech: z.array(skill).min(1),
    brief: text,
    log: text,
    media: z.array(media).default([]),
    tour: z.number().int().positive().optional(),
    draft: z.boolean().default(false),
  }),
});

const experience = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/experience' }),
  schema: z
    .strictObject({
      title: text,
      org: text,
      orgShort: text,
      place: text,
      lane: z.enum(['research', 'data', 'eng', 'lead']),
      start: month,
      end: month.optional(),
      highlight: z.boolean().default(false),
      label: text,
      sublabel: text,
      note: text.optional(),
      bullets: z.array(text).min(1),
      skills: z.array(skill),
      link: z.strictObject({ label: text, url: httpUrl }).optional(),
    })
    .refine((role) => role.end === undefined || role.end >= role.start, {
      error: 'end must not be before start',
      path: ['end'],
    }),
});

const education = defineCollection({
  loader: glob({ pattern: '*.yaml', base: './src/content/education' }),
  schema: z
    .strictObject({
      school: text,
      place: text,
      degrees: z.array(text).min(1),
      minor: text.optional(),
      honors: text.optional(),
      gpa: z
        .string()
        .regex(/^\d\.\d{2}$/)
        .optional(),
      start: month,
      end: month,
      label: text,
      sublabel: text,
      coursework: z.array(text),
    })
    .refine((school) => school.end >= school.start, {
      error: 'end must not be before start',
      path: ['end'],
    }),
});

export const collections = { projects, experience, education };
