/** Typen für Kartendaten, Spielstand, Aktionen und Ereignisse. Keine Logik. */

export type Difficulty = 'leicht' | 'normal' | 'schwer';
export type CardType = 'grund' | 'zauber' | 'objekt' | 'wesen';

/** Effekt-Bausteine für Karten, Omen, Feind-Fähigkeiten und Belohnungen. */
export type Effect =
  | { op: 'influence'; amount: number }
  | { op: 'attack'; amount: number }
  | { op: 'heal'; amount: number }
  | { op: 'shield'; amount: number }
  | { op: 'draw'; amount: number }
  | { op: 'banish'; amount: number }
  | { op: 'cleanse'; amount: number }
  | { op: 'selfDamage'; amount: number }
  | { op: 'peekOmen'; amount: number }
  | { op: 'onKillThisTurn'; then: Effect[] }
  | { op: 'perOtherOfType'; type: CardType; resource: 'attack' | 'influence'; amount: number; cap: number }
  // Feinde und Omen
  | { op: 'damage'; amount: number }
  | { op: 'discard'; amount: number }
  | { op: 'addShadow'; amount: number }
  | { op: 'everyNthTurn'; n: number; then: Effect[] }
  | { op: 'buyTax'; amount: number }
  | { op: 'blockHealing' };

export interface CardDef {
  id: string;
  name: string;
  type: CardType;
  cost: number;
  copies: number;
  effects: Effect[];
  text: string;
  art: { motif: string };
}

export interface EnemyDef {
  id: string;
  name: string;
  /** 1–3 für den Stapel, 0 für den Endgegner */
  act: number;
  hp: number;
  weakness: CardType | null;
  abilities: Effect[];
  reward: Effect[];
  abilityText: string;
  rewardText: string;
}

export interface OmenDef {
  id: string;
  name: string;
  copies: number;
  harmful: boolean;
  effects: Effect[];
  text: string;
}

export interface LocationDef {
  id: string;
  name: string;
}

export interface DifficultyDef {
  name: string;
  life: number;
  capacities: number[];
  omensPerLocation: number[];
  enemyHpBonus: number;
  bossHp: number;
  omenSwap: { from: string; to: string } | null;
  winChance: 'always' | 'toggle' | 'trend';
}

/** Karteninstanz im Spiel. uid ist eindeutig je Partie. */
export interface CardInst {
  uid: number;
  id: string;
}

export interface EnemyInst {
  uid: number;
  id: string;
  hp: number;
  /** erlittener Schaden, bleibt bis der Feind fällt */
  dmg: number;
  /** Züge im Spiel (für Wut) */
  age: number;
  /** Zug, in dem der Feind zuletzt Schaden bekam (für Regeneration) */
  hitTurn: number;
  act: number;
}

export type Pending =
  | { kind: 'discard'; count: number; source: string }
  | { kind: 'banish'; source: string };

export interface TurnCursor {
  stage: 'omen' | 'enemy';
  index: number;
  total: number;
}

export interface PerTypeBonus {
  type: CardType;
  resource: 'attack' | 'influence';
  amount: number;
  cap: number;
  granted: number;
}

/** Feste Aufstellung für die Einführung: Reihenfolgen statt Zufall. Kartenlisten sind Ziehreihenfolgen (erste zuerst). */
export interface ScriptedSetup {
  deck: string[];
  market: string[];
  marketPile: string[];
  queue: string[];
  omens: string[];
  /** Beim Neumischen der Ablage: Karten mit diesen Ids kommen in dieser Reihenfolge zuerst, der Rest danach. */
  reshuffles: string[][];
}

export interface GameState {
  version: 1;
  difficulty: Difficulty;
  /** Einführung: feste Reihenfolgen beim Neumischen, bis die Liste aufgebraucht ist */
  scriptedReshuffles?: string[][];
  tutorial?: boolean;
  seed: number;
  rng: number;
  nextUid: number;
  turn: number;
  /** start = Omen- und Feindphase laufen; action = Spieler ist dran; over = Partie beendet */
  phase: 'start' | 'action' | 'over';
  cursor: TurnCursor | null;
  pending: Pending | null;
  /** „Alle ausspielen“ läuft nach einer Auswahl weiter */
  autoPlay: boolean;

  deck: CardInst[];
  hand: CardInst[];
  played: CardInst[];
  discard: CardInst[];
  banished: CardInst[];
  market: CardInst[];
  marketPile: CardInst[];
  marketGone: CardInst[];

  life: number;
  maxLife: number;
  location: number;
  shadow: number;

  omenPile: string[];
  omenDiscard: string[];
  omenAll: string[];

  queue: EnemyInst[];
  active: EnemyInst[];
  boss: EnemyInst | null;
  defeated: EnemyInst[];

  influence: number;
  saved: number;
  attack: number;
  shield: number;
  altarUsed: boolean;
  buyTax: number;
  bought: number;
  healBlocked: boolean;
  killBonus: number;
  killedThisTurn: boolean;
  typeCounts: Record<CardType, number>;
  perTypeBonus: PerTypeBonus[];

  stuns: number;
  result: 'win' | 'loss' | null;
}

export type Action =
  | { type: 'playCard'; uid: number }
  | { type: 'playAll' }
  | { type: 'assignAttack'; enemyUid: number; amount: number | 'kill' }
  | { type: 'buy'; uid: number }
  | { type: 'useAltar' }
  | { type: 'endTurn' }
  | { type: 'choose'; uid: number | null };

export type GameEvent =
  | { type: 'TURN_STARTED'; turn: number }
  | { type: 'OMEN_REVEALED'; omen: string }
  | { type: 'OMEN_RESHUFFLED' }
  | { type: 'OMEN_PEEKED'; omen: string; discarded: boolean }
  | { type: 'ENEMY_ACTED'; enemyUid: number; damage: number; wut: boolean }
  | { type: 'ENEMY_ARRIVED'; enemyUid: number }
  | { type: 'BOSS_ARRIVED' }
  | { type: 'DAMAGE_TAKEN'; amount: number; blocked: number; source: string }
  | { type: 'HEALED'; amount: number }
  | { type: 'STUNNED' }
  | { type: 'SHADOW_ADDED'; amount: number }
  | { type: 'SHADOW_REMOVED'; amount: number }
  | { type: 'LOCATION_FALLEN'; location: number }
  | { type: 'CARDS_DISCARDED'; uids: number[]; reason: string }
  | { type: 'CARD_DRAWN'; uid: number }
  | { type: 'DECK_RESHUFFLED' }
  | { type: 'CHOICE_REQUIRED'; pending: Pending }
  | { type: 'ACTION_PHASE' }
  | { type: 'CARDS_PLAYED'; uids: number[] }
  | { type: 'WEAKNESS_HIT'; enemyUid: number; cardUid: number }
  | { type: 'ATTACK_ASSIGNED'; enemyUid: number; amount: number }
  | { type: 'ENEMY_DEFEATED'; enemyUid: number; enemyId: string }
  | { type: 'ENEMY_REGENERATED'; enemyUid: number; amount: number }
  | { type: 'INFLUENCE_GAINED'; amount: number; source: string }
  | { type: 'CARD_BOUGHT'; uid: number; cost: number }
  | { type: 'CARD_BANISHED'; uid: number }
  | { type: 'ALTAR_USED' }
  | { type: 'MARKET_ROTATED'; goneUid: number; newUid: number | null }
  | { type: 'INFLUENCE_SAVED'; amount: number }
  | { type: 'GAME_OVER'; result: 'win' | 'loss' }
  | { type: 'REJECTED'; reason: string }
  // Ereignisse der Oberfläche, für Einführung und Hinweise
  | { type: 'CARD_ZOOMED'; uid: number; zone: 'hand' | 'market' | 'pile' }
  | { type: 'CHOICE_PICKED'; uid: number | null }
  | { type: 'SHEET_CLOSED' };

export interface ApplyResult {
  state: GameState;
  events: GameEvent[];
}
