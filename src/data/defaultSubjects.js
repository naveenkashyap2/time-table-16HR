/**
 * Seed subjects — PRD §16.
 * Σ targetMinutes MUST equal 960 (16 hours).
 */

export const DEFAULT_SUBJECTS = [
  {
    name: 'MERN / Full Stack',
    targetMinutes: 240,
    iconKey: 'Code2',
    colorKey: 'primary',
    subBlocks: [
      { name: 'React.js', targetMinutes: 120 },
      { name: 'Node.js + Express.js', targetMinutes: 120 },
    ],
  },
  {
    name: 'DSA',
    targetMinutes: 180,
    iconKey: 'Binary',
    colorKey: 'secondary',
    subBlocks: [
      { name: 'DSA Concepts / Problem Solving', targetMinutes: 90 },
      { name: 'LeetCode Practice', targetMinutes: 90 },
    ],
  },
  {
    name: 'System Design',
    targetMinutes: 60,
    iconKey: 'Network',
    colorKey: 'accent',
    subBlocks: [],
  },
  {
    name: 'GenAI / RAG / LLM',
    targetMinutes: 240,
    iconKey: 'Sparkles',
    colorKey: 'secondary',
    subBlocks: [
      { name: 'GenAI / LLM Concepts', targetMinutes: 90 },
      { name: 'RAG / LangChain / AI Projects', targetMinutes: 90 },
      { name: 'AI Project Implementation', targetMinutes: 60 },
    ],
  },
  {
    name: 'Interview Preparation',
    targetMinutes: 120,
    iconKey: 'MessagesSquare',
    colorKey: 'primary',
    subBlocks: [],
  },
  {
    name: '.NET / C#',
    targetMinutes: 60,
    iconKey: 'Hash',
    colorKey: 'accent',
    subBlocks: [],
  },
  {
    name: 'React Native',
    targetMinutes: 60,
    iconKey: 'Smartphone',
    colorKey: 'primary',
    subBlocks: [],
  },
]; // Σ = 240+180+60+240+120+60+60 = 960 ✔

/** Stable slugs so tracker pages can find their linked subject after a reseed. */
export const SUBJECT_SLUGS = {
  'MERN / Full Stack': 'mern',
  DSA: 'dsa',
  'System Design': 'system-design',
  'GenAI / RAG / LLM': 'genai',
  'Interview Preparation': 'interview',
  '.NET / C#': 'dotnet',
  'React Native': 'react-native',
};

export const TOTAL_SEED_MINUTES = DEFAULT_SUBJECTS.reduce(
  (s, x) => s + x.targetMinutes,
  0,
);
