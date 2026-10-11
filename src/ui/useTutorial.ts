/**
 * Schrittmotor der Einführung: schaltet an den Ereignissen der Engine weiter, speichert Fortschritt und Zeiten.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import tutorialData from '../data/tutorial.json';
import { cardDef } from '../engine/data';
import type { GameEvent, GameState, ScriptedSetup } from '../engine/types';
import type { Game } from './store';

export interface TutorialStep {
  id: string;
  lesson: number;
  turn: number;
  target: string | null;
  text?: string;
  silent?: boolean;
  done: string;
  feedback?: string;
  unlockAfter?: boolean;
}

export const TUTORIAL_STEPS = tutorialData.steps as TutorialStep[];
export const TUTORIAL_SETUP = tutorialData.setup as ScriptedSetup;
export const TUTORIAL_LESSONS = tutorialData.lessons as string[];
export const TUTORIAL_ALTAR_HINT = tutorialData.altarHint as string;

const KEY = 'arkanum.tutorial.v1';

export interface TutorialProgress {
  stepIndex: number;
  done: boolean;
  skipped: boolean;
  /** Schrittprotokoll: Schritt-Id und Dauer in ms */
  log: { id: string; ms: number }[];
  startedAt?: number;
}

const FRESH: TutorialProgress = { stepIndex: 0, done: false, skipped: false, log: [] };

export function loadTutorialProgress(): TutorialProgress {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...FRESH, log: [] };
    return { ...FRESH, ...(JSON.parse(raw) as Partial<TutorialProgress>) };
  } catch {
    return { ...FRESH, log: [] };
  }
}

function save(p: TutorialProgress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(p));
  } catch {
    /* kein Speicher */
  }
}

export function resetTutorialProgress(): TutorialProgress {
  const p = { ...FRESH, log: [], startedAt: Date.now() };
  save(p);
  return p;
}

export function tutorialDone(): boolean {
  return loadTutorialProgress().done;
}

function cardIdByUid(st: GameState, uid: number): string | null {
  for (const pool of [st.discard, st.banished, st.hand, st.played, st.deck, st.market]) for (const c of pool) if (c.uid === uid) return c.id;
  return null;
}

function stepDone(step: TutorialStep, events: GameEvent[], st: GameState): boolean {
  const [kind, arg] = step.done.split(':');
  switch (kind) {
    case 'zoomed':
      return events.some((e) => e.type === 'CARD_ZOOMED' && e.zone === 'hand');
    case 'handEmpty':
      return st.phase === 'action' && st.hand.length === 0 && !st.pending;
    case 'bought':
      return events.some((e) => e.type === 'CARD_BOUGHT' && cardIdByUid(st, e.uid) === arg);
    case 'turnStarted':
      return events.some((e) => e.type === 'TURN_STARTED');
    case 'attackSpent':
      return events.some((e) => e.type === 'ATTACK_ASSIGNED') && st.attack === 0;
    case 'defeated':
      return events.some((e) => e.type === 'ENEMY_DEFEATED' && e.enemyId === arg);
    case 'banishPending':
      return st.pending?.kind === 'banish';
    case 'choiceResolved':
      return st.pending === null && events.some((e) => e.type === 'CARD_BANISHED' || e.type === 'CARDS_PLAYED' || e.type === 'ACTION_PHASE' || e.type === 'CHOICE_PICKED') && events.some((e) => e.type !== 'CHOICE_PICKED');
    case 'picked':
      return events.some((e) => e.type === 'CHOICE_PICKED' && e.uid !== null && cardIdByUid(st, e.uid) === arg);
    case 'banished':
      return events.some((e) => e.type === 'CARD_BANISHED' && cardIdByUid(st, e.uid) === arg);
    default:
      return false;
  }
}

export interface Tutorial {
  active: boolean;
  /** aktueller Schritt, sofern sein Zug erreicht ist */
  step: TutorialStep | null;
  lessonLabel: string;
  locked: boolean;
  feedback: string | null;
  fails: number;
  next: () => void;
  skip: () => void;
  miss: () => void;
}

export function useTutorial(game: Game, enabled: boolean, initial: TutorialProgress): Tutorial {
  const [progress, setProgress] = useState<TutorialProgress>(initial);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [fails, setFails] = useState(0);
  const progressRef = useRef(progress);
  progressRef.current = progress;
  const stepStart = useRef(Date.now());

  const advance = useCallback(
    (st: GameState) => {
      const p = progressRef.current;
      const step = TUTORIAL_STEPS[p.stepIndex];
      if (!step) return;
      const ms = Date.now() - stepStart.current;
      stepStart.current = Date.now();
      const nextIndex = p.stepIndex + 1;
      const done = nextIndex >= TUTORIAL_STEPS.length;
      const np: TutorialProgress = { ...p, stepIndex: nextIndex, done, log: [...p.log, { id: step.id, ms }] };
      progressRef.current = np;
      setProgress(np);
      save(np);
      setFails(0);
      if (step.feedback) {
        setFeedback(step.feedback);
        window.setTimeout(() => setFeedback(null), 2200);
      }
      // Folgeschritte, die schon erfüllt sind (z. B. Hand leer), sofort weiterschalten
      const following = TUTORIAL_STEPS[nextIndex];
      if (following && following.turn <= st.turn && following.done !== 'next' && stepDone(following, [], st)) advance(st);
    },
    [],
  );

  useEffect(() => {
    if (!enabled) return;
    return game.subscribe((events, st) => {
      const p = progressRef.current;
      if (p.done) return;
      const step = TUTORIAL_STEPS[p.stepIndex];
      if (!step || st.turn < step.turn) return;
      if (step.done === 'next') return;
      if (stepDone(step, events, st)) advance(st);
    });
  }, [game, enabled, advance]);

  // Beim Laden: bereits erfüllte Schritte überspringen
  useEffect(() => {
    if (!enabled) return;
    const st = game.getState();
    if (!st) return;
    const step = TUTORIAL_STEPS[progressRef.current.stepIndex];
    if (step && step.turn <= st.turn && step.done !== 'next' && stepDone(step, [], st)) advance(st);
  }, [game, enabled, advance]);

  const next = useCallback(() => {
    const st = game.getState();
    if (st) advance(st);
  }, [game, advance]);

  const skip = useCallback(() => {
    const np: TutorialProgress = { ...progressRef.current, done: true, skipped: true };
    progressRef.current = np;
    setProgress(np);
    save(np);
  }, []);

  const miss = useCallback(() => setFails((f) => f + 1), []);

  const st = game.state;
  return useMemo<Tutorial>(() => {
    const active = enabled && !progress.done;
    const raw = active ? TUTORIAL_STEPS[progress.stepIndex] ?? null : null;
    const step = raw && st && st.turn >= raw.turn ? raw : null;
    // Zwischen zwei Lektionen (unlockAfter) ist das Spiel frei
    const prev = progress.stepIndex > 0 ? TUTORIAL_STEPS[progress.stepIndex - 1] : null;
    const waiting = active && !step && !!prev?.unlockAfter;
    const locked = active && !!step && !!step.target && !waiting;
    return {
      active,
      step,
      lessonLabel: raw ? `Lektion ${raw.lesson + 1} von ${TUTORIAL_LESSONS.length}: ${TUTORIAL_LESSONS[raw.lesson]}` : '',
      locked,
      feedback,
      fails,
      next,
      skip,
      miss,
    };
  }, [enabled, progress, st, feedback, fails, next, skip, miss]);
}

/** Karten-Id eines Ziels wie „market:kristall“ für Beschriftungen. */
export function targetName(target: string | null): string {
  if (!target) return '';
  const [, id] = target.split(':');
  if (!id) return target;
  try {
    return cardDef(id).name;
  } catch {
    return id;
  }
}
