/**
 * Live-Siegchance: Zu Beginn jedes Zugs rechnet ein Web Worker 200 Partien mit dem guten Bot.
 * Bewusst nicht nach Käufen innerhalb des Zugs, damit die Anzeige kein Köder für „Rückgängig“ wird
 * (CHANCE_AFTER_BUY schaltet das um).
 */
import { useEffect, useRef, useState } from 'react';
import { randomSeed } from '../engine/rng';
import type { ChanceRequest, ChanceResponse } from '../engine/sim.worker';
import type { Game } from './store';

export const CHANCE_GAMES = 200;
export const CHANCE_AFTER_BUY = false;

export interface ChanceStatus {
  computing: boolean;
  lastMs: number | null;
}

export function useWinChance(game: Game, enabled: boolean): ChanceStatus {
  const workerRef = useRef<Worker | null>(null);
  const reqId = useRef(0);
  const reqTurn = useRef(-1);
  const [status, setStatus] = useState<ChanceStatus>({ computing: false, lastMs: null });
  const addChance = game.addChance;

  useEffect(() => {
    if (!enabled) return;
    const w = new Worker(new URL('../engine/sim.worker.ts', import.meta.url), { type: 'module' });
    workerRef.current = w;
    w.postMessage({ id: 0, state: null, games: 60, seed: 1 } satisfies ChanceRequest);
    w.onmessage = (e: MessageEvent<ChanceResponse>) => {
      if (e.data.id !== reqId.current) return;
      addChance({ turn: e.data.turn, percent: e.data.result.percent, margin: e.data.result.margin });
      setStatus({ computing: !e.data.final, lastMs: e.data.ms });
      if (import.meta.env.DEV) console.info(`Siegchance ${e.data.result.percent} % ±${e.data.result.margin} nach ${e.data.ms} ms${e.data.final ? '' : ' (erste Hälfte)'}`);
    };
    return () => {
      w.terminate();
      workerRef.current = null;
    };
  }, [enabled, addChance]);

  const request = (reason: string) => {
    const st = game.getState();
    const w = workerRef.current;
    if (!st || !w || st.result) return;
    reqId.current += 1;
    reqTurn.current = st.turn;
    const msg: ChanceRequest = { id: reqId.current, state: st, games: CHANCE_GAMES, seed: randomSeed() };
    setStatus((s) => ({ ...s, computing: true }));
    if (import.meta.env.DEV) console.debug(`Siegchance angefragt (${reason}), Zug ${st.turn}`);
    w.postMessage(msg);
  };
  const requestRef = useRef(request);
  requestRef.current = request;

  // Zugbeginn (und Kauf, falls eingeschaltet)
  useEffect(() => {
    if (!enabled) return;
    return game.subscribe((events) => {
      if (events.some((e) => e.type === 'TURN_STARTED')) requestRef.current('Zugbeginn');
      else if (CHANCE_AFTER_BUY && events.some((e) => e.type === 'CARD_BOUGHT' || e.type === 'ALTAR_USED')) requestRef.current('Kauf');
    });
  }, [game, enabled]);

  // Beim Laden oder Einschalten: fehlt der Punkt für den aktuellen Zug, nachrechnen
  const turn = game.state?.turn;
  const hasPoint = !!game.chance.find((p) => p.turn === turn);
  useEffect(() => {
    if (!enabled || turn === undefined || hasPoint) return;
    const t = window.setTimeout(() => {
      if (reqTurn.current !== turn) requestRef.current('Start');
    }, 50);
    return () => window.clearTimeout(t);
  }, [enabled, turn, hasPoint]);

  return status;
}
