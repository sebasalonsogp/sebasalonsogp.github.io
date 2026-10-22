import { getImage } from 'astro:assets';
import { site } from '../data/site';
import type { SystemData, SystemMedia, SystemProject } from '../features/explorer/system';
import type { Project } from './content';
import { withBase } from './format';
import type { ProjectMedia } from './media';

/** Widths generated for previews; the lightbox picks the largest the screen needs. */
const PREVIEW_WIDTHS = [480, 800, 1200, 1600];

async function toSystemMedia(item: ProjectMedia): Promise<SystemMedia> {
  if (item.type === 'video') {
    const poster = await getImage({ src: item.poster, width: 1200, format: 'webp' });
    return { type: 'video', src: item.src, poster: poster.src, caption: item.caption };
  }
  const widths = PREVIEW_WIDTHS.filter((w) => w <= item.image.width);
  const image = await getImage({
    src: item.image,
    widths: widths.length ? widths : [item.image.width],
    format: 'webp',
  });
  return {
    type: 'image',
    src: image.src,
    srcset: image.srcSet.attribute,
    width: item.image.width,
    height: item.image.height,
    alt: item.alt,
    caption: item.caption,
    fit: item.fit,
  };
}

/** The explorer's input, built at compile time from the collection, snapshot and site data. */
export async function toSystemData(projects: readonly Project[]): Promise<SystemData> {
  const years = site.earlierWork.map((repo) => repo.year);
  const from = Math.min(...years);
  const to = Math.max(...years);
  const span = from === to ? String(from) : `${from}–${String(to).slice(-2)}`;
  return {
    star: site.name.split(' ')[0]!,
    earlierWork: years.length ? `Earlier work · ${span}` : '',
    projects: await Promise.all(
      projects.map(async ({ id, data, github, media }): Promise<SystemProject> => ({
        id,
        href: withBase(`projects/${id}/`),
        short: data.short,
        title: data.title,
        summary: data.summary,
        brief: data.brief,
        log: data.log,
        tech: data.tech,
        ...(data.demoUrl ? { demoUrl: data.demoUrl } : {}),
        repoUrl: `https://github.com/${data.repo}`,
        domain: data.domain,
        lastCommit: github.lastCommit,
        loc: github.loc,
        live: Boolean(data.demoUrl),
        subsystems: data.subsystems,
        media: await Promise.all(media.map(toSystemMedia)),
      })),
    ),
  };
}
