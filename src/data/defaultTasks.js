/** Seed tasks, grouped by subject slug (PRD §16). */
export const DEFAULT_TASKS_BY_SLUG = {
  mern: [
    'Build one React component from scratch',
    'Revise hooks: useEffect, useMemo, useCallback',
    'Write an Express route with validation',
    'Practice MongoDB aggregation pipeline',
  ],
  dsa: [
    'Solve 2 easy problems',
    'Solve 2 medium problems',
    'Revise one pattern (sliding window / two pointers)',
    'Write notes for every solved problem',
  ],
  'system-design': [
    'Read one system design case study',
    'Draw the architecture diagram by hand',
  ],
  genai: [
    'Read LLM / GenAI concept notes',
    'Build or extend one RAG pipeline step',
    'Ship a commit to the AI side project',
  ],
  interview: [
    'Answer 5 interview questions out loud',
    'Revise one project explanation (STAR format)',
  ],
  dotnet: ['Complete one C# / .NET topic', 'Write a small console exercise'],
  'react-native': ['Complete one React Native topic', 'Run the app on a device/emulator'],
};
