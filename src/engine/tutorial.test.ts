import { describe, expect, it } from 'vitest';
import tutorial from '../data/tutorial.json';
import { applyMut, newGame, remaining } from './rules';
import type { ScriptedSetup } from './types';

/** Spielt das Skript der Einführung nach und prüft, dass jede Lektion aufgeht. */
describe('Einführung', () => {
  it('Skript geht auf: Kristall, Lichtfunke, Irrlicht, Staubwedel, Verbannen', () => {
    const st = newGame('leicht', 1, [], tutorial.setup as ScriptedSetup);
    const ids = () => st.hand.map((c) => c.id).sort();
    const buy = (id: string) => {
      const c = st.market.find((x) => x.id === id)!;
      expect(c, `Markt enthält ${id}`).toBeTruthy();
      const ev = applyMut(st, { type: 'buy', uid: c.uid });
      expect(ev.some((e) => e.type === 'CARD_BOUGHT'), `Kauf ${id}`).toBe(true);
    };

    // Zug 1
    expect(st.turn).toBe(1);
    expect(st.pending).toBeNull();
    expect(ids()).toEqual(['funke', 'funke', 'funke', 'funke', 'stab']);
    expect(st.active.map((e) => e.id)).toEqual(['irrlicht', 'kraehe']);
    applyMut(st, { type: 'playAll' });
    expect(st.influence).toBe(4);
    buy('kristall');
    applyMut(st, { type: 'endTurn' });

    // Zug 2
    expect(st.turn).toBe(2);
    expect(ids()).toEqual(['funke', 'funke', 'funke', 'stab', 'stab']);
    applyMut(st, { type: 'playAll' });
    expect(st.influence).toBe(3);
    expect(st.market.some((c) => c.id === 'licht')).toBe(true);
    buy('licht');
    applyMut(st, { type: 'endTurn' });

    // Zug 3: Lichtfunke trifft die Schwäche, 2 Angriff lassen 1 Leben
    expect(st.turn).toBe(3);
    expect(ids()).toEqual(['funke', 'funke', 'funke', 'licht', 'stab']);
    applyMut(st, { type: 'playAll' });
    const irr = st.active.find((e) => e.id === 'irrlicht')!;
    expect(irr.dmg).toBe(1);
    expect(st.attack).toBe(2);
    applyMut(st, { type: 'assignAttack', enemyUid: irr.uid, amount: 'kill' });
    expect(remaining(irr)).toBe(1);
    applyMut(st, { type: 'endTurn' });

    // Zug 4: 1 Angriff besiegt das Irrlicht
    expect(st.turn).toBe(4);
    expect(ids()).toEqual(['funke', 'funke', 'funke', 'kristall', 'stab']);
    applyMut(st, { type: 'playAll' });
    expect(st.attack).toBe(1);
    const ev4 = applyMut(st, { type: 'assignAttack', enemyUid: irr.uid, amount: 'kill' });
    expect(ev4.some((e) => e.type === 'ENEMY_DEFEATED')).toBe(true);
    expect(st.active.map((e) => e.id)).toEqual(['kraehe', 'weber']);
    applyMut(st, { type: 'endTurn' });

    // Zug 5: Omen legt Schatten, Staubwedel kaufbar (4 + 1 Aufschlag)
    expect(st.turn).toBe(5);
    expect(st.shadow).toBe(1);
    expect(ids()).toEqual(['funke', 'funke', 'funke', 'kristall', 'stab']);
    applyMut(st, { type: 'playAll' });
    expect(st.influence).toBe(7); // 5 aus der Hand + 2 gespart
    buy('staub');
    applyMut(st, { type: 'endTurn' });

    // Zug 6: frei; Fluchweber legt im geraden Zug einen Schatten
    expect(st.turn).toBe(6);
    expect(st.shadow).toBe(2);
    expect(st.life).toBeGreaterThan(3);
    applyMut(st, { type: 'playAll' });
    applyMut(st, { type: 'endTurn' });

    // Zug 7: Staubwedel auf der Hand, Verbannen
    expect(st.turn).toBe(7);
    expect(ids()).toEqual(['funke', 'funke', 'funke', 'funke', 'staub']);
    expect(st.life).toBeGreaterThan(0);
    expect(st.stuns).toBe(0);
    applyMut(st, { type: 'playAll' });
    expect(st.pending?.kind).toBe('banish');
    const funke = st.hand.find((c) => c.id === 'funke') ?? st.discard.find((c) => c.id === 'funke')!;
    const ev7 = applyMut(st, { type: 'choose', uid: funke.uid });
    expect(ev7.some((e) => e.type === 'CARD_BANISHED')).toBe(true);
    expect(st.result).toBeNull();
  });
});
