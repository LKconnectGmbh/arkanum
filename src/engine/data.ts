/** Zugriff auf die Kartendaten aus src/data. */
import cardsJson from '../data/cards.json';
import enemiesJson from '../data/enemies.json';
import omensJson from '../data/omens.json';
import locationsJson from '../data/locations.json';
import difficultyJson from '../data/difficulty.json';
import type { CardDef, CardType, Difficulty, DifficultyDef, EnemyDef, LocationDef, OmenDef } from './types';

export const STARTER: CardDef[] = cardsJson.starter as CardDef[];
export const MARKET: CardDef[] = cardsJson.market as CardDef[];
export const ENEMIES: EnemyDef[] = enemiesJson as EnemyDef[];
export const OMENS: OmenDef[] = omensJson as OmenDef[];
export const LOCATIONS: LocationDef[] = locationsJson as LocationDef[];
export const DIFFICULTY: Record<Difficulty, DifficultyDef> = difficultyJson as Record<Difficulty, DifficultyDef>;

export const CARD_BY_ID: Record<string, CardDef> = {};
for (const c of [...STARTER, ...MARKET]) CARD_BY_ID[c.id] = c;

export const ENEMY_BY_ID: Record<string, EnemyDef> = {};
for (const e of ENEMIES) ENEMY_BY_ID[e.id] = e;

export const OMEN_BY_ID: Record<string, OmenDef> = {};
for (const o of OMENS) OMEN_BY_ID[o.id] = o;

export const BOSS_ID = 'fuerst';

export function cardDef(id: string): CardDef {
  const d = CARD_BY_ID[id];
  if (!d) throw new Error(`Unbekannte Karte: ${id}`);
  return d;
}

export function enemyDef(id: string): EnemyDef {
  const d = ENEMY_BY_ID[id];
  if (!d) throw new Error(`Unbekannter Feind: ${id}`);
  return d;
}

/** Kurzwerte einer Karte (für Bots und Kacheln): Summe der einfachen Bausteine. */
export interface CardSummary {
  influence: number;
  attack: number;
  heal: number;
  shield: number;
  draw: number;
  banish: number;
  cleanse: number;
  selfDamage: number;
}

const summaryCache: Record<string, CardSummary> = {};
export function cardSummary(id: string): CardSummary {
  let s = summaryCache[id];
  if (s) return s;
  s = { influence: 0, attack: 0, heal: 0, shield: 0, draw: 0, banish: 0, cleanse: 0, selfDamage: 0 };
  for (const e of cardDef(id).effects) {
    if (e.op in s) (s as unknown as Record<string, number>)[e.op] += (e as { amount: number }).amount;
  }
  summaryCache[id] = s;
  return s;
}

export const TYPE_NAMES: Record<CardType, string> = {
  grund: 'Grund',
  zauber: 'Zauber',
  objekt: 'Objekt',
  wesen: 'Wesen',
};
