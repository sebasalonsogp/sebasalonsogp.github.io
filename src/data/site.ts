import { z } from 'astro/zod';

const httpUrl = z.url({ protocol: /^https?$/ });

const siteSchema = z.strictObject({
  name: z.string().trim().min(1),
  eyebrow: z.string().trim().min(1),
  // Rendered as `lead <em>emphasis</em>`.
  pitch: z.strictObject({
    lead: z.string().trim().min(1),
    emphasis: z.string().trim().min(1),
  }),
  lede: z.string().trim().min(1),
  availability: z.string().trim().min(1),
  email: z.email(),
  phone: z.string().trim().min(1),
  showPhone: z.boolean(),
  location: z.string().trim().min(1),
  linkedin: z.strictObject({ url: httpUrl, handle: z.string().trim().min(1) }),
  github: z.strictObject({ url: httpUrl, handle: z.string().trim().min(1) }),
  // Relative to the site base; the file is added to public/ in slice 1.6.
  resumePath: z.string().regex(/^[\w.-]+\.pdf$/),
  earlierWork: z
    .array(
      z.strictObject({
        name: z.string().trim().min(1),
        url: httpUrl,
        year: z.number().int().min(2000).max(2100),
      }),
    )
    .min(1),
});

export type Site = z.infer<typeof siteSchema>;

export const site: Site = siteSchema.parse({
  name: 'Sebastian Gonzales-Portillo',
  eyebrow: 'Backend · ML systems · Miami',
  pitch: {
    lead: 'I build backends for data and ML products,',
    emphasis: 'down to the math.',
  },
  lede: 'Most recently Founding Software Engineer at PadStats. Each planet is one of my projects.',
  availability: 'Open to backend and ML-platform roles',
  email: 'sebasagpf@gmail.com',
  phone: '(407) 408-5124',
  showPhone: true,
  location: 'Miami, FL',
  linkedin: {
    url: 'https://www.linkedin.com/in/sebastiangonzalesportillo/',
    handle: 'in/sebastiangonzalesportillo',
  },
  github: { url: 'https://github.com/sebasalonsogp', handle: 'sebasalonsogp' },
  resumePath: 'Sebastian_Gonzales_Portillo_Resume.pdf',
  earlierWork: [
    { name: 'MLResearch', url: 'https://github.com/sebasalonsogp/MLResearch', year: 2024 },
    {
      name: 'NumericalAnalysis',
      url: 'https://github.com/sebasalonsogp/NumericalAnalysis',
      year: 2025,
    },
    {
      name: 'csc431finalpackage',
      url: 'https://github.com/sebasalonsogp/csc431finalpackage',
      year: 2025,
    },
    { name: 'Faux_UberEats', url: 'https://github.com/sebasalonsogp/Faux_UberEats', year: 2024 },
    { name: 'RealEstateAI', url: 'https://github.com/sebasalonsogp/RealEstateAI', year: 2023 },
    {
      name: 'dummysearchengine',
      url: 'https://github.com/sebasalonsogp/dummysearchengine',
      year: 2023,
    },
    { name: 'ZoomAutoBot', url: 'https://github.com/sebasalonsogp/ZoomAutoBot', year: 2023 },
  ],
});

/** Document titles, shared by the static pages and the explorer's in-page visits. */
/** What Sebastian does, in the home title and the structured data. */
export const role = 'Backend and ML systems engineer';
export const homeTitle = `${site.name} — ${role}`;
export const projectTitle = (title: string) => `${title} — ${site.name}`;
