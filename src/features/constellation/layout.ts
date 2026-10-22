// Build-time layout of the skills constellation (docs/design-spec.md, "Skills constellation").
// Everything is in viewBox units (900 × 580). Each group is a small spiral around its anchor
// (src/data/skill-groups.ts) with its most used skill in the middle; labels are then pushed
// apart vertically until none overlap, and each group is traced by its shortest tree.

import { coreAnchor } from '../../data/skill-groups';
import type { SkillGroupUse, SkillUse } from '../../lib/skills';

export const WIDTH = 900;
export const HEIGHT = 580;
/** Spacing of the spiral (units per √index) and its horizontal / vertical stretch. */
const SPIRAL = 46;
const STRETCH_X = 1.25;
const STRETCH_Y = 0.85;
/** Golden angle, so neighbours in the spiral spread evenly. */
const GOLDEN_ANGLE = 2.39996;
/** Labels sit left of their star from here on, so they stay inside the frame. */
const LABEL_FLIP_X = 760;
/** Estimated glyph advance of a 14 px label, and its box height. */
const LABEL_CHAR = 7.7;
const LABEL_HEIGHT = 22;
const BOUNDS = { x0: 30, x1: 860, y0: 40, y1: 566 };
const GROUP_LABEL_GAP = 26;
const MAX_PASSES = 500;

export interface ConstellationStar {
  name: string;
  x: number;
  y: number;
  r: number;
  count: number;
  projects: number;
  roles: number;
  /** Label on the left of the star (near the right edge). */
  labelLeft: boolean;
  /** Used three or more times: bold label. */
  major: boolean;
  /** The star and its label: the hit area once stars become buttons. */
  box: { x: number; y: number; width: number; height: number };
}

export interface ConstellationLayout {
  width: number;
  height: number;
  stars: ConstellationStar[];
  lines: { x1: number; y1: number; x2: number; y2: number }[];
  groups: { name: string; x: number; y: number }[];
}

/** Star radius: grows with the square root of how often the skill is used. */
export const starRadius = (count: number) => 2.6 + Math.sqrt(count) * 2.3;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

interface Node extends ConstellationStar {
  group: number;
}

export function layoutConstellation(
  core: SkillUse | undefined,
  groups: readonly SkillGroupUse[],
): ConstellationLayout {
  // Spirals: group members arrive most used first (src/lib/skills.ts).
  const spiral = (skills: readonly SkillUse[], anchor: { x: number; y: number }, group: number) =>
    skills.map((skill, i): Node => {
      const radius = SPIRAL * Math.sqrt(i);
      const angle = i * GOLDEN_ANGLE + 0.6;
      return {
        name: skill.name,
        x: anchor.x + Math.cos(angle) * radius * STRETCH_X,
        y: anchor.y + Math.sin(angle) * radius * STRETCH_Y,
        r: starRadius(skill.count),
        count: skill.count,
        projects: skill.projects.length,
        roles: skill.roles.length,
        labelLeft: false,
        major: skill.count >= 3,
        box: { x: 0, y: 0, width: 0, height: 0 },
        group,
      };
    });
  const nodes: Node[] = [
    ...(core ? spiral([core], coreAnchor, -1) : []),
    ...groups.flatMap((g, i) => spiral(g.skills, g.anchor, i)),
  ];

  // A star and its label as one box; the label flips side near the right edge.
  const box = (n: Node) => {
    const width = n.name.length * LABEL_CHAR + n.r + 10;
    return n.x < LABEL_FLIP_X
      ? [n.x - n.r - 6, n.y - LABEL_HEIGHT / 2, n.x + width, n.y + LABEL_HEIGHT / 2]
      : [n.x - width, n.y - LABEL_HEIGHT / 2, n.x + n.r + 6, n.y + LABEL_HEIGHT / 2];
  };
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    let moved = false;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i]!;
        const b = nodes[j]!;
        const [ax0, ay0, ax1, ay1] = box(a);
        const [bx0, by0, bx1, by1] = box(b);
        const overlapX = Math.min(ax1!, bx1!) - Math.max(ax0!, bx0!);
        const overlapY = Math.min(ay1!, by1!) - Math.max(ay0!, by0!);
        if (overlapX > 0 && overlapY > 0) {
          moved = true;
          const shift = (a.y <= b.y ? -1 : 1) * (overlapY / 2 + 0.6);
          a.y += shift;
          b.y -= shift;
        }
      }
    }
    for (const n of nodes) {
      n.x = clamp(n.x, BOUNDS.x0, BOUNDS.x1);
      n.y = clamp(n.y, BOUNDS.y0, BOUNDS.y1);
    }
    if (!moved) break;
  }
  for (const n of nodes) {
    n.labelLeft = n.x >= LABEL_FLIP_X;
    const [x0, y0, x1, y1] = box(n) as [number, number, number, number];
    n.box = { x: x0, y: y0, width: x1 - x0, height: y1 - y0 };
  }

  // Shortest tree through each group's stars (Prim's algorithm; groups are small).
  const lines: ConstellationLayout['lines'] = [];
  groups.forEach((_, g) => {
    const members = nodes.filter((n) => n.group === g);
    if (members.length < 2) return;
    const inTree = new Set([members[0]!]);
    while (inTree.size < members.length) {
      let best: { a: Node; b: Node; d: number } | null = null;
      for (const a of inTree) {
        for (const b of members) {
          if (inTree.has(b)) continue;
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (!best || d < best.d) best = { a, b, d };
        }
      }
      lines.push({ x1: best!.a.x, y1: best!.a.y, x2: best!.b.x, y2: best!.b.y });
      inTree.add(best!.b);
    }
  });

  // Group names centred above their stars.
  const groupLabels = groups.map((group, g) => {
    const members = nodes.filter((n) => n.group === g);
    const meanX = members.reduce((sum, n) => sum + n.x, 0) / members.length;
    const top = Math.min(...members.map((n) => n.y));
    return { name: group.name.toUpperCase(), x: clamp(meanX, 80, 820), y: top - GROUP_LABEL_GAP };
  });

  return {
    width: WIDTH,
    height: HEIGHT,
    stars: nodes,
    lines,
    groups: groupLabels,
  };
}
