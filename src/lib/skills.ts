import { coreSkill, skillGroups, type Skill } from '../data/skill-groups';
import type { Project, Role } from './content';

export interface SkillUse {
  name: Skill;
  projects: Project[];
  roles: Role[];
  count: number;
}

export interface SkillGroupUse {
  name: string;
  /** Where the group sits in the constellation (viewBox units). */
  anchor: { x: number; y: number };
  skills: SkillUse[];
}

/**
 * Skills as used by the content: only skills named by a published project or a role appear.
 * Groups keep the order of src/data/skill-groups.ts; skills within a group are most used first.
 */
export function buildSkillIndex(projects: Project[], roles: Role[]) {
  const uses = new Map<Skill, SkillUse>();
  const use = (name: Skill) => {
    let entry = uses.get(name);
    if (!entry) uses.set(name, (entry = { name, projects: [], roles: [], count: 0 }));
    entry.count += 1;
    return entry;
  };
  for (const project of projects)
    for (const name of project.data.tech) use(name).projects.push(project);
  for (const role of roles) for (const name of role.data.skills) use(name).roles.push(role);

  const byUse = (a: SkillUse, b: SkillUse) => b.count - a.count || a.name.localeCompare(b.name);
  const pick = (names: readonly Skill[]) =>
    names.flatMap((name) => uses.get(name) ?? []).sort(byUse);

  const groups: SkillGroupUse[] = skillGroups
    .map((group) => ({ name: group.name, anchor: group.anchor, skills: pick(group.skills) }))
    .filter((group) => group.skills.length > 0);

  return { core: uses.get(coreSkill), groups, total: uses.size };
}
