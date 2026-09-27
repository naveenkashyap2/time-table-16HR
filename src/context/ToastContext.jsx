import { createContext, useCallback, useContext, useMemo, useReducer, useRef } from 'react';
import { uid } from '../utils/id.js';

/**
 * ToastContext — PRD §10.16
 * Top-right (desktop) / top-center (mobile), 3.5 s auto-dismiss, aria-live polite.
 */

const AUTO_DISMISS_MS = 3500;
const MAX_VISIBLE = 4;

const ToastStateContext = createContext([]);
const ToastApiContext = createContext(null);

function reducer(state, action) {
  switch (action.type) {
    case 'PUSH':
      return [...state, action.toast].slice(-MAX_VISIBLE);
    case 'DISMISS':
      return state.filter((t) => t.id !== action.id);
    case 'CLEAR':
      return [];
    default:
      return state;
  }
}

export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(reducer, []);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    const t = timers.current.get(id);
    if (t) {
      clearTimeout(t);
      timers.current.delete(id);
    }
    dispatch({ type: 'DISMISS', id });
  }, []);

  const push = useCallback(
    (toast) => {
      const id = uid('toast');
      const next = {
        id,
        type: 'info',
        title: '',
        message: '',
        duration: AUTO_DISMISS_MS,
        ...(typeof toast === 'string' ? { title: toast } : toast),
      };
      dispatch({ type: 'PUSH', toast: next });
      if (next.duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => {
            timers.current.delete(id);
            dispatch({ type: 'DISMISS', id });
          }, next.duration),
        );
      }
      return id;
    },
    [],
  );

  const api = useMemo(
    () => ({
      push,
      dismiss,
      clear: () => dispatch({ type: 'CLEAR' }),
      success: (title, message) => push({ type: 'success', title, message }),
      error: (title, message) => push({ type: 'error', title, message, duration: 5000 }),
      info: (title, message) => push({ type: 'info', title, message }),
      achievement: (title, message) =>
        push({ type: 'achievement', title, message, duration: 5000 }),
    }),
    [push, dismiss],
  );

  return (
    <ToastApiContext.Provider value={api}>
      <ToastStateContext.Provider value={toasts}>{children}</ToastStateContext.Provider>
    </ToastApiContext.Provider>
  );
}

export function useToasts() {
  return useContext(ToastStateContext);
}

export function useToast() {
  const ctx = useContext(ToastApiContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
