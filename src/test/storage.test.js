import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  loadData, saveData, saveDataNow, removeData, clearAllData, onStorageError, flushPending, K,
} from '../utils/storage.js';

describe('storage', () => {
  beforeEach(() => localStorage.clear());

  it('returns the fallback when a key is missing', () => {
    expect(loadData('sl_missing', { a: 1 })).toEqual({ a: 1 });
  });

  it('falls back and reports when JSON is corrupt', () => {
    const spy = vi.fn();
    const off = onStorageError(spy);
    localStorage.setItem(K.SUBJECTS, '{ this is not json');

    expect(loadData(K.SUBJECTS, [])).toEqual([]);
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'corrupt' }));
    // the corrupt key is cleaned up so it cannot break the next load
    expect(localStorage.getItem(K.SUBJECTS)).toBeNull();
    off();
  });

  it('treats the literal string "undefined" as missing', () => {
    localStorage.setItem('sl_x', 'undefined');
    expect(loadData('sl_x', 'fallback')).toBe('fallback');
  });

  it('writes immediately with saveDataNow', () => {
    saveDataNow(K.SETTINGS, { userName: 'Naveen' });
    expect(JSON.parse(localStorage.getItem(K.SETTINGS))).toEqual({ userName: 'Naveen' });
  });

  it('debounces saveData by 300ms and coalesces writes', async () => {
    vi.useFakeTimers();
    saveData('sl_debounced', 1);
    saveData('sl_debounced', 2);
    saveData('sl_debounced', 3);
    expect(localStorage.getItem('sl_debounced')).toBeNull();
    vi.advanceTimersByTime(305);
    expect(localStorage.getItem('sl_debounced')).toBe('3');
    vi.useRealTimers();
  });

  it('flushes pending writes on demand (pagehide path)', () => {
    vi.useFakeTimers();
    saveData('sl_flush', 'value');
    expect(localStorage.getItem('sl_flush')).toBeNull();
    flushPending();
    expect(localStorage.getItem('sl_flush')).toBe('"value"');
    vi.useRealTimers();
  });

  it('catches QuotaExceededError and reports instead of throwing', () => {
    const spy = vi.fn();
    const off = onStorageError(spy);
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      const err = new Error('full');
      err.name = 'QuotaExceededError';
      throw err;
    };

    expect(() => saveDataNow(K.SESSIONS, [1, 2, 3])).not.toThrow();
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ type: 'quota' }));

    Storage.prototype.setItem = original;
    off();
  });

  it('clears every namespaced key', () => {
    saveDataNow(K.SETTINGS, { a: 1 });
    saveDataNow(K.SESSIONS, [1]);
    localStorage.setItem('unrelated', 'keep me');
    clearAllData();
    expect(localStorage.getItem(K.SETTINGS)).toBeNull();
    expect(localStorage.getItem(K.SESSIONS)).toBeNull();
    expect(localStorage.getItem('unrelated')).toBe('keep me');
  });

  it('removeData is safe on a missing key', () => {
    expect(() => removeData('sl_nope')).not.toThrow();
  });
});
