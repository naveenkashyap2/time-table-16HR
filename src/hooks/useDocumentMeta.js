import { useEffect } from 'react';

const DEFAULT_DESC =
  'Track your daily 16-hour study goal, subjects, tasks, DSA practice, projects, interview preparation and learning progress with StudyLoop.';

/**
 * useDocumentMeta — PRD §5.2 / §12.4
 * Every route sets its own <title> and meta description.
 */
export function useDocumentMeta(title, description = DEFAULT_DESC) {
  useEffect(() => {
    const full = title ? `${title} | StudyLoop` : '16 Hour Study Tracker | StudyLoop';
    document.title = full;

    const set = (selector, attr, value) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute(attr, value);
    };
    set('meta[name="description"]', 'content', description);
    set('meta[property="og:title"]', 'content', full);
    set('meta[property="og:description"]', 'content', description);
    set('meta[name="twitter:title"]', 'content', full);
    set('meta[name="twitter:description"]', 'content', description);
  }, [title, description]);
}

export default useDocumentMeta;
