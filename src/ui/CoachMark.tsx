/**
 * Hinweisblase mit Aussparung: Schleier 60 %, Ziel bleibt frei und antippbar, Blase nie über dem Ziel.
 * Platzierung: unterhalb, oberhalb, rechts, links (seitlich ab 600 px); sonst Leiste am gegenüberliegenden Rand.
 */
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

const GAP = 12;
const HOLE_PAD = 8;
const SAFE = 12;

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

function rectOf(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

function safeInsets() {
  const cs = getComputedStyle(document.documentElement);
  const num = (v: string) => parseFloat(v) || 0;
  return {
    top: num(cs.getPropertyValue('--sa-top')) + SAFE,
    right: num(cs.getPropertyValue('--sa-right')) + SAFE,
    bottom: num(cs.getPropertyValue('--sa-bottom')) + SAFE,
    left: num(cs.getPropertyValue('--sa-left')) + SAFE,
  };
}

export interface CoachMarkProps {
  /** data-tut-Wert des Ziels; null = Blase mittig ohne Ziel */
  target: string | null;
  text?: string;
  /** nur Aussparung, keine Blase */
  silent?: boolean;
  /** abdunkeln und alles außer dem Ziel sperren */
  dim: boolean;
  /** Knopf „Weiter“ */
  onNext?: () => void;
  /** Knopf „Verstanden“ (Kontexthinweis) */
  onClose?: () => void;
  /** Blase ausblenden, solange ein fremdes Blatt offen ist */
  sheetOpen: boolean;
  label?: string;
  /** Rückmeldung bei falschem Tipp */
  onMiss?: () => void;
  showMe?: boolean;
}

export function CoachMark(p: CoachMarkProps) {
  const [rect, setRect] = useState<Rect | null>(null);
  const [radius, setRadius] = useState(10);
  const [inSheet, setInSheet] = useState(false);
  const [found, setFound] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const [bubbleSize, setBubbleSize] = useState({ w: 0, h: 0 });
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const [shake, setShake] = useState(false);
  const [hand, setHand] = useState(false);

  // Ziel messen, immer wieder: Layout, Drehung, Größenänderung, visualViewport
  useEffect(() => {
    let raf = 0;
    let alive = true;
    const measure = () => {
      if (!alive) return;
      if (!p.target) {
        setFound(true);
        setRect(null);
        setInSheet(false);
        return;
      }
      const el = document.querySelector(`[data-tut="${p.target}"]`);
      if (!el) {
        setFound(false);
        return;
      }
      const r = rectOf(el);
      if (r.width === 0 && r.height === 0) {
        setFound(false);
        return;
      }
      setFound(true);
      setInSheet(!!el.closest('.sheet'));
      setRect((old) => (old && Math.abs(old.left - r.left) < 0.5 && Math.abs(old.top - r.top) < 0.5 && Math.abs(old.width - r.width) < 0.5 && Math.abs(old.height - r.height) < 0.5 ? old : r));
      const br = parseFloat(getComputedStyle(el).borderRadius) || 10;
      setRadius(br);
      const vv = window.visualViewport;
      const nw = vv ? vv.width : window.innerWidth;
      const nh = vv ? vv.height : window.innerHeight;
      setVp((o) => (o.w === nw && o.h === nh ? o : { w: nw, h: nh }));
    };
    const loop = () => {
      measure();
      raf = window.setTimeout(loop, 200) as unknown as number;
    };
    loop();
    const onChange = () => measure();
    window.addEventListener('resize', onChange);
    window.addEventListener('orientationchange', onChange);
    window.visualViewport?.addEventListener('resize', onChange);
    window.visualViewport?.addEventListener('scroll', onChange);
    const ro = new ResizeObserver(onChange);
    ro.observe(document.body);
    return () => {
      alive = false;
      window.clearTimeout(raf);
      window.removeEventListener('resize', onChange);
      window.removeEventListener('orientationchange', onChange);
      window.visualViewport?.removeEventListener('resize', onChange);
      window.visualViewport?.removeEventListener('scroll', onChange);
      ro.disconnect();
    };
  }, [p.target]);

  useLayoutEffect(() => {
    const b = bubbleRef.current;
    if (!b) return;
    const r = b.getBoundingClientRect();
    if (Math.abs(r.width - bubbleSize.w) > 0.5 || Math.abs(r.height - bubbleSize.h) > 0.5) setBubbleSize({ w: r.width, h: r.height });
  });

  // Fokus auf das Ziel, Blase ansagen
  useEffect(() => {
    if (!p.target || !found) return;
    const el = document.querySelector<HTMLElement>(`[data-tut="${p.target}"]`);
    if (el && typeof el.focus === 'function') el.focus({ preventScroll: true });
  }, [p.target, found]);

  const hidden = !found || (p.sheetOpen && !inSheet);
  if (hidden) return null;

  const ins = safeInsets();
  const hole: Rect | null = rect
    ? { left: rect.left - HOLE_PAD, top: rect.top - HOLE_PAD, width: rect.width + 2 * HOLE_PAD, height: rect.height + 2 * HOLE_PAD }
    : null;

  // Platzierung
  const bw = Math.min(320, vp.w - 32);
  const bh = bubbleSize.h || 72;
  let bubble: CSSProperties = {};
  let arrow: CSSProperties | null = null;
  type Placement = 'below' | 'above' | 'right' | 'left' | 'bar-top' | 'bar-bottom' | 'center';
  let placement: Placement = 'center';
  if (hole) {
    const cx = hole.left + hole.width / 2;
    const cy = hole.top + hole.height / 2;
    const fitsX = (left: number) => left >= ins.left && left + bw <= vp.w - ins.right;
    const fitsY = (top: number) => top >= ins.top && top + bh <= vp.h - ins.bottom;
    const clampX = (left: number) => Math.max(ins.left, Math.min(left, vp.w - ins.right - bw));
    const clampY = (top: number) => Math.max(ins.top, Math.min(top, vp.h - ins.bottom - bh));
    const candidates: { place: Placement; left: number; top: number; ok: boolean }[] = [];
    {
      const top = hole.top + hole.height + GAP;
      candidates.push({ place: 'below', left: clampX(cx - bw / 2), top, ok: fitsY(top) });
    }
    {
      const top = hole.top - GAP - bh;
      candidates.push({ place: 'above', left: clampX(cx - bw / 2), top, ok: fitsY(top) });
    }
    if (vp.w >= 600) {
      const l = hole.left + hole.width + GAP;
      candidates.push({ place: 'right', left: l, top: clampY(cy - bh / 2), ok: fitsX(l) });
      const l2 = hole.left - GAP - bw;
      candidates.push({ place: 'left', left: l2, top: clampY(cy - bh / 2), ok: fitsX(l2) });
    }
    const pick = candidates.find((c) => c.ok);
    if (pick) {
      placement = pick.place;
      bubble = { left: pick.left, top: pick.top, width: bw };
      // Pfeil: zeigt auf die Zielmitte, an den Blasenrand geklemmt
      if (placement === 'below' || placement === 'above') {
        const ax = Math.max(16, Math.min(cx - pick.left, bw - 16));
        arrow = placement === 'below' ? { left: ax - 8, top: -8 } : { left: ax - 8, bottom: -8 };
      } else {
        const ay = Math.max(16, Math.min(cy - pick.top, bh - 16));
        arrow = placement === 'right' ? { top: ay - 8, left: -8 } : { top: ay - 8, right: -8 };
      }
    } else {
      // Kein Platz: Leiste am gegenüberliegenden Rand
      placement = cy > vp.h / 2 ? 'bar-top' : 'bar-bottom';
      bubble = placement === 'bar-top' ? { left: ins.left, right: ins.right, top: ins.top } : { left: ins.left, right: ins.right, bottom: ins.bottom };
      const ax = Math.max(16, Math.min(cx - ins.left, vp.w - ins.left - ins.right - 16));
      arrow = placement === 'bar-top' ? { left: ax - 8, bottom: -8 } : { left: ax - 8, top: -8 };
    }
  } else {
    bubble = { left: '50%', top: '50%', transform: 'translate(-50%, -50%)', width: bw };
  }

  const miss = () => {
    if (!p.dim) return;
    setShake(true);
    window.setTimeout(() => setShake(false), 450);
    p.onMiss?.();
  };

  const showHand = () => {
    setHand(true);
    window.setTimeout(() => setHand(false), 2200);
  };

  return (
    <div className={`coach ${p.dim ? 'coach-dim' : ''}`} aria-hidden={false}>
      {p.dim && hole && (
        <>
          <div className="coach-veil" style={{ left: 0, top: 0, width: '100%', height: Math.max(0, hole.top) }} onClick={miss} />
          <div className="coach-veil" style={{ left: 0, top: hole.top + hole.height, width: '100%', bottom: 0 }} onClick={miss} />
          <div className="coach-veil" style={{ left: 0, top: hole.top, width: Math.max(0, hole.left), height: hole.height }} onClick={miss} />
          <div className="coach-veil" style={{ left: hole.left + hole.width, top: hole.top, right: 0, height: hole.height }} onClick={miss} />
        </>
      )}
      {p.dim && !hole && <div className="coach-veil" style={{ inset: 0 }} />}
      {hole && (
        <div
          className={`coach-hole ${shake ? 'shake' : ''} ${p.dim ? 'ring' : ''}`}
          style={{ left: hole.left, top: hole.top, width: hole.width, height: hole.height, borderRadius: radius + HOLE_PAD }}
          aria-hidden
        />
      )}
      {hand && hole && (
        <div className="coach-hand" style={{ left: hole.left + hole.width / 2, top: hole.top + hole.height / 2 }} aria-hidden>
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="var(--sternweiss)" strokeWidth="1.6" strokeLinejoin="round" strokeLinecap="round">
            <path d="M9 11V4.5a1.5 1.5 0 0 1 3 0V11m0-3a1.5 1.5 0 0 1 3 0v3m0-1.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6.5 7S6 18 5.5 15.5L4 11.5a1.4 1.4 0 0 1 2.6-.9L9 13" fill="rgba(14,16,32,0.7)" />
          </svg>
        </div>
      )}
      {!p.silent && (p.text || p.onNext || p.onClose) && (
        <div ref={bubbleRef} className={`coach-bubble place-${placement}`} style={bubble} role="dialog" aria-live="polite" aria-label={p.label ?? 'Hinweis'}>
          {arrow && <span className="coach-arrow" style={arrow} aria-hidden />}
          {p.label && <span className="coach-label">{p.label}</span>}
          {p.text && <p className="coach-text">{p.text}</p>}
          <div className="coach-actions">
            {p.showMe && p.dim && (
              <button type="button" className="btn btn-small" onClick={showHand}>Zeig’s mir</button>
            )}
            {p.onNext && (
              <button type="button" className="btn btn-small btn-primary" onClick={p.onNext}>Weiter</button>
            )}
            {p.onClose && (
              <button type="button" className="btn btn-small" onClick={p.onClose}>Verstanden</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
