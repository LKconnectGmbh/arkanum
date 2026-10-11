/** Kurzer Zeitmesser für die Siegchance: npm run bench */
import { newGame, cloneState } from '../src/engine/rules';
import { estimateWinChance, hideInformation, playOut } from '../src/engine/sim';
import { botTurn } from '../src/engine/bots';

const st = newGame('normal', 42);
for (let i = 0; i < 2; i++) botTurn(st, 'gut', { rng: 7 });
// warm
estimateWinChance(st, 100, 1);
for (const games of [200, 200, 200]) {
  const t0 = performance.now();
  const r = estimateWinChance(st, games, 3);
  console.log(`${games} Partien: ${(performance.now() - t0).toFixed(0)} ms → ${r.percent} % ±${r.margin}`);
}
let t0 = performance.now();
for (let i = 0; i < 200; i++) cloneState(st);
console.log(`200× cloneState: ${(performance.now() - t0).toFixed(1)} ms`);
t0 = performance.now();
for (let i = 0; i < 200; i++) hideInformation(st, i);
console.log(`200× hideInformation: ${(performance.now() - t0).toFixed(1)} ms`);
t0 = performance.now();
let turns = 0;
for (let i = 0; i < 200; i++) { const s = hideInformation(st, i); turns += playOut(s, 'gut', { rng: i }).turns; }
console.log(`200× playOut: ${(performance.now() - t0).toFixed(1)} ms, Ø ${(turns / 200).toFixed(1)} Züge`);
