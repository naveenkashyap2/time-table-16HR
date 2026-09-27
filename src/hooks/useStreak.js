import { useMemo } from 'react';
import { useStudy } from '../context/StudyContext.jsx';
import { computeStreak } from '../utils/streakUtils.js';
import { todayKey } from '../utils/dateUtils.js';

/** Memoised streak engine (PRD §9.4 / §7.3). */
export function useStreak() {
  const { dailyRecords, settings } = useStudy();
  const threshold = settings.streakThresholdPercent ?? 70;
  const key = todayKey();

  return useMemo(
    () => computeStreak(dailyRecords, threshold, key),
    [dailyRecords, threshold, key],
  );
}
