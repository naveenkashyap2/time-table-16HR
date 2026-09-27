/** Heatmap intensity buckets — PRD §9.5 */
export const HEAT_BANDS = [
  { level: 0, label: 'No study', min: 0, max: 0 },
  { level: 1, label: 'Up to 3h', min: 1, max: 179 },
  { level: 2, label: '3h – 7h', min: 180, max: 419 },
  { level: 3, label: '7h – 11h', min: 420, max: 659 },
  { level: 4, label: '11h and above', min: 660, max: Infinity },
];

export function heatLevel(completedMinutes) {
  const m = Number(completedMinutes) || 0;
  if (m <= 0) return 0;
  if (m < 180) return 1;
  if (m < 420) return 2;
  if (m < 660) return 3;
  return 4;
}
