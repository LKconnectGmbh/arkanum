/** Antippen und langes Drücken ohne Ziehen, mit Pointer-Ereignissen. */
import { useCallback, useRef } from 'react';
import type { MouseEvent as RMouseEvent, PointerEvent as RPointerEvent } from 'react';

const LONG_MS = 450;
const MOVE_PX = 10;

export function usePress(onTap: () => void, onLong?: () => void) {
  const timer = useRef<number | null>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const fired = useRef(false);

  const clear = () => {
    if (timer.current !== null) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const onPointerDown = useCallback(
    (e: RPointerEvent) => {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      start.current = { x: e.clientX, y: e.clientY };
      fired.current = false;
      clear();
      if (onLong) {
        timer.current = window.setTimeout(() => {
          fired.current = true;
          timer.current = null;
          if (navigator.vibrate) navigator.vibrate(15);
          onLong();
        }, LONG_MS);
      }
    },
    [onLong],
  );

  const onPointerMove = useCallback((e: RPointerEvent) => {
    if (!start.current) return;
    if (Math.abs(e.clientX - start.current.x) > MOVE_PX || Math.abs(e.clientY - start.current.y) > MOVE_PX) {
      clear();
      start.current = null;
    }
  }, []);

  const onPointerUp = useCallback(() => {
    const active = start.current !== null;
    clear();
    start.current = null;
    if (active && !fired.current) onTap();
  }, [onTap]);

  const onPointerCancel = useCallback(() => {
    clear();
    start.current = null;
  }, []);

  return { onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onContextMenu: (e: RMouseEvent) => e.preventDefault() };
}
