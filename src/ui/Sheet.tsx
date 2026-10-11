/** Overlay über dem Spielfeld: Großansicht, Auswahl, Zusammenfassung. Schließen per Tipp daneben oder Wisch nach unten. */
import { useEffect, useRef, type ReactNode, type TouchEvent } from 'react';

export function Sheet({
  children,
  onClose,
  title,
  align = 'center',
  dismissible = true,
}: {
  children: ReactNode;
  onClose?: () => void;
  title?: string;
  align?: 'center' | 'bottom';
  dismissible?: boolean;
}) {
  const startY = useRef<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) el.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && dismissible && onClose) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dismissible, onClose]);

  const onTouchStart = (e: TouchEvent) => {
    startY.current = e.touches[0].clientY;
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (startY.current === null) return;
    const dy = e.changedTouches[0].clientY - startY.current;
    startY.current = null;
    if (dy > 70 && dismissible && onClose) onClose();
  };

  return (
    <div
      className={`sheet-backdrop sheet-${align}`}
      onClick={() => dismissible && onClose && onClose()}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        ref={ref}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <h2 className="sheet-title">{title}</h2>}
        {children}
      </div>
    </div>
  );
}
