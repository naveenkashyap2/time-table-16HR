/** 14 interview categories with real starter question sets (PRD §10.8). */
export const INTERVIEW_CATEGORIES = [
  {
    name: 'JavaScript',
    questions: [
      'Explain the event loop, microtasks and macrotasks.',
      'What is a closure? Give a practical use case.',
      'Difference between var, let and const.',
      'How does prototypal inheritance work?',
      'Explain debouncing vs throttling.',
      'What are Promises and how does async/await build on them?',
      'Shallow vs deep copy — how do you implement each?',
      'Explain `this` binding in the four invocation patterns.',
    ],
  },
  {
    name: 'React',
    questions: [
      'How does the virtual DOM and reconciliation work?',
      'useMemo vs useCallback — when do you reach for each?',
      'Explain the rules of hooks and why they exist.',
      'How do you prevent unnecessary re-renders?',
      'Controlled vs uncontrolled components.',
      'What problem does Context solve, and when is it the wrong tool?',
      'Explain key prop behaviour in lists.',
      'How would you code-split a React app?',
    ],
  },
  {
    name: 'Node.js',
    questions: [
      'How does the Node event loop differ from the browser?',
      'Explain streams and when to use them.',
      'What is the cluster module used for?',
      'How do you handle uncaught exceptions in production?',
      'CommonJS vs ES modules in Node.',
      'How would you profile a slow Node service?',
    ],
  },
  {
    name: 'Express.js',
    questions: [
      'How does middleware ordering affect a request?',
      'How do you implement centralised error handling?',
      'Explain route params, query params and body parsing.',
      'How do you secure an Express API (helmet, CORS, rate limiting)?',
      'How would you structure a large Express codebase?',
    ],
  },
  {
    name: 'MongoDB',
    questions: [
      'Embedding vs referencing — how do you decide?',
      'Explain the aggregation pipeline with an example.',
      'How do indexes work and when do they hurt?',
      'What are transactions in MongoDB and their limits?',
      'How do you design a schema for a feed?',
    ],
  },
  {
    name: 'SQL',
    questions: [
      'Explain the difference between INNER, LEFT and FULL joins.',
      'What are the normal forms and when do you denormalise?',
      'How do you read an EXPLAIN plan?',
      'Window functions — give a real use case.',
      'Explain ACID properties.',
    ],
  },
  {
    name: 'PostgreSQL',
    questions: [
      'How does MVCC work in Postgres?',
      'When would you use JSONB over a normalised table?',
      'Explain B-tree vs GIN indexes.',
      'What is connection pooling and why does Postgres need it?',
      'How do you handle migrations safely at scale?',
    ],
  },
  {
    name: 'REST API',
    questions: [
      'What makes an API RESTful?',
      'Idempotency: which verbs and why does it matter?',
      'How do you version an API?',
      'Pagination strategies: offset vs cursor.',
      'How do you design consistent error responses?',
    ],
  },
  {
    name: 'Git / GitHub',
    questions: [
      'Rebase vs merge — when do you use each?',
      'How do you resolve a conflict during a rebase?',
      'Explain git reset --soft / --mixed / --hard.',
      'What is a good branching strategy for a small team?',
      'How does git bisect help find a regression?',
    ],
  },
  {
    name: 'System Design',
    questions: [
      'Design a URL shortener.',
      'Design a rate limiter.',
      'Design a news feed.',
      'How would you scale a read-heavy service?',
      'Explain your caching strategy and invalidation approach.',
    ],
  },
  {
    name: 'GenAI',
    questions: [
      'How does a transformer attention mechanism work at a high level?',
      'Explain temperature, top-p and max tokens.',
      'What are embeddings and how are they used?',
      'How do you evaluate an LLM feature?',
      'What are practical guardrails against prompt injection?',
    ],
  },
  {
    name: 'RAG',
    questions: [
      'Walk through a RAG pipeline end to end.',
      'How do you choose a chunking strategy?',
      'Vector DB options and trade-offs.',
      'How do you measure retrieval quality?',
      'How do you reduce hallucination in a RAG answer?',
    ],
  },
  {
    name: 'HR',
    questions: [
      'Tell me about yourself.',
      'Why do you want this role?',
      'Describe a conflict you resolved on a team.',
      'What is your biggest weakness and what are you doing about it?',
      'Where do you see yourself in three years?',
      'Why are you leaving your current role?',
    ],
  },
  {
    name: 'Projects',
    questions: [
      'Walk me through the architecture of your main project.',
      'What was the hardest bug you fixed and how?',
      'What would you do differently if you rebuilt it?',
      'How did you test it?',
      'How does it perform under load?',
    ],
  },
];
