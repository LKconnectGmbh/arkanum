/**
 * Balance-Tabelle wie `python3 tools/balance_sim.py`.
 * Aufruf: npm run balance [-- --games 3000 --seed 1]
 */
import { runBatch } from '../src/engine/sim';
import { POLICIES } from '../src/engine/bots';
import type { Difficulty } from '../src/engine/types';

const args = process.argv.slice(2);
function arg(name: string, def: number): number {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] ? Number(args[i + 1]) : def;
}
const games = arg('games', 3000);
const seed = arg('seed', 1);

const diffs: Difficulty[] = ['leicht', 'normal', 'schwer'];
const t0 = Date.now();
for (const d of diffs) {
  for (const p of POLICIES) {
    const r = runBatch(d, p, games, seed);
    const w = (r.winRate * 100).toFixed(1).padStart(5);
    console.log(
      `${d.padEnd(7)} ${p.padEnd(6)} Sieg ${w}%  Ø Züge bis Sieg ${r.avgTurnsToWin.toFixed(1).padStart(4)}  Ø Betäubungen ${r.avgStuns.toFixed(2)}`,
    );
  }
}
console.error(`(${games} Partien je Zeile, Seed ${seed}, ${((Date.now() - t0) / 1000).toFixed(1)} s)`);
