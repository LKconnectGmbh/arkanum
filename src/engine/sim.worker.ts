/** Web Worker: spielt vom übergebenen Stand Partien mit dem guten Bot zu Ende und meldet die Siegchance. */
import { estimateWinChance, type WinChance } from './sim';
import { newGame } from './rules';
import type { GameState } from './types';

export interface ChanceRequest {
  id: number;
  state: GameState | null;
  games: number;
  seed: number;
}

export interface ChanceResponse {
  id: number;
  turn: number;
  result: WinChance;
  ms: number;
  /** false = erste Hälfte, Ergebnis wird noch verfeinert */
  final: boolean;
}

self.onmessage = (e: MessageEvent<ChanceRequest>) => {
  const { id, games, seed } = e.data;
  // Aufwärmen ohne Spielstand: JIT auf Touren bringen, kein Ergebnis melden
  if (!e.data.state) {
    estimateWinChance(newGame('normal', seed), games, seed);
    return;
  }
  const state = e.data.state;
  const t0 = performance.now();
  // Zwei Hälften: die erste liefert schnell eine grobe Zahl, die zweite verfeinert sie
  const half = Math.floor(games / 2);
  const a = estimateWinChance(state, half, seed);
  (self as unknown as Worker).postMessage({ id, turn: state.turn, result: a, ms: Math.round(performance.now() - t0), final: false } satisfies ChanceResponse);
  const b = estimateWinChance(state, games - half, seed ^ 0x5bd1e995);
  const wins = a.wins + b.wins;
  const p = wins / games;
  const result: WinChance = { games, wins, percent: Math.round(p * 100), margin: Math.round(196 * Math.sqrt((p * (1 - p)) / games)) };
  (self as unknown as Worker).postMessage({ id, turn: state.turn, result, ms: Math.round(performance.now() - t0), final: true } satisfies ChanceResponse);
};
