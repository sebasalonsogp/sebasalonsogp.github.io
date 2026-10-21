import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { ImageMetadata } from 'astro';
import type { CollectionEntry } from 'astro:content';
import { withBase } from './format';

type MediaEntry = CollectionEntry<'projects'>['data']['media'][number];

export type ProjectMedia =
  | { type: 'image'; image: ImageMetadata; alt: string; caption: string; fit: 'cover' | 'contain' }
  | { type: 'video'; src: string; poster: ImageMetadata; caption: string };

const images = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/projects/*/*.{jpg,jpeg,png,webp,avif}',
  { eager: true },
);

function projectImage(id: string, file: string): ImageMetadata {
  const image = images[`/src/assets/projects/${id}/${file}`];
  if (!image) throw new Error(`Project ${id}: missing image src/assets/projects/${id}/${file}`);
  return image.default;
}

function projectVideo(id: string, file: string): string {
  const path = `media/${id}/${file}`;
  if (!existsSync(join(process.cwd(), 'public', path))) {
    throw new Error(`Project ${id}: missing video public/${path}`);
  }
  return withBase(path);
}

/** Resolves a project's media file names to assets; a missing file fails the build. */
export function resolveMedia(id: string, media: MediaEntry[]): ProjectMedia[] {
  return media.map((item) =>
    item.type === 'image'
      ? { ...item, image: projectImage(id, item.src) }
      : { ...item, src: projectVideo(id, item.src), poster: projectImage(id, item.poster) },
  );
}
