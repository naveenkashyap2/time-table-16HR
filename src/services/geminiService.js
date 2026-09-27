/**
 * geminiService — PRD §12.3
 * The ONLY network dependency in StudyLoop.
 *
 *   generateDailyQuote(force = false) → { text, source: 'gemini' | 'fallback' }
 *
 * • Cached once per local day in `sl_quote_cache` → zero network on revisits.
 * • Manual refresh (force) is rate limited to 10 fetches per day.
 * • Any failure (offline / 4xx / 5xx / missing key / timeout) falls back to a
 *   deterministic local quote. Components never see the endpoint or the key.
 */
import { K, loadData, saveDataNow } from '../utils/storage.js';
import { todayKey, dayOfYear } from '../utils/dateUtils.js';
import { FALLBACK_QUOTES } from '../data/fallbackQuotes.js';

const MODEL = 'gemini-2.0-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const TIMEOUT_MS = 8000;
export const MANUAL_LIMIT = 10;

let warnedMissingKey = false;

const TONE_PROMPTS = {
  discipline: 'discipline, consistency and showing up every single day',
  focus: 'deep focus, avoiding distraction and protecting attention',
  growth: 'growth, learning compounding over time and long-term thinking',
  grind: 'relentless effort, hard work and outworking yesterday',
};

/** Deterministic offline quote for a given day (§12.3). */
export function getFallbackQuote(date = new Date()) {
  const idx = dayOfYear(date) % FALLBACK_QUOTES.length;
  return FALLBACK_QUOTES[idx];
}

function buildPrompt(tone) {
  const topic = TONE_PROMPTS[tone] || TONE_PROMPTS.discipline;
  return [
    'Write ONE short motivational line for a software developer who is studying',
    '16 hours a day for job interviews and side projects.',
    `Theme: ${topic}.`,
    'Rules: maximum 140 characters, a single sentence, no hashtags,',
    'no emoji, no surrounding quotation marks, no attribution, no preamble.',
    'Return only the sentence itself.',
  ].join(' ');
}

function cleanText(raw) {
  if (!raw) return '';
  return String(raw)
    .replace(/^\s*["'“”‘’`]+|["'“”‘’`]+\s*$/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 180);
}

export function readCache() {
  return loadData(K.QUOTE_CACHE, null);
}

function writeCache(next) {
  saveDataNow(K.QUOTE_CACHE, next);
  return next;
}

/** Manual fetches already used today. */
export function manualCountToday() {
  const cache = readCache();
  return cache && cache.date === todayKey() ? cache.manualCountToday || 0 : 0;
}

export function manualFetchesLeft() {
  return Math.max(0, MANUAL_LIMIT - manualCountToday());
}

/**
 * @param {boolean} force bypass the daily cache (manual "New Quote")
 * @param {{tone?: string, signal?: AbortSignal}} [opts]
 * @returns {Promise<{text:string, source:'gemini'|'fallback', cached:boolean, limited?:boolean, error?:string}>}
 */
export async function generateDailyQuote(force = false, opts = {}) {
  const date = todayKey();
  const cache = readCache();
  const tone = opts.tone || 'discipline';

  /* ---- cache hit: zero network (§12.3) ---- */
  if (!force && cache && cache.date === date && cache.text) {
    return { text: cache.text, source: cache.source || 'fallback', cached: true };
  }

  const usedToday = cache && cache.date === date ? cache.manualCountToday || 0 : 0;

  /* ---- manual rate limit ---- */
  if (force && usedToday >= MANUAL_LIMIT) {
    const text = cache?.text || getFallbackQuote();
    return {
      text,
      source: cache?.source || 'fallback',
      cached: true,
      limited: true,
      error: `Daily limit of ${MANUAL_LIMIT} manual quotes reached.`,
    };
  }

  const nextManualCount = force ? usedToday + 1 : usedToday;
  const key = import.meta.env?.VITE_GEMINI_API_KEY;

  /* ---- no key → silent fallback, warn once ---- */
  if (!key) {
    if (!warnedMissingKey) {
      warnedMissingKey = true;
      console.warn(
        '[StudyLoop] VITE_GEMINI_API_KEY is not set — using offline quotes. Add it to .env to enable Gemini.',
      );
    }
    const text = getFallbackQuote();
    writeCache({ date, text, source: 'fallback', manualCountToday: nextManualCount });
    return { text, source: 'fallback', cached: false, error: 'missing-key' };
  }

  /* ---- network with an 8 s abort ---- */
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  if (opts.signal) {
    opts.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch(`${ENDPOINT}?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: buildPrompt(tone) }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 60 },
      }),
    });

    if (!res.ok) throw new Error(`Gemini responded ${res.status}`);

    const data = await res.json();
    const text = cleanText(data?.candidates?.[0]?.content?.parts?.[0]?.text);
    if (!text) throw new Error('Empty Gemini response');

    writeCache({ date, text, source: 'gemini', manualCountToday: nextManualCount });
    return { text, source: 'gemini', cached: false };
  } catch (err) {
    const text = getFallbackQuote();
    writeCache({ date, text, source: 'fallback', manualCountToday: nextManualCount });
    return {
      text,
      source: 'fallback',
      cached: false,
      error: err?.name === 'AbortError' ? 'timeout' : String(err?.message || err),
    };
  } finally {
    clearTimeout(timeout);
  }
}
