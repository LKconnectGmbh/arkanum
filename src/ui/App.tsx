/** Platzhalter bis Etappe 2: zeigt nur, dass die Engine läuft. */
import { useMemo } from 'react';
import { newGame } from '../engine/rules';
import { randomSeed } from '../engine/rng';

export function App() {
  const st = useMemo(() => newGame('normal', randomSeed()), []);
  return (
    <main style={{ padding: 16, color: 'var(--sternweiss)' }}>
      <h1>Arkanum</h1>
      <p>Engine bereit. Zug {st.turn}, {st.hand.length} Handkarten, {st.market.length} Marktkarten.</p>
    </main>
  );
}
