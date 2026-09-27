import { useCallback, useState } from 'react';
import { loadData, saveData } from '../utils/storage.js';

/**
 * Tiny persisted-state hook for *UI* preferences only
 * (domain data always goes through StudyContext).
 */
export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => loadData(key, initialValue));

  const update = useCallback(
    (next) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? next(prev) : next;
        saveData(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, update];
}
