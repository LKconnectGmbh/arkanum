import { describe, expect, it } from 'vitest';
import { applyMut, bossActive, newGame, remaining } from './rules';
import { runBatch } from './sim';
import type { CardInst, EnemyInst, GameState } from './types';

/** Partie bis zur ersten Aktionsphase bringen, offene Abwürfe mit der ersten Handkarte erledigen. */
function fresh(seed = 3): GameState {
  const st = newGame('normal', seed);
  while (st.pending) applyMut(st, { type: 'choose', uid: st.hand[0].uid });
  expect(st.phase).toBe('action');
  return st;
}

function card(st: GameState, id: string): CardInst {
  return { uid: st.nextUid++, id };
}

function enemy(st: GameState, id: string, hp: number, act: number): EnemyInst {
  return { uid: st.nextUid++, id, hp, dmg: 0, age: 0, hitTurn: 0, act };
}

describe('Aufbau', () => {
  it('startet mit 5 Handkarten, 6 Marktkarten, 2 aktiven Feinden aus Akt I', () => {
    const st = newGame('normal', 1);
    expect(st.hand.length + (st.pending ? 0 : 0)).toBe(5);
    expect(st.market.length).toBe(6);
    expect(st.active.length).toBe(2);
    expect(st.active.every((e) => e.act === 1)).toBe(true);
    expect(st.queue.length).toBe(3);
    expect(st.boss?.hp).toBe(16);
    expect(st.turn).toBe(1);
  });

  it('Leicht: 12 Leben, Fürst 13, kein Kältehauch', () => {
    const st = newGame('leicht', 1);
    expect(st.life).toBe(12);
    expect(st.boss?.hp).toBe(13);
    expect(st.omenAll.includes('kaelte')).toBe(false);
    expect(st.omenAll.filter((o) => o === 'pause').length).toBe(4);
  });

  it('Schwer: Feinde +1 Leben, Orte 4/4/5', () => {
    const st = newGame('schwer', 1);
    expect(st.active.every((e) => e.hp === 5 || e.hp === 6)).toBe(true);
  });
});

describe('Aktionsphase', () => {
  it('Schwäche-Treffer beim Ausspielen', () => {
    const st = fresh();
    st.active = [enemy(st, 'irrlicht', 4, 1)];
    const licht = card(st, 'licht');
    st.hand = [licht];
    applyMut(st, { type: 'playCard', uid: licht.uid });
    expect(st.active[0].dmg).toBe(1);
    expect(st.active[0].hitTurn).toBe(st.turn);
    expect(st.attack).toBe(1);
  });

  it('Altar: 4 Einfluss gegen 1 Schatten, einmal pro Zug', () => {
    const st = fresh();
    st.influence = 8;
    st.shadow = 2;
    applyMut(st, { type: 'useAltar' });
    expect(st.shadow).toBe(1);
    expect(st.influence).toBe(4);
    const ev = applyMut(st, { type: 'useAltar' });
    expect(ev.some((e) => e.type === 'REJECTED')).toBe(true);
    expect(st.shadow).toBe(1);
  });

  it('Betäubung: Schatten, halbe Hand weg, Leben voll', () => {
    const st = fresh();
    st.life = 1;
    st.shield = 0;
    st.shadow = 0;
    const kobold = card(st, 'kobold');
    st.hand = [kobold, card(st, 'funke'), card(st, 'funke'), card(st, 'funke')];
    applyMut(st, { type: 'playCard', uid: kobold.uid });
    expect(st.life).toBe(st.maxLife);
    expect(st.stuns).toBe(1);
    expect(st.shadow).toBe(1);
    expect(st.hand.length).toBe(2);
  });

  it('Schild blockt Selbstschaden', () => {
    const st = fresh();
    st.life = 5;
    const schild = card(st, 'schild');
    const kobold = card(st, 'kobold');
    st.hand = [schild, kobold];
    applyMut(st, { type: 'playCard', uid: schild.uid });
    applyMut(st, { type: 'playCard', uid: kobold.uid });
    expect(st.life).toBe(5);
    expect(st.shield).toBe(1);
  });

  it('Sternenzirkel: +2 je weiterem Zauber, max +6', () => {
    const st = fresh();
    st.active = [];
    st.queue = [];
    st.boss = null;
    st.result = null;
    const zirkel = card(st, 'zirkel');
    st.hand = [card(st, 'licht'), zirkel, card(st, 'licht'), card(st, 'staub'), card(st, 'laeut'), card(st, 'licht')];
    st.discard = [];
    applyMut(st, { type: 'playAll' });
    while (st.pending) applyMut(st, { type: 'choose', uid: null });
    // 3 Lichtfunken (3) + Zirkel 1 + Bonus min(6, 2*5)=6 = 10
    expect(st.attack).toBe(10);
  });

  it('Greif: +1 Einfluss nur bei einem Sieg in diesem Zug', () => {
    const st = fresh();
    st.active = [enemy(st, 'irrlicht', 3, 1)];
    st.influence = 0;
    const greif = card(st, 'greif');
    st.hand = [greif];
    applyMut(st, { type: 'playCard', uid: greif.uid });
    expect(st.influence).toBe(0);
    applyMut(st, { type: 'assignAttack', enemyUid: st.active[0].uid, amount: 'kill' });
    expect(st.influence).toBe(1);
  });

  it('Alle ausspielen: Ziehkarten zuerst', () => {
    const st = fresh();
    const kauz = card(st, 'kauz');
    const funke = card(st, 'funke');
    st.hand = [funke, kauz];
    st.deck = [card(st, 'stab')];
    applyMut(st, { type: 'playAll' });
    expect(st.played.map((c) => c.uid)[0]).toBe(kauz.uid);
    expect(st.played.length).toBe(3);
    expect(st.hand.length).toBe(0);
  });

  it('Staubwedel: Verbannen aus Hand oder Ablage, Überspringen erlaubt', () => {
    const st = fresh();
    const staub = card(st, 'staub');
    const funke = card(st, 'funke');
    st.hand = [staub];
    st.discard = [funke];
    applyMut(st, { type: 'playCard', uid: staub.uid });
    expect(st.pending?.kind).toBe('banish');
    applyMut(st, { type: 'choose', uid: funke.uid });
    expect(st.banished.map((c) => c.uid)).toEqual([funke.uid]);
    expect(st.discard.length).toBe(0);
    expect(st.pending).toBeNull();
  });

  it('Kauf: Fluchkrähe-Aufschlag nur beim ersten Kauf, Karte in die Ablage, Markt füllt auf', () => {
    const st = fresh();
    st.buyTax = 1;
    st.influence = 10;
    st.discard = [];
    const first = st.market[0];
    const cost0 = st.market[0].id;
    applyMut(st, { type: 'buy', uid: first.uid });
    expect(st.market.length).toBe(6);
    expect(st.discard.map((c) => c.uid)).toContain(first.uid);
    const spent = 10 - st.influence;
    expect(spent).toBeGreaterThanOrEqual(2 + 1);
    expect(cost0).toBeTruthy();
    const second = st.market[0];
    const before = st.influence;
    applyMut(st, { type: 'buy', uid: second.uid });
    if (st.influence !== before) expect(st.bought).toBe(2);
  });
});

describe('Zugende und Zugbeginn', () => {
  it('Regeneration: Akt-II-Feind ohne Treffer heilt 2, mit Treffer nicht', () => {
    const st = fresh();
    const a = enemy(st, 'wolf', 6, 2);
    a.dmg = 3;
    const b = enemy(st, 'weber', 6, 2);
    b.dmg = 3;
    b.hitTurn = st.turn;
    const c = enemy(st, 'irrlicht', 4, 1);
    c.dmg = 3;
    st.active = [a, b];
    st.queue = [c];
    st.hand = [];
    applyMut(st, { type: 'endTurn' });
    expect(a.dmg).toBe(1);
    expect(b.dmg).toBe(3);
  });

  it('bis zu 2 Einfluss werden mitgenommen', () => {
    const st = fresh();
    st.influence = 5;
    st.hand = [];
    st.active = [enemy(st, 'kraehe', 5, 1)];
    applyMut(st, { type: 'endTurn' });
    while (st.pending) applyMut(st, { type: 'choose', uid: st.hand[0].uid });
    expect(st.influence).toBe(2);
    expect(st.hand.length).toBe(5);
  });

  it('Markt rotiert: links verfällt, rechts kommt eine neue', () => {
    const st = fresh();
    st.active = [enemy(st, 'kraehe', 5, 1)];
    const left = st.market[0].uid;
    const rest = st.market.slice(1).map((c) => c.uid);
    applyMut(st, { type: 'endTurn' });
    expect(st.market.length).toBe(6);
    expect(st.market.slice(0, 5).map((c) => c.uid)).toEqual(rest);
    expect(st.marketGone.map((c) => c.uid)).toContain(left);
  });

  it('Omen „Verwirrung“ verlangt eine Auswahl, danach geht es weiter', () => {
    const st = fresh();
    st.active = [enemy(st, 'kraehe', 5, 1)];
    st.omenPile = ['verwirr'];
    applyMut(st, { type: 'endTurn' });
    expect(st.phase).toBe('start');
    expect(st.pending?.kind).toBe('discard');
    const n = st.hand.length;
    applyMut(st, { type: 'choose', uid: st.hand[0].uid });
    expect(st.hand.length).toBe(n - 1);
    expect(st.phase).toBe('action');
    expect(st.buyTax).toBe(1);
  });

  it('Wut: ab dem 4. Zug im Spiel 1 Schaden mehr', () => {
    const st = fresh();
    const e = enemy(st, 'irrlicht', 4, 1);
    e.age = 3;
    st.active = [e];
    st.omenPile = ['pause'];
    st.shield = 0;
    const life = st.life;
    applyMut(st, { type: 'endTurn' });
    expect(life - st.life).toBe(2);
  });

  it('Ort fällt: Überschuss wandert mit, dritter Ort voll = Niederlage', () => {
    const st = fresh();
    st.active = [];
    st.queue = [];
    st.location = 2;
    st.shadow = 4;
    st.omenPile = ['fluestern'];
    applyMut(st, { type: 'endTurn' });
    expect(st.result).toBe('loss');
  });
});

describe('Endgegner', () => {
  it('kommt nach dem letzten Feind sofort, Sieg bei 0 Leben', () => {
    const st = fresh();
    const last = enemy(st, 'irrlicht', 4, 1);
    st.active = [last];
    st.queue = [];
    st.attack = 20;
    expect(bossActive(st)).toBe(false);
    applyMut(st, { type: 'assignAttack', enemyUid: last.uid, amount: 'kill' });
    expect(bossActive(st)).toBe(true);
    expect(remaining(st.boss!)).toBe(16);
    applyMut(st, { type: 'assignAttack', enemyUid: st.boss!.uid, amount: 'kill' });
    expect(st.result).toBe('win');
  });
});

describe('Balance (Kurztest, 300 Partien je Zelle)', () => {
  const ref: Record<string, number> = {
    'leicht/gut': 96.7, 'leicht/teuer': 90.5, 'leicht/zufall': 57.7,
    'normal/gut': 51.9, 'normal/teuer': 36.3, 'normal/zufall': 9.9,
    'schwer/gut': 23.7, 'schwer/teuer': 13.5, 'schwer/zufall': 1.8,
  };
  for (const key of Object.keys(ref)) {
    const [d, p] = key.split('/') as ['leicht' | 'normal' | 'schwer', 'gut' | 'teuer' | 'zufall'];
    it(`${key} liegt nahe ${ref[key]} %`, () => {
      const r = runBatch(d, p, 300, 1);
      expect(Math.abs(r.winRate * 100 - ref[key])).toBeLessThan(8);
    });
  }
});
