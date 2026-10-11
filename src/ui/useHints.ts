/**
 * Kontexthinweise beim ersten Auftreten: je genau einmal, höchstens einer pro Zug, immer schließbar.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { enemyDef } from '../engine/data';
import { capacity } from '../engine/rules';
import type { GameEvent, GameState } from '../engine/types';
import type { Game } from './store';
import { TUTORIAL_ALTAR_HINT } from './useTutorial';

const KEY = 'arkanum.hints.v1';

export interface Hint {
  id: string;
  target: string;
  text: string;
}

function loadSeen(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function saveSeen(seen: Set<string>) {
  try {
    localStorage.setItem(KEY, JSON.stringify([...seen]));
  } catch {
    /* kein Speicher */
  }
}

export function resetHints() {
  saveSeen(new Set());
}

function enemyTarget(st: GameState, uid: number): string | null {
  const e = st.active.find((x) => x.uid === uid) ?? (st.boss && st.boss.uid === uid ? st.boss : null);
  return e ? `enemy:${e.id}` : null;
}

/** Welcher Hinweis passt zu diesen Ereignissen? */
function detect(events: GameEvent[], st: GameState, seen: Set<string>): Hint | null {
  const want = (id: string, target: string | null, text: string): Hint | null => (!seen.has(id) && target ? { id, target, text } : null);
  for (const e of events) {
    if (e.type === 'STUNNED') {
      const h = want('stun', 'life', 'Betäubt: 1 Schatten, halbe Hand weg, Leben wieder voll.');
      if (h) return h;
    }
    if (e.type === 'ENEMY_ACTED' && e.wut) {
      const h = want('wut', enemyTarget(st, e.enemyUid), 'Wut: Dieser Feind ist seit 4 Zügen da und macht 1 Schaden mehr.');
      if (h) return h;
    }
    if (e.type === 'ENEMY_REGENERATED') {
      const h = want('regen', enemyTarget(st, e.enemyUid), 'Regeneration: Feinde ab Akt II heilen 2, wenn sie im Zug nicht getroffen wurden.');
      if (h) return h;
    }
    if (e.type === 'INFLUENCE_SAVED') {
      const h = want('saving', 'influence', 'Bis zu 2 ◆ nimmst du in den nächsten Zug mit.');
      if (h) return h;
    }
  }
  if (st.phase === 'action') {
    if (st.buyTax > 0) {
      const k = st.active.find((x) => x.id === 'kraehe');
      const h = want('tax', k ? 'enemy:kraehe' : null, 'Fluchkrähe: Dein erster Kauf im Zug kostet 1 ◆ mehr.');
      if (h) return h;
    }
    if (st.healBlocked) {
      const z = st.active.find((x) => x.id === 'zehrer');
      const h = want('zehrer', z ? 'enemy:zehrer' : null, `${z ? enemyDef(z.id).name : 'Seelenzehrer'}: Solange er lebt, heilt nichts, auch keine Belohnung.`);
      if (h) return h;
    }
    if (st.shadow > 0 && st.shadow >= capacity(st) - 2) {
      const h = want('altar', 'altar', TUTORIAL_ALTAR_HINT);
      if (h) return h;
    }
  }
  return null;
}

export function useHints(game: Game, enabled: boolean, chanceVisible: boolean) {
  const seen = useRef(loadSeen());
  const [hint, setHint] = useState<Hint | null>(null);
  const hintRef = useRef(hint);
  hintRef.current = hint;
  const shownTurn = useRef(-1);

  const offer = useCallback((h: Hint | null, turn: number) => {
    if (!h || hintRef.current || shownTurn.current === turn) return;
    shownTurn.current = turn;
    setHint(h);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    return game.subscribe((events, st) => {
      if (st.result) return;
      offer(detect(events, st, seen.current), st.turn);
    });
  }, [game, enabled, offer]);

  // Siegchance: beim ersten sichtbaren Wert
  const hasChance = chanceVisible && game.chance.length > 0;
  useEffect(() => {
    if (!enabled || !hasChance || seen.current.has('chance') || !game.state) return;
    offer({ id: 'chance', target: 'chance', text: 'Siegchance bei solider Spielweise, etwa ±7 Punkte. Antippen zum Ausblenden.' }, game.state.turn);
  }, [enabled, hasChance, game.state, offer]);

  // Beim Laden einer Partie: Zustandshinweise prüfen
  useEffect(() => {
    if (!enabled) return;
    const st = game.getState();
    if (st && !st.result) offer(detect([], st, seen.current), st.turn);
  }, [enabled, game, offer]);

  const close = useCallback(() => {
    const h = hintRef.current;
    if (h) {
      seen.current.add(h.id);
      saveSeen(seen.current);
    }
    setHint(null);
  }, []);

  return { hint, close };
}
