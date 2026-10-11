/**
 * Regeln v2 von „Arkanum – Die Wächter von Mondfels“.
 *
 * Reine Spiellogik ohne Oberfläche. `apply(state, action)` liefert einen neuen Zustand
 * und die Ereignisse; `applyMut` arbeitet auf dem übergebenen Zustand (für Simulationen).
 * Referenz für jedes Verhalten: tools/balance_sim.py.
 */
import { cardDef, enemyDef, DIFFICULTY, ENEMIES, MARKET, OMENS, STARTER, BOSS_ID } from './data';
import { rngInt, rngNext, sample, shuffle } from './rng';
import type {
  Action, ApplyResult, CardInst, CardType, Difficulty, Effect, EnemyInst, GameEvent, GameState, Pending,
} from './types';

export const ALTAR_COST = 4;
export const CARRY = 2;
export const WUT_AFTER = 3;
export const REGEN = 2;
export const STUN_SHADOW = 1;
export const HAND_SIZE = 5;
export const MARKET_SIZE = 6;

type Ev = GameEvent[];

// ---------- Aufbau ----------

export function newGame(difficulty: Difficulty, seed: number): GameState {
  const d = DIFFICULTY[difficulty];
  const st: GameState = {
    version: 1,
    difficulty,
    seed,
    rng: seed >>> 0,
    nextUid: 1,
    turn: 0,
    phase: 'start',
    cursor: null,
    pending: null,
    autoPlay: false,
    deck: [], hand: [], played: [], discard: [], banished: [],
    market: [], marketPile: [], marketGone: [],
    life: d.life,
    maxLife: d.life,
    location: 0,
    shadow: 0,
    omenPile: [], omenDiscard: [], omenAll: [],
    queue: [], active: [], boss: null, defeated: [],
    influence: 0, saved: 0, attack: 0, shield: 0,
    altarUsed: false, buyTax: 0, bought: 0, healBlocked: false,
    killBonus: 0, killedThisTurn: false,
    typeCounts: { grund: 0, zauber: 0, objekt: 0, wesen: 0 },
    perTypeBonus: [],
    stuns: 0,
    result: null,
  };
  const mk = (id: string): CardInst => ({ uid: st.nextUid++, id });

  for (const c of STARTER) for (let i = 0; i < c.copies; i++) st.deck.push(mk(c.id));
  shuffle(st, st.deck);

  for (const c of MARKET) for (let i = 0; i < c.copies; i++) st.marketPile.push(mk(c.id));
  shuffle(st, st.marketPile);
  for (let i = 0; i < MARKET_SIZE; i++) st.market.push(st.marketPile.pop()!);

  const omen: string[] = [];
  for (const o of OMENS) for (let i = 0; i < o.copies; i++) omen.push(o.id);
  if (d.omenSwap) {
    for (let i = 0; i < omen.length; i++) if (omen[i] === d.omenSwap.from) omen[i] = d.omenSwap.to;
  }
  st.omenAll = omen;
  st.omenPile = shuffle(st, omen.slice());

  const act = (n: number) => ENEMIES.filter((e) => e.act === n);
  const picked = [...sample(st, act(1), 2), ...sample(st, act(2), 2), ...sample(st, act(3), 1)];
  for (const e of picked) {
    st.queue.push({ uid: st.nextUid++, id: e.id, hp: e.hp + d.enemyHpBonus, dmg: 0, age: 0, hitTurn: 0, act: e.act });
  }
  st.boss = { uid: st.nextUid++, id: BOSS_ID, hp: d.bossHp, dmg: 0, age: 0, hitTurn: 0, act: 0 };
  st.active = [st.queue.shift()!, st.queue.shift()!];

  draw(st, HAND_SIZE, []);
  beginTurn(st, []);
  return st;
}

// ---------- Hilfen ----------

export function capacity(st: GameState): number {
  const caps = DIFFICULTY[st.difficulty].capacities;
  return caps[Math.min(st.location, caps.length - 1)];
}

export function bossActive(st: GameState): boolean {
  return st.active.length === 0 && st.queue.length === 0 && st.boss !== null;
}

export function remaining(e: EnemyInst): number {
  return e.hp - e.dmg;
}

function findEnemy(st: GameState, uid: number): EnemyInst | null {
  for (const e of st.active) if (e.uid === uid) return e;
  if (st.boss && st.boss.uid === uid && bossActive(st)) return st.boss;
  return null;
}

function gameOver(st: GameState, result: 'win' | 'loss', ev: Ev) {
  if (st.result) return;
  st.result = result;
  st.phase = 'over';
  st.pending = null;
  st.cursor = null;
  st.autoPlay = false;
  ev.push({ type: 'GAME_OVER', result });
}

function addShadow(st: GameState, n: number, ev: Ev) {
  if (n <= 0 || st.result) return;
  const caps = DIFFICULTY[st.difficulty].capacities;
  st.shadow += n;
  ev.push({ type: 'SHADOW_ADDED', amount: n });
  while (st.shadow >= caps[st.location]) {
    st.shadow -= caps[st.location];
    st.location += 1;
    ev.push({ type: 'LOCATION_FALLEN', location: st.location - 1 });
    if (st.location >= caps.length) {
      st.location = caps.length - 1;
      st.shadow = caps[st.location];
      gameOver(st, 'loss', ev);
      return;
    }
  }
}

function removeShadow(st: GameState, n: number, ev: Ev) {
  const removed = Math.min(n, st.shadow);
  if (removed <= 0) return;
  st.shadow -= removed;
  ev.push({ type: 'SHADOW_REMOVED', amount: removed });
}

function heal(st: GameState, n: number, ev: Ev) {
  if (n <= 0 || st.healBlocked) return;
  const before = st.life;
  st.life = Math.min(st.maxLife, st.life + n);
  if (st.life > before) ev.push({ type: 'HEALED', amount: st.life - before });
}

function hurt(st: GameState, n: number, source: string, ev: Ev) {
  if (n <= 0 || st.result) return;
  const blocked = Math.min(st.shield, n);
  st.shield -= blocked;
  const taken = n - blocked;
  st.life -= taken;
  ev.push({ type: 'DAMAGE_TAKEN', amount: taken, blocked, source });
  if (st.life <= 0) {
    st.stuns += 1;
    ev.push({ type: 'STUNNED' });
    addShadow(st, STUN_SHADOW, ev);
    st.life = st.maxLife;
    const k = Math.floor(st.hand.length / 2);
    const uids: number[] = [];
    for (let i = 0; i < k; i++) {
      const idx = rngInt(st, st.hand.length);
      const c = st.hand.splice(idx, 1)[0];
      st.discard.push(c);
      uids.push(c.uid);
    }
    if (uids.length) ev.push({ type: 'CARDS_DISCARDED', uids, reason: 'betaeubt' });
  }
}

function draw(st: GameState, n: number, ev: Ev) {
  for (let i = 0; i < n; i++) {
    if (st.deck.length === 0) {
      if (st.discard.length === 0) return;
      st.deck = st.discard;
      st.discard = [];
      shuffle(st, st.deck);
      ev.push({ type: 'DECK_RESHUFFLED' });
    }
    const c = st.deck.pop()!;
    st.hand.push(c);
    ev.push({ type: 'CARD_DRAWN', uid: c.uid });
  }
}

function requestDiscard(st: GameState, count: number, source: string, ev: Ev) {
  const n = Math.min(count, st.hand.length);
  if (n <= 0 || st.result) return;
  st.pending = { kind: 'discard', count: n, source };
  ev.push({ type: 'CHOICE_REQUIRED', pending: st.pending });
}

// ---------- Zugbeginn: Omen und Feinde ----------

function beginTurn(st: GameState, ev: Ev) {
  if (st.result) return;
  st.turn += 1;
  st.buyTax = 0;
  st.bought = 0;
  st.healBlocked = false;
  st.altarUsed = false;
  st.killBonus = 0;
  st.killedThisTurn = false;
  st.typeCounts = { grund: 0, zauber: 0, objekt: 0, wesen: 0 };
  st.perTypeBonus = [];
  st.attack = 0;
  st.influence = 0;
  st.autoPlay = false;
  const omens = DIFFICULTY[st.difficulty].omensPerLocation;
  st.cursor = { stage: 'omen', index: 0, total: omens[Math.min(st.location, omens.length - 1)] };
  st.phase = 'start';
  ev.push({ type: 'TURN_STARTED', turn: st.turn });
  advance(st, ev);
}

function fighters(st: GameState): EnemyInst[] {
  if (st.active.length) return st.active;
  if (st.queue.length === 0 && st.boss) return [st.boss];
  return [];
}

/** Führt Omen- und Feindphase aus, bis eine Auswahl nötig ist oder die Aktionsphase beginnt. */
function advance(st: GameState, ev: Ev) {
  while (st.phase === 'start' && !st.pending && !st.result && st.cursor) {
    const cur = st.cursor;
    if (cur.stage === 'omen') {
      if (cur.index >= cur.total) {
        st.cursor = { stage: 'enemy', index: 0, total: fighters(st).length };
        continue;
      }
      cur.index += 1;
      revealOmen(st, ev);
    } else {
      const f = fighters(st);
      if (cur.index >= f.length) {
        st.shield = 0;
        st.cursor = null;
        st.phase = 'action';
        st.influence = st.saved;
        st.saved = 0;
        ev.push({ type: 'ACTION_PHASE' });
        return;
      }
      const e = f[cur.index];
      cur.index += 1;
      enemyAct(st, e, ev);
    }
  }
}

function revealOmen(st: GameState, ev: Ev) {
  if (st.omenPile.length === 0) {
    st.omenPile = shuffle(st, st.omenAll.slice());
    st.omenDiscard = [];
    ev.push({ type: 'OMEN_RESHUFFLED' });
    addShadow(st, 1, ev);
    if (st.result) return;
  }
  const id = st.omenPile.pop()!;
  st.omenDiscard.push(id);
  ev.push({ type: 'OMEN_REVEALED', omen: id });
  const def = OMENS.find((o) => o.id === id)!;
  let discards = 0;
  for (const fx of def.effects) {
    if (fx.op === 'addShadow') addShadow(st, fx.amount, ev);
    else if (fx.op === 'damage') hurt(st, fx.amount, def.name, ev);
    else if (fx.op === 'discard') discards += fx.amount;
  }
  if (st.result) return;
  if (discards) requestDiscard(st, discards, def.name, ev);
}

function enemyAct(st: GameState, e: EnemyInst, ev: Ev) {
  const def = enemyDef(e.id);
  e.age += 1;
  let dmg = 0;
  let discards = 0;
  for (const fx of def.abilities) if (fx.op === 'damage') dmg += fx.amount;
  const wut = e.age > WUT_AFTER;
  if (wut) dmg += 1;
  ev.push({ type: 'ENEMY_ACTED', enemyUid: e.uid, damage: dmg, wut });
  hurt(st, dmg, def.name, ev);
  for (const fx of def.abilities) {
    if (fx.op === 'addShadow') addShadow(st, fx.amount, ev);
    else if (fx.op === 'everyNthTurn') {
      if (st.turn % fx.n === 0) for (const t of fx.then) if (t.op === 'addShadow') addShadow(st, t.amount, ev);
    } else if (fx.op === 'discard') discards += fx.amount;
    else if (fx.op === 'buyTax') st.buyTax += fx.amount;
    else if (fx.op === 'blockHealing') st.healBlocked = true;
  }
  if (st.result) return;
  if (discards) requestDiscard(st, discards, def.name, ev);
}

// ---------- Aktionsphase ----------

function damageEnemy(st: GameState, e: EnemyInst, n: number, ev: Ev) {
  if (n <= 0) return;
  e.dmg += n;
  e.hitTurn = st.turn;
  if (e.dmg >= e.hp) {
    e.dmg = e.hp;
    defeat(st, e, ev);
  }
}

function defeat(st: GameState, e: EnemyInst, ev: Ev) {
  const def = enemyDef(e.id);
  ev.push({ type: 'ENEMY_DEFEATED', enemyUid: e.uid, enemyId: e.id });
  if (st.boss && e.uid === st.boss.uid) {
    st.boss = null;
    st.defeated.push(e);
    gameOver(st, 'win', ev);
    return;
  }
  st.active = st.active.filter((x) => x.uid !== e.uid);
  st.defeated.push(e);
  if (st.queue.length) {
    const next = st.queue.shift()!;
    st.active.push(next);
    ev.push({ type: 'ENEMY_ARRIVED', enemyUid: next.uid });
  } else if (st.active.length === 0 && st.boss) {
    ev.push({ type: 'BOSS_ARRIVED' });
  }
  st.killedThisTurn = true;
  if (st.killBonus > 0) {
    st.influence += st.killBonus;
    ev.push({ type: 'INFLUENCE_GAINED', amount: st.killBonus, source: 'greif' });
    st.killBonus = 0;
  }
  for (const fx of def.reward) {
    if (fx.op === 'influence') {
      st.influence += fx.amount;
      ev.push({ type: 'INFLUENCE_GAINED', amount: fx.amount, source: def.name });
    } else if (fx.op === 'heal') heal(st, fx.amount, ev);
    else if (fx.op === 'cleanse') removeShadow(st, fx.amount, ev);
  }
}

function applyPerTypeBonus(st: GameState, ev: Ev) {
  for (const b of st.perTypeBonus) {
    const total = Math.min(b.cap, b.amount * Math.max(0, st.typeCounts[b.type] - 1));
    const delta = total - b.granted;
    if (delta > 0) {
      b.granted = total;
      if (b.resource === 'attack') st.attack += delta;
      else {
        st.influence += delta;
        ev.push({ type: 'INFLUENCE_GAINED', amount: delta, source: 'zirkel' });
      }
    }
  }
}

function peekOmen(st: GameState, n: number, ev: Ev) {
  const k = Math.min(n, st.omenPile.length);
  const top: string[] = [];
  for (let i = 0; i < k; i++) top.push(st.omenPile.pop()!);
  for (let i = top.length - 1; i >= 0; i--) {
    const o = top[i];
    const harmful = OMENS.find((x) => x.id === o)!.harmful;
    if (harmful) st.omenDiscard.push(o);
    else st.omenPile.push(o);
    ev.push({ type: 'OMEN_PEEKED', omen: o, discarded: harmful });
  }
}

function applyCardEffects(st: GameState, card: CardInst, effects: Effect[], ev: Ev) {
  for (const fx of effects) {
    if (st.result) return;
    switch (fx.op) {
      case 'influence':
        st.influence += fx.amount;
        break;
      case 'attack':
        st.attack += fx.amount;
        break;
      case 'heal':
        heal(st, fx.amount, ev);
        break;
      case 'selfDamage':
        hurt(st, fx.amount, cardDef(card.id).name, ev);
        break;
      case 'shield':
        st.shield += fx.amount;
        break;
      case 'draw':
        draw(st, fx.amount, ev);
        break;
      case 'cleanse':
        removeShadow(st, fx.amount, ev);
        break;
      case 'peekOmen':
        peekOmen(st, fx.amount, ev);
        break;
      case 'onKillThisTurn': {
        let inf = 0;
        for (const t of fx.then) if (t.op === 'influence') inf += t.amount;
        if (st.killedThisTurn) {
          st.influence += inf;
          ev.push({ type: 'INFLUENCE_GAINED', amount: inf, source: 'greif' });
        } else st.killBonus += inf;
        break;
      }
      case 'perOtherOfType':
        st.perTypeBonus.push({ type: fx.type, resource: fx.resource, amount: fx.amount, cap: fx.cap, granted: 0 });
        break;
      case 'banish':
        if (st.hand.length + st.discard.length > 0) {
          st.pending = { kind: 'banish', source: cardDef(card.id).name };
          ev.push({ type: 'CHOICE_REQUIRED', pending: st.pending });
        }
        break;
      default:
        break;
    }
  }
}

function playCard(st: GameState, uid: number, ev: Ev): boolean {
  const idx = st.hand.findIndex((c) => c.uid === uid);
  if (idx < 0) return reject(ev, 'Karte nicht auf der Hand');
  const card = st.hand.splice(idx, 1)[0];
  const def = cardDef(card.id);
  st.played.push(card);
  st.typeCounts[def.type] += 1;
  ev.push({ type: 'CARDS_PLAYED', uids: [card.uid] });
  applyCardEffects(st, card, def.effects, ev);
  applyPerTypeBonus(st, ev);
  // Schwäche-Treffer: jede Karte vom Schwäche-Typ eines aktiven Feindes macht diesem 1 Schaden
  for (const e of st.active.slice()) {
    if (st.result) break;
    if (!st.active.includes(e)) continue;
    if (enemyDef(e.id).weakness === def.type) {
      ev.push({ type: 'WEAKNESS_HIT', enemyUid: e.uid, cardUid: card.uid });
      damageEnemy(st, e, 1, ev);
    }
  }
  return true;
}

/** Nächste Karte für „Alle ausspielen“: Ziehkarten zuerst (meiste Karten zuerst), sonst Handreihenfolge. */
function nextAutoCard(st: GameState): CardInst | null {
  let best: CardInst | null = null;
  let bestDraw = -1;
  for (const c of st.hand) {
    let d = 0;
    for (const fx of cardDef(c.id).effects) if (fx.op === 'draw') d += fx.amount;
    if (d > bestDraw) {
      bestDraw = d;
      best = c;
    }
  }
  return best;
}

function continueAutoPlay(st: GameState, ev: Ev) {
  while (st.autoPlay && st.phase === 'action' && !st.pending && st.hand.length) {
    const c = nextAutoCard(st)!;
    playCard(st, c.uid, ev);
  }
  if (st.hand.length === 0 || st.phase !== 'action') st.autoPlay = false;
}

function reject(ev: Ev, reason: string): false {
  ev.push({ type: 'REJECTED', reason });
  return false;
}

function requireAction(st: GameState, ev: Ev): boolean {
  if (st.phase !== 'action') return reject(ev, 'Nicht in der Aktionsphase');
  if (st.pending) return reject(ev, 'Erst Auswahl treffen');
  return true;
}

/** Kosten einer Marktkarte im aktuellen Zug (Fluchkrähe-Aufschlag beim ersten Kauf). */
export function buyCost(st: GameState, cardId: string): number {
  return cardDef(cardId).cost + (st.bought === 0 ? st.buyTax : 0);
}

export function canUseAltar(st: GameState): boolean {
  return st.phase === 'action' && !st.pending && !st.altarUsed && st.influence >= ALTAR_COST && st.shadow > 0;
}

function endTurn(st: GameState, ev: Ev) {
  for (const e of st.active) {
    if (e.act >= 2 && e.hitTurn !== st.turn && e.dmg > 0) {
      const before = e.dmg;
      e.dmg = Math.max(0, e.dmg - REGEN);
      ev.push({ type: 'ENEMY_REGENERATED', enemyUid: e.uid, amount: before - e.dmg });
    }
  }
  const dropped = [...st.played, ...st.hand];
  st.discard.push(...dropped);
  st.played = [];
  st.hand = [];
  if (dropped.length) ev.push({ type: 'CARDS_DISCARDED', uids: dropped.map((c) => c.uid), reason: 'zugende' });
  draw(st, HAND_SIZE, ev);
  if (st.marketPile.length && st.market.length) {
    const gone = st.market.shift()!;
    st.marketGone.push(gone);
    const fresh = st.marketPile.pop()!;
    st.market.push(fresh);
    ev.push({ type: 'MARKET_ROTATED', goneUid: gone.uid, newUid: fresh.uid });
  }
  st.saved = Math.min(CARRY, st.influence);
  if (st.saved) ev.push({ type: 'INFLUENCE_SAVED', amount: st.saved });
  st.influence = 0;
  st.attack = 0;
  beginTurn(st, ev);
}

function choose(st: GameState, uid: number | null, ev: Ev): boolean {
  const p: Pending | null = st.pending;
  if (!p) return reject(ev, 'Keine Auswahl offen');
  if (p.kind === 'discard') {
    const idx = st.hand.findIndex((c) => c.uid === uid);
    if (idx < 0) return reject(ev, 'Karte nicht auf der Hand');
    const c = st.hand.splice(idx, 1)[0];
    st.discard.push(c);
    ev.push({ type: 'CARDS_DISCARDED', uids: [c.uid], reason: p.source });
    p.count -= 1;
    if (p.count <= 0) {
      st.pending = null;
      if (st.phase === 'start') advance(st, ev);
    }
    return true;
  }
  // banish
  if (uid !== null) {
    let found: CardInst | null = null;
    for (const pool of [st.hand, st.discard]) {
      const idx = pool.findIndex((c) => c.uid === uid);
      if (idx >= 0) {
        found = pool.splice(idx, 1)[0];
        break;
      }
    }
    if (!found) return reject(ev, 'Karte nicht in Hand oder Ablage');
    st.banished.push(found);
    ev.push({ type: 'CARD_BANISHED', uid: found.uid });
  }
  st.pending = null;
  continueAutoPlay(st, ev);
  return true;
}

// ---------- Einstieg ----------

/** Wendet eine Aktion auf den übergebenen Zustand an (verändert ihn). Liefert die Ereignisse. */
export function applyMut(st: GameState, action: Action): GameEvent[] {
  const ev: Ev = [];
  if (st.result && action.type !== 'choose') {
    reject(ev, 'Partie ist beendet');
    return ev;
  }
  switch (action.type) {
    case 'choose':
      choose(st, action.uid, ev);
      break;
    case 'playCard':
      if (requireAction(st, ev)) playCard(st, action.uid, ev);
      break;
    case 'playAll':
      if (requireAction(st, ev)) {
        st.autoPlay = true;
        continueAutoPlay(st, ev);
      }
      break;
    case 'assignAttack': {
      if (!requireAction(st, ev)) break;
      const e = findEnemy(st, action.enemyUid);
      if (!e) {
        reject(ev, 'Feind nicht aktiv');
        break;
      }
      const want = action.amount === 'kill' ? remaining(e) : action.amount;
      const amount = Math.max(0, Math.min(want, st.attack, remaining(e)));
      if (amount <= 0) {
        reject(ev, 'Kein Angriff verfügbar');
        break;
      }
      st.attack -= amount;
      ev.push({ type: 'ATTACK_ASSIGNED', enemyUid: e.uid, amount });
      damageEnemy(st, e, amount, ev);
      break;
    }
    case 'buy': {
      if (!requireAction(st, ev)) break;
      const idx = st.market.findIndex((c) => c.uid === action.uid);
      if (idx < 0) {
        reject(ev, 'Karte nicht im Markt');
        break;
      }
      const card = st.market[idx];
      const cost = buyCost(st, card.id);
      if (st.influence < cost) {
        reject(ev, 'Nicht genug Einfluss');
        break;
      }
      st.influence -= cost;
      st.bought += 1;
      st.market.splice(idx, 1);
      st.discard.push(card);
      if (st.marketPile.length) st.market.push(st.marketPile.pop()!);
      ev.push({ type: 'CARD_BOUGHT', uid: card.uid, cost });
      break;
    }
    case 'useAltar':
      if (!requireAction(st, ev)) break;
      if (!canUseAltar(st)) {
        reject(ev, 'Altar nicht nutzbar');
        break;
      }
      st.influence -= ALTAR_COST;
      st.altarUsed = true;
      removeShadow(st, 1, ev);
      ev.push({ type: 'ALTAR_USED' });
      break;
    case 'endTurn':
      if (requireAction(st, ev)) endTurn(st, ev);
      break;
  }
  return ev;
}

export function cloneState(st: GameState): GameState {
  return JSON.parse(JSON.stringify(st)) as GameState;
}

/** Reine Funktion: verändert den übergebenen Zustand nicht. */
export function apply(state: GameState, action: Action): ApplyResult {
  const st = cloneState(state);
  const events = applyMut(st, action);
  return { state: st, events };
}

/** Karten, die ein Bot oder Spieler zum Abwerfen oder Verbannen wählen darf. */
export function choiceCandidates(st: GameState): CardInst[] {
  if (!st.pending) return [];
  if (st.pending.kind === 'discard') return st.hand;
  return [...st.hand, ...st.discard];
}

export function countType(st: GameState, type: CardType): number {
  let n = 0;
  for (const pool of [st.deck, st.discard, st.hand]) for (const c of pool) if (cardDef(c.id).type === type) n++;
  return n;
}

export { rngNext };
