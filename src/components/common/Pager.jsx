import { ChevronLeft, ChevronRight } from 'lucide-react';
import Button from './Button.jsx';

/** Pagination controls for long lists (25/page — §4.2). */
export default function Pager({ page, pageCount, from, to, total, onPrev, onNext, unit = 'items' }) {
  if (pageCount <= 1) {
    return total > 0 ? (
      <p className="small muted" style={{ textAlign: 'center', marginTop: 12 }}>
        {total} {unit}
      </p>
    ) : null;
  }

  return (
    <nav className="pager" aria-label="Pagination">
      <Button size="sm" variant="ghost" icon={ChevronLeft} onClick={onPrev} disabled={page <= 1}>
        Prev
      </Button>
      <span className="page-info">
        {from}–{to} of {total} {unit}
      </span>
      <Button
        size="sm"
        variant="ghost"
        iconRight={ChevronRight}
        onClick={onNext}
        disabled={page >= pageCount}
      >
        Next
      </Button>
    </nav>
  );
}
