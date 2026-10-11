/**
 * Spielzustand für die Oberfläche: Aktionen anwenden, Rückgängig je Zug, Speichern, Ereignisse weiterreichen.
 * Das Tutorial dockt später über `subscribe` an die Ereignisse an.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apply, cloneState, newGame } from '../engine/rules';
import { botTurn } from '../engine/bots';
import { randomSeed } from '../engine/rng';
import type { Action, Difficulty, GameEvent, GameState } from '../engine/types';

const SAVE_KEY = 'arkanum.save.v1';

export interface ChancePoint {
  turn: number;
  percent: number;
  margin: number;
}

export interface SaveData {
  v: 1;
  state: GameState;
  chance: ChancePoint[];
}

export function loadSave(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SaveData;
    if (data?.v !== 1 || !data.state || data.state.version !== 1) return null;
    return data;
  } catch {
    return null;
  }
}

export function writeSave(data: SaveData | null) {
  try {
    if (data) localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    else localStorage.removeItem(SAVE_KEY);
  } catch {
    /* Speicher nicht verfügbar: Spiel läuft trotzdem */
  }
}

export type EventListener = (events: GameEvent[], state: GameState) => void;

export interface Game {
  state: GameState;
  /** Ereignisse der letzten Aktion */
  lastEvents: GameEvent[];
  chance: ChancePoint[];
  dispatch: (action: Action) => GameEvent[];
  canUndo: boolean;
  undo: () => void;
  start: (difficulty: Difficulty, seed?: number) => void;
  abandon: () => void;
  subscribe: (l: EventListener) => () => void;
  addChance: (p: ChancePoint) => void;
  /** aktueller Zustand, auch zwischen zwei Renderings */
  getState: () => GameState | null;
  /** Entwicklungshilfe: der gute Bot spielt einen Zug */
  botStep: () => void;
}

export function useGame(initial: SaveData | null): Game {
  const [state, setState] = useState<GameState | null>(initial?.state ?? null);
  const [lastEvents, setLastEvents] = useState<GameEvent[]>([]);
  const [chance, setChance] = useState<ChancePoint[]>(initial?.chance ?? []);
  const undoRef = useRef<GameState[]>([]);
  const [undoDepth, setUndoDepth] = useState(0);
  const listeners = useRef(new Set<EventListener>());
  const stateRef = useRef(state);
  stateRef.current = state;
  const chanceRef = useRef(chance);
  chanceRef.current = chance;

  useEffect(() => {
    if (state) writeSave({ v: 1, state, chance });
  }, [state, chance]);

  const emit = useCallback((events: GameEvent[], st: GameState) => {
    setLastEvents(events);
    for (const l of listeners.current) l(events, st);
  }, []);

  const dispatch = useCallback(
    (action: Action): GameEvent[] => {
      const cur = stateRef.current;
      if (!cur) return [];
      const { state: next, events } = apply(cur, action);
      if (events.some((e) => e.type === 'REJECTED') && events.length === 1) return events;
      if (events.some((e) => e.type === 'TURN_STARTED') || next.result) {
        undoRef.current = [];
      } else if (next.phase === 'action' && cur.phase === 'action') {
        undoRef.current.push(cur);
        if (undoRef.current.length > 60) undoRef.current.shift();
      } else {
        undoRef.current = [];
      }
      setUndoDepth(undoRef.current.length);
      stateRef.current = next;
      setState(next);
      emit(events, next);
      return events;
    },
    [emit],
  );

  const undo = useCallback(() => {
    const prev = undoRef.current.pop();
    if (!prev) return;
    setUndoDepth(undoRef.current.length);
    stateRef.current = prev;
    setState(prev);
    setLastEvents([]);
  }, []);

  const start = useCallback(
    (difficulty: Difficulty, seed?: number) => {
      const events: GameEvent[] = [];
      const st = newGame(difficulty, seed ?? randomSeed(), events);
      undoRef.current = [];
      setUndoDepth(0);
      setChance([]);
      stateRef.current = st;
      setState(st);
      emit(events, st);
    },
    [emit],
  );

  const abandon = useCallback(() => {
    undoRef.current = [];
    setUndoDepth(0);
    stateRef.current = null;
    setState(null);
    setChance([]);
    setLastEvents([]);
    writeSave(null);
  }, []);

  const subscribe = useCallback((l: EventListener) => {
    listeners.current.add(l);
    return () => {
      listeners.current.delete(l);
    };
  }, []);

  const botStep = useCallback(() => {
    const cur = stateRef.current;
    if (!cur || cur.result) return;
    const st = cloneState(cur);
    const events: GameEvent[] = [];
    botTurn(st, 'gut', { rng: randomSeed() }, events);
    undoRef.current = [];
    setUndoDepth(0);
    stateRef.current = st;
    setState(st);
    emit(events, st);
  }, [emit]);

  const getState = useCallback(() => stateRef.current, []);

  const addChance = useCallback((p: ChancePoint) => {
    setChance((c) => (c.length && c[c.length - 1].turn === p.turn ? [...c.slice(0, -1), p] : [...c, p]));
  }, []);

  return useMemo<Game>(
    () => ({
      state: state ?? (null as unknown as GameState),
      lastEvents,
      chance,
      dispatch,
      canUndo: undoDepth > 0,
      undo,
      start,
      abandon,
      subscribe,
      addChance,
      getState,
      botStep,
    }),
    [state, lastEvents, chance, dispatch, undoDepth, undo, start, abandon, subscribe, addChance, getState, botStep],
  );
}

export { cloneState };
