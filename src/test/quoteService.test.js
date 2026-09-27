import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generateDailyQuote, getFallbackQuote, manualFetchesLeft, MANUAL_LIMIT } from '../services/geminiService.js';
import { FALLBACK_QUOTES } from '../data/fallbackQuotes.js';
import { K, saveDataNow } from '../utils/storage.js';
import { todayKey } from '../utils/dateUtils.js';

const okResponse = (text) => ({
  ok: true,
  json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
});

describe('gemini quote service', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubEnv('VITE_GEMINI_API_KEY', 'test-key');
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('fetches once per day and serves the cache afterwards', async () => {
    const fetchMock = vi.fn().mockResolvedValue(okResponse('Stay consistent today.'));
    vi.stubGlobal('fetch', fetchMock);

    const first = await generateDailyQuote(false);
    expect(first.source).toBe('gemini');
    expect(first.text).toBe('Stay consistent today.');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const second = await generateDailyQuote(false);
    expect(second.cached).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1); // ZERO extra network
  });

  it('strips wrapping quotes from the model output', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse('"Do the work."')));
    const res = await generateDailyQuote(false);
    expect(res.text).toBe('Do the work.');
  });

  it('falls back on a 500 without throwing', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }));
    const res = await generateDailyQuote(false);
    expect(res.source).toBe('fallback');
    expect(FALLBACK_QUOTES).toContain(res.text);
  });

  it('falls back when the network is offline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    const res = await generateDailyQuote(false);
    expect(res.source).toBe('fallback');
  });

  it('falls back silently when no API key is configured', async () => {
    vi.stubEnv('VITE_GEMINI_API_KEY', '');
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const res = await generateDailyQuote(false);
    expect(res.source).toBe('fallback');
    expect(res.error).toBe('missing-key');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('limits manual refreshes to 10 per day', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse('Another line.')));
    saveDataNow(K.QUOTE_CACHE, {
      date: todayKey(), text: 'cached', source: 'gemini', manualCountToday: MANUAL_LIMIT,
    });

    expect(manualFetchesLeft()).toBe(0);
    const res = await generateDailyQuote(true);
    expect(res.limited).toBe(true);
    expect(res.text).toBe('cached');
  });

  it('counts each manual refresh against the limit', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(okResponse('Line.')));
    await generateDailyQuote(false);
    expect(manualFetchesLeft()).toBe(MANUAL_LIMIT);
    await generateDailyQuote(true);
    expect(manualFetchesLeft()).toBe(MANUAL_LIMIT - 1);
  });

  it('picks a deterministic fallback per day', () => {
    const a = getFallbackQuote(new Date(2026, 0, 1));
    const b = getFallbackQuote(new Date(2026, 0, 1));
    expect(a).toBe(b);
    expect(FALLBACK_QUOTES).toContain(a);
  });
});
