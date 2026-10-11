/** Partien ohne Oberfläche zu Ende spielen: für Balance-Tests und die Live-Siegchance. */
import { botTurn, type Policy } from './bots';
import { rngInt, sample, shuffle, type RngState } from './rng';
import { cloneState, newGame } from './rules';
import { ENEMIES } from './data';
import type { Difficulty, GameState } from './types';

/** Partien, die länger dauern, zählen als Niederlage (wie in der Referenz). */
export const MAX_TURNS = 40;

export interface GameResult {
  win: boolean;
  turns: number;
  stuns: number;
}

/** Spielt den Zustand mit dem Bot zu Ende (verändert ihn). */
export function playOut(st: GameState, policy: Policy, rng: RngState): GameResult {
  while (!st.result) {
    if (st.turn > MAX_TURNS) break;
    botTurn(st, policy, rng);
  }
  return { win: st.result === 'win', turns: st.turn, stuns: st.stuns };
}

export interface BatchResult {
  games: number;
  wins: number;
  winRate: number;
  avgTurnsToWin: number;
  avgStuns: number;
}

export function runBatch(difficulty: Difficulty, policy: Policy, n: number, seed: number): BatchResult {
  const rng: RngState = { rng: seed >>> 0 };
  let wins = 0;
  let turnSum = 0;
  let stunSum = 0;
  for (let i = 0; i < n; i++) {
    const st = newGame(difficulty, rngInt(rng, 0x7fffffff));
    const r = playOut(st, policy, rng);
    if (r.win) {
      wins++;
      turnSum += r.turns;
    }
    stunSum += r.stuns;
  }
  return {
    games: n,
    wins,
    winRate: wins / n,
    avgTurnsToWin: wins ? turnSum / wins : 0,
    avgStuns: stunSum / n,
  };
}

/**
 * Mischt alles neu, was der Spieler nicht sehen kann: Nachziehstapel, Omen-Stapel, Marktstapel
 * und die noch nicht erschienenen Feinde. So „weiß“ die Siegchance nichts, was der Spieler nicht weiß.
 */
export function hideInformation(src: GameState, seed: number): GameState {
  const st = cloneState(src);
  st.rng = seed >>> 0;
  shuffle(st, st.deck);
  shuffle(st, st.omenPile);
  shuffle(st, st.marketPile);
  const seen = new Set<string>([...st.active, ...st.defeated].map((e) => e.id));
  const byAct = new Map<number, string[]>();
  for (const e of ENEMIES) if (e.act > 0 && !seen.has(e.id)) byAct.set(e.act, [...(byAct.get(e.act) ?? []), e.id]);
  for (const q of st.queue) {
    const pool = byAct.get(q.act) ?? [];
    if (!pool.length) continue;
    const pick = sample(st, pool, 1)[0];
    byAct.set(q.act, pool.filter((id) => id !== pick));
    q.id = pick;
  }
  return st;
}

export interface WinChance {
  games: number;
  wins: number;
  percent: number;
  /** halbe Breite des 95-%-Bands in Prozentpunkten */
  margin: number;
}

/** Siegchance vom aktuellen Stand mit dem guten Bot. */
export function estimateWinChance(src: GameState, games: number, seed: number): WinChance {
  const rng: RngState = { rng: seed >>> 0 };
  let wins = 0;
  for (let i = 0; i < games; i++) {
    const st = hideInformation(src, rngInt(rng, 0x7fffffff));
    if (playOut(st, 'gut', rng).win) wins++;
  }
  const p = wins / games;
  return { games, wins, percent: Math.round(p * 100), margin: Math.round(196 * Math.sqrt((p * (1 - p)) / games)) };
}
