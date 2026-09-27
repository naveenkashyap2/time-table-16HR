/**
 * 24 deterministic offline quotes (PRD §12.3).
 * Selected as FALLBACK_QUOTES[dayOfYear % 24] so the same day always shows
 * the same line, with zero network access.
 */
export const FALLBACK_QUOTES = [
  'Small progress every day becomes extraordinary progress over time.',
  'Discipline is choosing what you want most over what you want now.',
  'You do not rise to the level of your goals, you fall to the level of your systems.',
  'The hours nobody sees create the results everybody wants.',
  'Consistency beats intensity when intensity is not consistent.',
  'One more problem solved today is one less unknown tomorrow.',
  'Your future self is built in the hours you almost skipped.',
  'Focus is deciding what not to do for the next sixty minutes.',
  'Hard now, easy later. Easy now, hard later. Choose deliberately.',
  'Every expert was once a beginner who refused to stop showing up.',
  'Motivation gets you started; the timer keeps you going.',
  'Deep work is a skill. Train it like any other.',
  'Debug the habit, not just the code.',
  'A sixteen hour day is just sixteen focused hours, one at a time.',
  'The gap between knowing and doing is closed by repetition.',
  'Do not count the hours. Make the hours count.',
  'Learn in public, build in private, ship relentlessly.',
  'Momentum is fragile in the morning and unstoppable by evening.',
  'You cannot optimise what you do not measure.',
  'Rest is part of the plan, not a break from it.',
  'Write the code, read the error, fix the gap. Repeat.',
  'Boring consistency is the most underrated superpower in tech.',
  'Today is a data point. Make it one worth plotting.',
  'Keep building. The compounding is invisible until it is obvious.',
];
