/** Anzeige der Siegchance: Chip in der Kopfleiste, Einstellungsblatt, Verlaufskurve am Partieende. */
import { useState } from 'react';
import type { ChancePoint } from './store';
import type { ChanceMode } from './settings';

export function trendOf(points: ChancePoint[], turn: number): { arrow: string; label: string; delta: number } {
  const cur = points.find((p) => p.turn === turn);
  const prev = points.filter((p) => p.turn < turn).pop();
  if (!cur || !prev) return { arrow: '→', label: 'gleichbleibend', delta: 0 };
  const d = cur.percent - prev.percent;
  if (d >= 3) return { arrow: '↗', label: 'besser als im letzten Zug', delta: d };
  if (d <= -3) return { arrow: '↘', label: 'schlechter als im letzten Zug', delta: d };
  return { arrow: '→', label: 'wie im letzten Zug', delta: d };
}

export function ChanceBadge({
  points,
  turn,
  mode,
  computing,
  onTap,
}: {
  points: ChancePoint[];
  turn: number;
  mode: 'off' | 'trend' | 'number';
  computing: boolean;
  onTap: () => void;
}) {
  if (mode === 'off') return null;
  const cur = points.find((p) => p.turn === turn);
  const trend = trendOf(points, turn);
  const text =
    mode === 'number'
      ? cur
        ? `${cur.percent} % ±${cur.margin}`
        : computing
          ? '…'
          : '–'
      : cur
        ? trend.arrow
        : '…';
  const label =
    mode === 'number'
      ? cur
        ? `Siegchance bei solider Spielweise: ${cur.percent} Prozent, plus minus ${cur.margin}, ${trend.label}`
        : 'Siegchance wird berechnet'
      : `Siegchance-Trend: ${trend.label}`;
  return (
    <button type="button" className={`chance-chip ${computing ? 'computing' : ''}`} onClick={onTap} aria-label={label} title="Siegchance bei solider Spielweise">
      <span className="chance-row">
        <span className="chance-main">{text}</span>
        {mode === 'number' && cur && <span className="chance-arrow" aria-hidden>{trend.arrow}</span>}
      </span>
      <span className="chance-sub" aria-hidden>solide</span>
    </button>
  );
}

export function ChanceSettings({ mode, onChange, lastMs }: { mode: ChanceMode; onChange: (m: ChanceMode) => void; lastMs: number | null }) {
  const opts: { v: ChanceMode; t: string; d: string }[] = [
    { v: 'auto', t: 'Je nach Stufe', d: 'Leicht und Normal: Zahl, Schwer: nur Trendpfeil' },
    { v: 'number', t: 'Zahl mit Trend', d: 'z. B. „58 % ±7 ↗“' },
    { v: 'trend', t: 'Nur Trendpfeil', d: 'besser, gleich oder schlechter als im letzten Zug' },
    { v: 'off', t: 'Aus', d: 'keine Anzeige; die Kurve am Partieende bleibt' },
  ];
  return (
    <div className="chance-settings">
      <p className="hint">
        Zu Beginn jedes Zugs spielt ein Rechenkern 200 Partien vom aktuellen Stand mit einem soliden, aber nicht perfekten Spielstil zu Ende.
        Die Zahl ist eine Schätzung mit etwa ±7 Punkten Unschärfe. Sie ändert sich nur am Zugbeginn, nie durch Käufe oder Rückgängig im Zug.
      </p>
      <div className="chance-opts">
        {opts.map((o) => (
          <button key={o.v} type="button" className={`btn chance-opt ${mode === o.v ? 'active' : ''}`} onClick={() => onChange(o.v)} aria-pressed={mode === o.v}>
            <span>{o.t}</span>
            <small>{o.d}</small>
          </button>
        ))}
      </div>
      {lastMs !== null && <p className="hint">Letzte Berechnung: {lastMs} ms.</p>}
    </div>
  );
}

/** Verlaufskurve der Siegchance über alle Züge, mit Markierung des größten Sprungs. */
export function ChanceCurve({ points, result }: { points: ChancePoint[]; result: 'win' | 'loss' | null }) {
  const [active, setActive] = useState<number | null>(null);
  if (points.length < 2) return <p className="hint">Zu wenige Messpunkte für eine Kurve.</p>;
  const W = 320;
  const H = 150;
  const padL = 30;
  const padR = 12;
  const padT = 14;
  const padB = 24;
  const turns = points.map((p) => p.turn);
  const tMin = Math.min(...turns);
  const tMax = Math.max(...turns);
  const x = (t: number) => padL + ((t - tMin) / Math.max(1, tMax - tMin)) * (W - padL - padR);
  const y = (v: number) => padT + (1 - v / 100) * (H - padT - padB);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(p.turn).toFixed(1)},${y(p.percent).toFixed(1)}`).join(' ');
  // größter Sprung
  let jumpIdx = 1;
  let jump = 0;
  for (let i = 1; i < points.length; i++) {
    const d = Math.abs(points[i].percent - points[i - 1].percent);
    if (d > jump) {
      jump = d;
      jumpIdx = i;
    }
  }
  const jp = points[jumpIdx];
  const jd = jp.percent - points[jumpIdx - 1].percent;
  const ap = active !== null ? points.find((p) => p.turn === active) : null;
  const tickTurns = turns.filter((t, i) => i === 0 || i === turns.length - 1 || t % 5 === 0);
  return (
    <figure className="chance-fig">
      <figcaption className="hint">Siegchance bei solider Spielweise, je Zug 200 simulierte Partien. Größter Sprung: Zug {jp.turn} ({jd > 0 ? '+' : ''}{jd} Punkte).</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="chance-svg" role="img" aria-label={`Verlauf der Siegchance von Zug ${tMin} bis ${tMax}`} onMouseLeave={() => setActive(null)}>
        {[0, 25, 50, 75, 100].map((v) => (
          <g key={v}>
            <line x1={padL} x2={W - padR} y1={y(v)} y2={y(v)} className="grid" />
            <text x={padL - 4} y={y(v) + 3} className="tick" textAnchor="end">{v}</text>
          </g>
        ))}
        {tickTurns.map((t) => (
          <text key={t} x={x(t)} y={H - 6} className="tick" textAnchor="middle">{t}</text>
        ))}
        <path d={path} className="line" />
        {result && (
          <circle cx={x(points[points.length - 1].turn)} cy={y(result === 'win' ? 100 : 0)} r="4" className={`end ${result}`} />
        )}
        <circle cx={x(jp.turn)} cy={y(jp.percent)} r="5" className="jump" />
        <text x={x(jp.turn)} y={y(jp.percent) - 9} className="jump-label" textAnchor={jp.turn > (tMin + tMax) / 2 ? 'end' : 'start'}>
          Zug {jp.turn}: {jd > 0 ? '+' : ''}{jd}
        </text>
        {points.map((p) => (
          <rect key={p.turn} x={x(p.turn) - 8} y={0} width={16} height={H} fill="transparent" onMouseEnter={() => setActive(p.turn)} onClick={() => setActive(active === p.turn ? null : p.turn)} />
        ))}
        {ap && (
          <g pointerEvents="none">
            <line x1={x(ap.turn)} x2={x(ap.turn)} y1={padT} y2={H - padB} className="crosshair" />
            <circle cx={x(ap.turn)} cy={y(ap.percent)} r="4" className="hover" />
            <rect x={Math.min(x(ap.turn) + 8, W - 92)} y={Math.max(2, y(ap.percent) - 26)} width={84} height={20} rx={4} className="tip" />
            <text x={Math.min(x(ap.turn) + 8, W - 92) + 42} y={Math.max(2, y(ap.percent) - 26) + 14} className="tip-text" textAnchor="middle">
              Zug {ap.turn}: {ap.percent} % ±{ap.margin}
            </text>
          </g>
        )}
      </svg>
      <table className="sr-only">
        <caption>Siegchance je Zug</caption>
        <thead><tr><th>Zug</th><th>Siegchance</th></tr></thead>
        <tbody>
          {points.map((p) => (
            <tr key={p.turn}><td>{p.turn}</td><td>{p.percent} % ±{p.margin}</td></tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
