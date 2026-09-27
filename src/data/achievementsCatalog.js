/**
 * Static achievement catalog — PRD §9.6.
 * 14 achievements. `progress(stats)` powers the "locked" hint bars.
 */

/** @typedef {{id:string,name:string,description:string,emoji:string,group:string,goal:number,metric:string}} Achievement */

/** @type {Achievement[]} */
export const ACHIEVEMENTS = [
  {
    id: 'first-session',
    name: 'First Study Session',
    description: 'Complete your very first tracked session.',
    emoji: '🌱',
    group: 'Getting started',
    metric: 'sessions',
    goal: 1,
  },
  {
    id: 'day-5h',
    name: '5-Hour Day',
    description: 'Study 5 hours in a single day.',
    emoji: '⏱️',
    group: 'Daily volume',
    metric: 'bestDayMinutes',
    goal: 300,
  },
  {
    id: 'day-8h',
    name: '8-Hour Day',
    description: 'Study 8 hours in a single day.',
    emoji: '🔋',
    group: 'Daily volume',
    metric: 'bestDayMinutes',
    goal: 480,
  },
  {
    id: 'day-12h',
    name: '12-Hour Day',
    description: 'Study 12 hours in a single day.',
    emoji: '🚀',
    group: 'Daily volume',
    metric: 'bestDayMinutes',
    goal: 720,
  },
  {
    id: 'day-16h',
    name: 'Perfect Day',
    description: 'Hit the full 16 hours in a single day.',
    emoji: '👑',
    group: 'Daily volume',
    metric: 'bestDayMinutes',
    goal: 960,
  },
  {
    id: 'streak-7',
    name: '7-Day Streak',
    description: 'Qualify 7 days in a row.',
    emoji: '🔥',
    group: 'Consistency',
    metric: 'longestStreak',
    goal: 7,
  },
  {
    id: 'streak-14',
    name: '14-Day Streak',
    description: 'Qualify 14 days in a row.',
    emoji: '💥',
    group: 'Consistency',
    metric: 'longestStreak',
    goal: 14,
  },
  {
    id: 'streak-30',
    name: '30-Day Streak',
    description: 'Qualify 30 days in a row.',
    emoji: '🏆',
    group: 'Consistency',
    metric: 'longestStreak',
    goal: 30,
  },
  {
    id: 'hours-100',
    name: '100 Study Hours',
    description: 'Accumulate 100 total hours of study.',
    emoji: '💯',
    group: 'Lifetime',
    metric: 'totalMinutes',
    goal: 6000,
  },
  {
    id: 'hours-500',
    name: '500 Study Hours',
    description: 'Accumulate 500 total hours of study.',
    emoji: '🧠',
    group: 'Lifetime',
    metric: 'totalMinutes',
    goal: 30000,
  },
  {
    id: 'hours-1000',
    name: '1000 Study Hours',
    description: 'Accumulate 1000 total hours of study.',
    emoji: '🌟',
    group: 'Lifetime',
    metric: 'totalMinutes',
    goal: 60000,
  },
  {
    id: 'dsa-50',
    name: '50 DSA Problems',
    description: 'Mark 50 DSA problems as solved.',
    emoji: '🧩',
    group: 'DSA',
    metric: 'dsaSolved',
    goal: 50,
  },
  {
    id: 'dsa-100',
    name: '100 DSA Problems',
    description: 'Mark 100 DSA problems as solved.',
    emoji: '⚔️',
    group: 'DSA',
    metric: 'dsaSolved',
    goal: 100,
  },
  {
    id: 'dsa-200',
    name: '200 DSA Problems',
    description: 'Mark 200 DSA problems as solved.',
    emoji: '🐉',
    group: 'DSA',
    metric: 'dsaSolved',
    goal: 200,
  },
];

export const ACHIEVEMENT_COUNT = ACHIEVEMENTS.length;

export const METRIC_LABEL = {
  sessions: 'sessions',
  bestDayMinutes: 'minutes in a day',
  longestStreak: 'day streak',
  totalMinutes: 'minutes studied',
  dsaSolved: 'problems solved',
};
