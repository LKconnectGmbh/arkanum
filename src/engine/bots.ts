/**
 * Die drei Bots aus tools/balance_sim.py: gut (Heuristik), teuer (kauft die teuerste Karte), zufall.
 * Jeder Bot spielt einen kompletten Zug über die Engine-Aktionen.
 */
import { cardDef, cardSummary, enemyDef } from './data';
import { choice, rngNext, type RngState } from './rng';
import { ALTAR_COST, CARRY, applyMut, bossActive, buyCost, capacity, choiceCandidates, remaining } from './rules';
import type { CardInst, EnemyInst, GameState } from './types';

export type Policy = 'gut' | 'teuer' | 'zufall';
export const POLICIES: Policy[] = ['gut', 'teuer', 'zufall'];

/** Gemessener Grundwert jeder Marktkarte (aus balance_sim.py). */
export const VALUE: Record<string, number> = {
  licht: 1.9, trank: 1.24, kauz: 2.11, staub: 2.42, schild: 2.34, kristall: 1.48, kobold: 1.94, spiegel: 1.29,
  regen: 3.25, foliant: 2.87, otter: 2.3, laeut: 3.36, greif: 3.6, kessel: 2.49, bann: 3.72, phiole: 3.02,
  feder: 3.16, zirkel: 3.72, drache: 3.74, herz: 3.69,
};

const TEUER_NOTFALL = true;

/** Schwächste Handkarte: niedrigste Kosten, bei Gleichstand Funkenzauber zuerst. */
export function worstCard(cards: CardInst[]): CardInst | null {
  let best: CardInst | null = null;
  let bestKey = Infinity;
  for (const c of cards) {
    const d = cardDef(c.id);
    const key = d.cost * 2 + (c.id === 'funke' ? 0 : 1);
    if (key < bestKey) {
      bestKey = key;
      best = c;
    }
  }
  return best;
}

/** Bedrohungswert eines Feinds (Summe der Fähigkeitswerte wie in der Referenz). */
function threat(e: EnemyInst): number {
  let t = 0;
  for (const fx of enemyDef(e.id).abilities) {
    if (fx.op === 'damage' || fx.op === 'discard' || fx.op === 'buyTax') t += fx.amount;
    else if (fx.op === 'everyNthTurn') t += fx.n;
    else if (fx.op === 'blockHealing') t += 1;
  }
  return t;
}

function countId(st: GameState, id: string): number {
  let n = 0;
  for (const pool of [st.deck, st.discard, st.hand]) for (const c of pool) if (c.id === id) n++;
  return n;
}

function countType(st: GameState, type: string): number {
  let n = 0;
  for (const pool of [st.deck, st.discard, st.hand]) for (const c of pool) if (cardDef(c.id).type === type) n++;
  return n;
}

/** Bewertung einer Marktkarte durch den guten Bot. */
export function cardScore(st: GameState, id: string): number {
  const def = cardDef(id);
  const s = cardSummary(id);
  let v = VALUE[id] ?? 0;
  const early = st.turn <= 5;
  if (id === 'staub') v += 0.15 * countId(st, 'funke');
  if (s.influence) v += 0.1 * s.influence;
  if (id === 'laeut' || id === 'bann') {
    const cap = capacity(st);
    v += 0.8 * Math.max(0, st.shadow - (cap - 3)) + 0.4 * st.location;
  }
  if ((id === 'trank' || id === 'otter' || id === 'feder' || id === 'schild') && st.life < st.maxLife * 0.6) v += 0.8;
  if (early && (s.influence || s.draw)) v += 0.4;
  const need: (string | null)[] = st.active.map((e) => enemyDef(e.id).weakness);
  if (st.queue.length) need.push(enemyDef(st.queue[0].id).weakness);
  v += 0.45 * need.filter((w) => w === def.type).length;
  v += 0.05 * Math.min(countType(st, def.type), 6);
  return v;
}

function resolvePending(st: GameState, policy: Policy, rng: RngState) {
  while (st.pending) {
    const p = st.pending;
    if (p.kind === 'discard') {
      const c = worstCard(st.hand);
      applyMut(st, { type: 'choose', uid: c ? c.uid : null });
    } else {
      // Verbannen: Funkenzauber aus Hand, dann Ablage; der Zufallsbot überspringt jeden Kandidaten zur Hälfte
      let pick: CardInst | null = null;
      for (const c of choiceCandidates(st)) {
        if (c.id === 'funke' && (policy !== 'zufall' || rngNext(rng) < 0.5)) {
          pick = c;
          break;
        }
      }
      applyMut(st, { type: 'choose', uid: pick ? pick.uid : null });
    }
  }
}

function botAttack(st: GameState, policy: Policy, rng: RngState) {
  while (st.attack > 0 && st.phase === 'action' && (st.active.length || st.boss)) {
    if (st.active.length === 0) {
      if (!bossActive(st)) break;
      const b = st.boss!;
      applyMut(st, { type: 'assignAttack', enemyUid: b.uid, amount: Math.min(st.attack, remaining(b)) });
      break;
    }
    let e: EnemyInst;
    if (policy === 'zufall') {
      e = choice(rng, st.active);
    } else {
      const killable = st.active.filter((x) => remaining(x) <= st.attack);
      if (killable.length) {
        e = killable[0];
        for (const x of killable) {
          const tx = threat(x);
          const te = threat(e);
          if (tx > te || (tx === te && x.hp > e.hp)) e = x;
        }
      } else {
        e = st.active[0];
        for (const x of st.active) if (remaining(x) < remaining(e)) e = x;
      }
    }
    const before = st.attack;
    applyMut(st, { type: 'assignAttack', enemyUid: e.uid, amount: Math.min(st.attack, remaining(e)) });
    if (st.attack === before) break;
  }
}

function botAltar(st: GameState, policy: Policy, rng: RngState) {
  if (st.phase !== 'action') return;
  const cap = capacity(st);
  if (policy === 'gut') {
    if (st.influence >= ALTAR_COST && st.shadow > 0 && st.shadow >= cap - 2) applyMut(st, { type: 'useAltar' });
  } else if (policy === 'teuer' && TEUER_NOTFALL) {
    if (st.influence >= ALTAR_COST && st.shadow >= cap - 1) applyMut(st, { type: 'useAltar' });
  } else if (policy === 'zufall') {
    if (st.influence >= ALTAR_COST && st.shadow > 0 && rngNext(rng) < 0.3) applyMut(st, { type: 'useAltar' });
  }
}

function botBuy(st: GameState, policy: Policy, rng: RngState) {
  while (st.phase === 'action') {
    const tax = st.bought === 0 ? st.buyTax : 0;
    const aff = st.market.filter((c) => cardDef(c.id).cost + tax <= st.influence);
    if (!aff.length) break;
    let c: CardInst;
    if (policy === 'zufall') {
      if (rngNext(rng) < 0.25) break;
      c = choice(rng, aff);
    } else if (policy === 'teuer') {
      c = aff[0];
      for (const x of aff) if (cardDef(x.id).cost > cardDef(c.id).cost) c = x;
    } else {
      c = aff[0];
      let cs = cardScore(st, c.id);
      for (const x of aff) {
        const xs = cardScore(st, x.id);
        if (xs > cs) {
          c = x;
          cs = xs;
        }
      }
      let bestAll = st.market[0];
      let bs = cardScore(st, bestAll.id);
      for (const x of st.market) {
        const xs = cardScore(st, x.id);
        if (xs > bs) {
          bestAll = x;
          bs = xs;
        }
      }
      // Sparen: eine deutlich bessere Karte ist nur knapp zu teuer
      const bestCost = cardDef(bestAll.id).cost + tax;
      if (bestCost > st.influence && bestCost - st.influence <= CARRY && st.bought === 0 && bs - cs >= 1.0) break;
      if (cs < 1.3 && st.turn > 6) break;
    }
    const before = st.influence;
    applyMut(st, { type: 'buy', uid: c.uid });
    if (st.influence === before) break;
  }
}

/** Spielt einen kompletten Zug des Bots: Auswahl, alle Karten, Angriff, Altar, Kauf, Zugende. */
export function botTurn(st: GameState, policy: Policy, rng: RngState) {
  resolvePending(st, policy, rng);
  if (st.phase !== 'action') return;
  applyMut(st, { type: 'playAll' });
  resolvePending(st, policy, rng);
  if (st.phase !== 'action') return;
  botAttack(st, policy, rng);
  if (st.phase !== 'action') return;
  botAltar(st, policy, rng);
  botBuy(st, policy, rng);
  if (st.phase !== 'action') return;
  applyMut(st, { type: 'endTurn' });
}

export { buyCost };
