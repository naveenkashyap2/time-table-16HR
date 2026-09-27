import { useCallback, useEffect, useRef, useState } from 'react';
import {
  generateDailyQuote,
  manualFetchesLeft,
  readCache,
  MANUAL_LIMIT,
} from '../services/geminiService.js';
import { todayKey } from '../utils/dateUtils.js';
import { useSettings } from '../context/StudyContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

/**
 * useQuote — daily motivational line (PRD §10.2 / §12.3).
 * Reads the cache synchronously so a revisit paints instantly with no network.
 */
export function useQuote() {
  const settings = useSettings();
  const toast = useToast();
  const tone = settings.quote?.tone || 'discipline';
  const enabled = settings.quote?.enabled !== false;

  const cached = readCache();
  const hasFreshCache = Boolean(cached && cached.date === todayKey() && cached.text);

  const [quote, setQuote] = useState(() =>
    hasFreshCache ? { text: cached.text, source: cached.source || 'fallback' } : null,
  );
  const [loading, setLoading] = useState(() => enabled && !hasFreshCache);
  const [left, setLeft] = useState(() => manualFetchesLeft());
  const abortRef = useRef(null);

  /* Automatic once-per-day fetch. */
  useEffect(() => {
    if (!enabled || hasFreshCache) {
      setLoading(false);
      return undefined;
    }
    let alive = true;
    setLoading(true);
    generateDailyQuote(false, { tone })
      .then((res) => {
        if (!alive) return;
        setQuote({ text: res.text, source: res.source });
        setLeft(manualFetchesLeft());
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled]);

  /** "New Quote" button — force = true, rate limited to 10/day. */
  const refresh = useCallback(async () => {
    if (!enabled || loading) return;
    setLoading(true);
    abortRef.current?.abort?.();
    const controller = new AbortController();
    abortRef.current = controller;

    const res = await generateDailyQuote(true, { tone, signal: controller.signal });
    setQuote({ text: res.text, source: res.source });
    setLeft(manualFetchesLeft());
    setLoading(false);

    if (res.limited) {
      toast.info('Daily quote limit reached', `You can refresh ${MANUAL_LIMIT} times per day.`);
    } else if (res.source === 'fallback') {
      // Toast only on MANUAL failure, per §12.3.
      toast.info('Offline quote shown', 'Gemini was unreachable — here is a local one.');
    } else {
      toast.success('New quote generated', 'Fresh motivation, straight from Gemini.');
    }
  }, [enabled, loading, tone, toast]);

  useEffect(() => () => abortRef.current?.abort?.(), []);

  return { quote, loading, refresh, fetchesLeft: left, enabled, limit: MANUAL_LIMIT };
}
