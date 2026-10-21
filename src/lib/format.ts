const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseMonth(date: string): { year: number; month: number } {
  const [year, month] = date.split('-').map(Number);
  return { year: year!, month: month! };
}

/** `2026-10` or `2026-10-20` → `Oct 2026`. */
export function formatMonth(date: string): string {
  const { year, month } = parseMonth(date);
  return `${MONTHS[month - 1]} ${year}`;
}

/** Inclusive length of a span of months: `2022-07`–`2022-09` → `3 mo`, 13 months → `1 yr 1 mo`. */
export function formatDuration(start: string, end: string): string {
  const a = parseMonth(start);
  const b = parseMonth(end);
  const months = (b.year - a.year) * 12 + (b.month - a.month) + 1;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [years ? `${years} yr` : '', rest ? `${rest} mo` : ''].filter(Boolean).join(' ');
}

/** `Jul 2022 – Sep 2022 · 3 mo`; an open-ended span reads `Jun 2025 – Present`. */
export function formatSpan(start: string, end?: string): string {
  if (end === undefined) return `${formatMonth(start)} – Present`;
  return `${formatMonth(start)} – ${formatMonth(end)} · ${formatDuration(start, end)}`;
}

/** Stable fragment id for a skill: `Next.js` → `skill-next-js`. */
export function skillAnchor(skill: string): string {
  return `skill-${skill
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;
}

/** Prefixes a site-relative path with the configured base (set for GitHub Pages in 1.6). */
export function withBase(path: string): string {
  return `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}${path.replace(/^\//, '')}`;
}
