/**
 * Bewegung: fliegende Karten (250 ms), Schadenszahlen (600 ms). Die Spiellogik wartet nie darauf.
 * Bei prefers-reduced-motion überblenden statt fliegen (per CSS).
 */
import { useCallback, useRef, useState } from 'react';
import { HandCard } from './Card';

export interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export function rectOfSelector(sel: string): Rect | null {
  const el = document.querySelector(sel);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (!r.width) return null;
  return { left: r.left, top: r.top, width: r.width, height: r.height };
}

interface Flight {
  id: number;
  cardId: string;
  from: Rect;
  to: Rect;
}

interface Float {
  id: number;
  x: number;
  y: number;
  text: string;
  cls: string;
}

export function useEffects() {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [floats, setFloats] = useState<Float[]>([]);
  const seq = useRef(1);

  const fly = useCallback((cardId: string, from: Rect | null, to: Rect | null) => {
    if (!from || !to) return;
    const id = seq.current++;
    setFlights((f) => [...f, { id, cardId, from, to }]);
    window.setTimeout(() => setFlights((f) => f.filter((x) => x.id !== id)), 320);
  }, []);

  const float = useCallback((sel: string, text: string, cls: string, offsetY = -8) => {
    const r = rectOfSelector(sel);
    if (!r) return;
    const id = seq.current++;
    setFloats((f) => [...f, { id, x: r.left + r.width / 2, y: r.top + offsetY, text, cls }]);
    window.setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 700);
  }, []);

  const node = (
    <div className="fx-layer" aria-hidden>
      {flights.map((f) => (
        <FlyingCard key={f.id} flight={f} />
      ))}
      {floats.map((f) => (
        <span key={f.id} className={`float ${f.cls}`} style={{ left: f.x, top: f.y }}>{f.text}</span>
      ))}
    </div>
  );

  return { fly, float, node };
}

function FlyingCard({ flight }: { flight: Flight }) {
  const [go, setGo] = useState(false);
  // nächster Frame: Zielposition setzen, CSS-Transition übernimmt
  if (!go) requestAnimationFrame(() => setGo(true));
  const w = 60;
  const h = 84;
  const from = { left: flight.from.left + flight.from.width / 2 - w / 2, top: flight.from.top + flight.from.height / 2 - h / 2 };
  const to = { left: flight.to.left + flight.to.width / 2 - w / 2, top: flight.to.top + flight.to.height / 2 - h / 2 };
  const pos = go ? to : from;
  return (
    <div className={`flying ${go ? 'go' : ''}`} style={{ left: pos.left, top: pos.top, width: w, height: h }}>
      <HandCard cardId={flight.cardId} width={w} onTap={() => {}} />
    </div>
  );
}
