// Constellation groups. Every skill named in a project's `tech` or a role's `skills` must
// belong to exactly one group (or be the core skill); the content schemas enforce this.
// `anchor` places a group's spiral in the constellation's 900 × 580 viewBox
// (src/features/constellation/layout.ts); a new group needs one.

export const coreSkill = 'Python';
export const coreAnchor = { x: 455, y: 300 };

export const skillGroups = [
  {
    name: 'Machine learning',
    anchor: { x: 225, y: 175 },
    skills: [
      'PyTorch',
      'Deep learning',
      'Computer vision',
      'SVM',
      'XGBoost',
      'FAISS',
      'Sentence Transformers',
      'NLP',
      'OpenAI API',
      'LLM fine-tuning',
      'Statistics',
    ],
  },
  {
    name: 'Backend & web',
    anchor: { x: 660, y: 150 },
    skills: ['FastAPI', 'Next.js', 'React', 'TypeScript', 'D3', 'Supabase'],
  },
  {
    name: 'Scientific Python',
    anchor: { x: 215, y: 455 },
    skills: ['NumPy', 'SciPy', 'Astropy', 'Matplotlib', 'Plotly', 'Streamlit'],
  },
  {
    name: 'Data',
    anchor: { x: 485, y: 470 },
    skills: ['PostgreSQL', 'BigQuery', 'Redis', 'ETL', 'MariaDB', 'Database design'],
  },
  {
    name: 'Cloud',
    anchor: { x: 735, y: 420 },
    skills: ['GCP', 'Cloud Run', 'GKE', 'Docker'],
  },
  {
    name: 'Leadership',
    anchor: { x: 70, y: 318 },
    skills: ['Team leadership'],
  },
] as const;

export type Skill = typeof coreSkill | (typeof skillGroups)[number]['skills'][number];

export const skillNames = [coreSkill, ...skillGroups.flatMap((group) => group.skills)] as [
  Skill,
  ...Skill[],
];

const duplicates = skillNames.filter((skill, i) => skillNames.indexOf(skill) !== i);
if (duplicates.length > 0) {
  throw new Error(`Skills listed in more than one group: ${duplicates.join(', ')}`);
}
