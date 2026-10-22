// Build-time layout of the experience timeline (docs/design-spec.md, "Experience timeline").
// Everything is in viewBox units: time runs left to right from a quarter before the first
// role to the build month ("now"), scaled so the future light cone ends at the lanes' right
// edge. Each lane gets one row, plus one more for every role that would collide with another.

import { lanes } from '../../data/taxonomy';
import type { Education, Role } from '../../lib/content';

type Lane = keyof typeof lanes;

export const WIDTH = 960;
const LABEL_X = 16;
const LEFT = 140;
const RIGHT = 900;
const AXIS_END = 930;
const AXIS_Y = 40;
/** Top of the plotting area and the first row's offset below it. */
const TOP = 54;
const FIRST_ROW = 28;
const ROW = 60;
const CONE_WIDTH = 78;
const CONE_HEIGHT = 60;
/** Line height of the labels around the cone. */
const LINE = 17;
/** Lead time before the first role (years). */
const LEAD = 0.25;
/** Estimated glyph advance for labels (14 px body) and sublabels (11.5 px mono). */
const LABEL_CHAR = 7.2;
const SUBLABEL_CHAR = 6.9;
/** Minimum gap between one role's labels and the next role in the same row. */
const LABEL_GAP = 12;

export interface TimelineRole {
  id: string;
  label: string;
  sublabel: string;
  highlight: boolean;
  x0: number;
  x1: number;
  y: number;
}

export interface TimelineBand {
  id: string;
  x0: number;
  x1: number;
  label: string;
  sublabel: string;
}

export interface TimelineLayout {
  width: number;
  height: number;
  left: number;
  axis: { y: number; x1: number };
  top: number;
  bottom: number;
  years: { year: number; x: number }[];
  lanes: { lane: Lane; label: string; y: number[] }[];
  laneLabelX: number;
  laneEnd: number;
  roles: TimelineRole[];
  bands: TimelineBand[];
  now: {
    x: number;
    y: number;
    /** Where the dotted line from the latest role to now starts (none for an ongoing role). */
    from: number | null;
    cone: { width: number; height: number };
    /** Label anchors: "FUTURE LIGHT CONE" and the two availability lines (x, y). */
    labelX: number;
    titleY: number;
    availability: { text: string; y: number }[];
  };
  /** First and last years shown, for the chart's accessible name. */
  span: { from: number; to: number };
}

/** `2024-09` → 2024.667 (the start of that month, in years). */
function toYears(month: string): number {
  const [year, m] = month.split('-').map(Number);
  return year! + (m! - 1) / 12;
}

/** Splits text into two lines at the space closest to its middle. */
function twoLines(text: string): [string, string] {
  const spaces = [...text.matchAll(/ /g)].map((match) => match.index);
  if (!spaces.length) return [text, ''];
  const cut = spaces.reduce((best, i) =>
    Math.abs(i - text.length / 2) < Math.abs(best - text.length / 2) ? i : best,
  );
  return [text.slice(0, cut), text.slice(cut + 1)];
}

export function layoutTimeline(
  roles: readonly Role[],
  education: readonly Education[],
  availability: string,
  today: Date = new Date(),
): TimelineLayout {
  const now = today.getFullYear() + (today.getMonth() + 0.5) / 12;
  const start = Math.min(...roles.map(({ data }) => toYears(data.start))) - LEAD;
  const scale = (RIGHT - CONE_WIDTH - LEFT) / (now - start);
  const x = (t: number) => LEFT + (t - start) * scale;
  const endOf = (end?: string) => (end === undefined ? now : toYears(end) + 1 / 12);

  // Rows: a role takes the first row of its lane whose last role ended by its start month
  // (sharing that month is fine) and whose labels end before it.
  const sorted = [...roles].sort((a, b) => a.data.start.localeCompare(b.data.start));
  const rows = new Map<Lane, { end: string; labelEnd: number }[]>();
  const placed = sorted.map(({ id, data }) => {
    const x0 = x(toYears(data.start));
    const laneRows = rows.get(data.lane) ?? [];
    rows.set(data.lane, laneRows);
    let row = laneRows.findIndex((r) => data.start >= r.end && x0 >= r.labelEnd + LABEL_GAP);
    if (row === -1) row = laneRows.push({ end: '', labelEnd: 0 }) - 1;
    laneRows[row] = {
      end: data.end ?? '9999-12',
      labelEnd: x0 + Math.max(data.label.length * LABEL_CHAR, data.sublabel.length * SUBLABEL_CHAR),
    };
    return { id, data, x0, row };
  });

  // Lanes keep the taxonomy's order; empty lanes still show, so the chart's frame is stable.
  let next = TOP + FIRST_ROW;
  const laneRows = (Object.keys(lanes) as Lane[]).map((lane) => {
    const count = Math.max(1, rows.get(lane)?.length ?? 0);
    const y = Array.from({ length: count }, (_, i) => next + i * ROW);
    next += count * ROW;
    return { lane, label: lanes[lane].toUpperCase(), y };
  });
  const bottom = next - ROW + 22;
  const rowY = (lane: Lane, row: number) => laneRows.find((l) => l.lane === lane)!.y[row]!;

  const timelineRoles: TimelineRole[] = placed.map(({ id, data, x0, row }) => ({
    id,
    label: data.label,
    sublabel: data.sublabel,
    highlight: data.highlight,
    x0,
    x1: x(endOf(data.end)),
    y: rowY(data.lane, row),
  }));

  // Now sits on the row of the role that ended last (an ongoing role counts as now).
  const latest = placed.reduce((a, b) => (endOf(b.data.end) >= endOf(a.data.end) ? b : a));
  const nowY = rowY(latest.data.lane, latest.row);
  const latestEnd = x(endOf(latest.data.end));
  const nowX = x(now);
  // The cone opens over the neighbouring rows but stays below the axis. Its title goes above
  // it when there is room, otherwise below it with the availability lines.
  const coneHeight = Math.min(CONE_HEIGHT, nowY - AXIS_Y - 6);
  const titleAbove = nowY - coneHeight - 12 >= TOP + 8;
  const below = nowY + coneHeight + 20;
  const titleY = titleAbove ? nowY - coneHeight - 12 : below;
  const availabilityY = titleAbove ? below : below + LINE;
  const availabilityLines = twoLines(availability)
    .filter(Boolean)
    .map((text, i) => ({
      text,
      y: availabilityY + i * LINE,
    }));

  const bands = education.flatMap(({ id, data }) => {
    const x1 = x(endOf(data.end));
    if (x1 <= LEFT) return [];
    return [
      {
        id,
        x0: Math.max(LEFT, x(toYears(data.start))),
        x1,
        label: data.label,
        sublabel: data.sublabel,
      },
    ];
  });

  const years: { year: number; x: number }[] = [];
  for (let year = Math.ceil(start); year <= Math.floor(now); year++)
    years.push({ year, x: x(year) });

  return {
    width: WIDTH,
    height: Math.max(bottom + 44, availabilityY + LINE + 6),
    left: LEFT,
    axis: { y: AXIS_Y, x1: AXIS_END },
    top: TOP,
    bottom,
    years,
    lanes: laneRows,
    laneLabelX: LABEL_X,
    laneEnd: RIGHT,
    roles: timelineRoles,
    bands,
    now: {
      x: nowX,
      y: nowY,
      from: latestEnd < nowX ? latestEnd : null,
      cone: { width: CONE_WIDTH, height: coneHeight },
      labelX: nowX + CONE_WIDTH * 0.56,
      titleY,
      availability: availabilityLines,
    },
    span: { from: Math.floor(start + LEAD), to: today.getFullYear() },
  };
}
