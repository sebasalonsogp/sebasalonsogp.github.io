// Constellation groups. Every skill named in a project's `tech` or a role's `skills` must
// belong to exactly one group (or be the core skill); the content schemas enforce this.

export const coreSkill = 'Python';

export const skillGroups = [
  {
    name: 'Machine learning',
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
    skills: ['FastAPI', 'Next.js', 'React', 'TypeScript', 'D3', 'Supabase'],
  },
  {
    name: 'Scientific Python',
    skills: ['NumPy', 'SciPy', 'Astropy', 'Matplotlib', 'Plotly', 'Streamlit'],
  },
  {
    name: 'Data',
    skills: ['PostgreSQL', 'BigQuery', 'Redis', 'ETL', 'MariaDB', 'Database design'],
  },
  {
    name: 'Cloud',
    skills: ['GCP', 'Cloud Run', 'GKE', 'Docker'],
  },
  {
    name: 'Leadership',
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
