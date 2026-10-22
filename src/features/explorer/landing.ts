// Landing previews (docs/design-spec.md, "Visit and landing"): on desktop a 16:10 screen beside
// the visited planet with caption and dots; on phones the same preview inside the panel. Either
// opens a lightbox (native modal <dialog>: focus stays inside, Escape closes) with arrows.
// Video plays muted on a loop, except with reduced motion, where the poster shows.

import { reducedMotion } from '../motion/motion';
import type { SystemMedia, SystemProject } from './system';

/** How long the screen takes to fade out before its media is removed (ms). */
const CLEAR_AFTER_MS = 450;
const SCREEN_SIZES = '(max-width: 760px) calc(100vw - 66px), min(42vw, 580px)';
/** Phones show the preview inside the panel instead of beside the planet. */
const phoneQuery = window.matchMedia('(max-width: 760px)');

export interface Landing {
  show(project: SystemProject): void;
  hide(): void;
  isLightboxOpen(): boolean;
  dispose(): void;
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function mediaElement(item: SystemMedia, full: boolean): HTMLElement {
  if (item.type === 'video') {
    const video = el('video');
    video.src = item.src;
    video.poster = item.poster;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.setAttribute('aria-label', item.caption);
    if (full) video.controls = true;
    if (!reducedMotion.matches) {
      video.autoplay = true;
      void video.play().catch(() => {});
    }
    return video;
  }
  const img = el('img');
  img.src = item.src;
  img.srcset = item.srcset;
  img.sizes = full ? '100vw' : SCREEN_SIZES;
  img.width = item.width;
  img.height = item.height;
  img.alt = item.alt;
  img.decoding = 'async';
  if (!full) img.classList.add(`fit-${item.fit}`);
  return img;
}

export function createLanding(
  hero: HTMLElement,
  panelMedia: HTMLButtonElement,
  /** Called when the visitor uses the previews (dots, lightbox), e.g. to stop a tour. */
  onInteract: () => void = () => {},
): Landing {
  // Desktop screen.
  const figure = el('figure', 'landing');
  const screen = el('button', 'ld-screen');
  screen.type = 'button';
  screen.setAttribute('aria-label', 'Open the preview full size');
  const screenMedia = el('span', 'ld-media');
  const zoom = el('span', 'ld-zoom', 'Expand ⤢');
  zoom.setAttribute('aria-hidden', 'true');
  screen.append(screenMedia, zoom);
  const caption = el('figcaption');
  const captionText = el('span', 'ld-cap');
  const dots = el('span', 'ld-dots');
  caption.append(captionText, dots);
  figure.append(screen, caption);
  hero.append(figure);

  // Lightbox.
  const dialog = el('dialog', 'lb');
  dialog.setAttribute('aria-label', 'Project preview');
  const close = el('button', 'lb-btn lb-close', 'Close ');
  close.type = 'button';
  close.append(el('kbd', undefined, 'Esc'));
  const previous = el('button', 'lb-btn lb-nav lb-prev', '←');
  const next = el('button', 'lb-btn lb-nav lb-next', '→');
  previous.type = next.type = 'button';
  previous.setAttribute('aria-label', 'Previous preview');
  next.setAttribute('aria-label', 'Next preview');
  const stage = el('div', 'lb-stage');
  const lbCaption = el('p', 'lb-cap');
  dialog.append(close, previous, stage, next, lbCaption);
  document.body.append(dialog);

  let items: SystemMedia[] = [];
  let index = 0;
  let lightboxIndex = 0;
  let returnFocus: HTMLElement | null = null;
  let clearTimer = 0;

  const showItem = (i: number) => {
    index = i;
    const item = items[i];
    // Only the visible container gets the media, so a video never loads or plays twice.
    const content = item ? [mediaElement(item, false)] : [];
    if (phoneQuery.matches) {
      screenMedia.replaceChildren();
      panelMedia.replaceChildren(...content);
    } else {
      panelMedia.replaceChildren();
      screenMedia.replaceChildren(...content);
    }
    captionText.textContent = item?.caption ?? '';
    for (const [k, dot] of [...dots.children].entries()) {
      dot.setAttribute('aria-pressed', String(k === i));
    }
  };

  const showLightboxItem = () => {
    const item = items[lightboxIndex];
    if (!item) return;
    stage.replaceChildren(mediaElement(item, true));
    lbCaption.textContent =
      item.caption + (items.length > 1 ? ` · ${lightboxIndex + 1} of ${items.length}` : '');
    previous.hidden = next.hidden = items.length < 2;
  };

  const openLightbox = (event: Event) => {
    if (!items.length) return;
    onInteract();
    returnFocus = event.currentTarget as HTMLElement;
    lightboxIndex = index;
    showLightboxItem();
    document.documentElement.classList.add('is-lightbox-open');
    dialog.showModal();
    close.focus();
  };

  const onDialogClose = () => {
    stage.replaceChildren();
    document.documentElement.classList.remove('is-lightbox-open');
    if (returnFocus?.isConnected) returnFocus.focus({ preventScroll: true });
    returnFocus = null;
  };
  const step = (direction: 1 | -1) => {
    lightboxIndex = (lightboxIndex + direction + items.length) % items.length;
    showLightboxItem();
  };
  const onClose = () => dialog.close();
  const onPrevious = () => step(-1);
  const onNext = () => step(1);
  const onDialogKey = (event: KeyboardEvent) => {
    if (items.length < 2) return;
    if (event.key === 'ArrowLeft') step(-1);
    else if (event.key === 'ArrowRight') step(1);
  };
  // A click on the backdrop (the dialog itself, outside its content) closes it.
  const onDialogClick = (event: MouseEvent) => {
    if (event.target === dialog || event.target === stage) dialog.close();
  };

  const onBreakpoint = () => {
    if (hero.classList.contains('has-landing')) showItem(index);
  };
  phoneQuery.addEventListener('change', onBreakpoint);

  screen.addEventListener('click', openLightbox);
  panelMedia.addEventListener('click', openLightbox);
  dialog.addEventListener('close', onDialogClose);
  dialog.addEventListener('keydown', onDialogKey);
  dialog.addEventListener('click', onDialogClick);
  close.addEventListener('click', onClose);
  previous.addEventListener('click', onPrevious);
  next.addEventListener('click', onNext);

  return {
    show(project) {
      window.clearTimeout(clearTimer);
      items = project.media;
      dots.replaceChildren(
        ...(items.length > 1
          ? items.map((_, i) => {
              const dot = el('button', 'ld-dot');
              dot.type = 'button';
              dot.setAttribute('aria-label', `Preview ${i + 1} of ${items.length}`);
              dot.addEventListener('click', () => {
                onInteract();
                showItem(i);
              });
              return dot;
            })
          : []),
      );
      showItem(0);
      panelMedia.hidden = items.length === 0;
      hero.classList.toggle('has-landing', items.length > 0);
    },
    hide() {
      hero.classList.remove('has-landing');
      panelMedia.hidden = true;
      for (const video of hero.querySelectorAll<HTMLVideoElement>(
        '.landing video, .v-media video',
      )) {
        video.pause();
      }
      window.clearTimeout(clearTimer);
      clearTimer = window.setTimeout(() => {
        screenMedia.replaceChildren();
        panelMedia.replaceChildren();
      }, CLEAR_AFTER_MS);
    },
    isLightboxOpen: () => dialog.open,
    dispose() {
      window.clearTimeout(clearTimer);
      phoneQuery.removeEventListener('change', onBreakpoint);
      if (dialog.open) dialog.close();
      screen.removeEventListener('click', openLightbox);
      panelMedia.removeEventListener('click', openLightbox);
      dialog.removeEventListener('close', onDialogClose);
      dialog.removeEventListener('keydown', onDialogKey);
      dialog.removeEventListener('click', onDialogClick);
      close.removeEventListener('click', onClose);
      previous.removeEventListener('click', onPrevious);
      next.removeEventListener('click', onNext);
      figure.remove();
      dialog.remove();
    },
  };
}
