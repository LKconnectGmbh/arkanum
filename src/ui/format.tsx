/** Effekte und Ereignisse als Symbole und Sätze. */
import { Fragment } from 'react';
import { cardDef, enemyDef, OMEN_BY_ID, LOCATIONS } from '../engine/data';
import type { CardType, Effect, GameEvent, GameState } from '../engine/types';
import { Sym, type SymKind } from './icons';

export const TYPE_LABEL: Record<CardType, string> = { grund: 'Grund', zauber: 'Zauber', objekt: 'Objekt', wesen: 'Wesen' };

/** Trennstellen für schmale Kacheln (weiche Trennzeichen, nur Anzeige). */
const SHY = '­';
const HYPHENS: Record<string, string> = {
  funke: `Funken${SHY}zauber`, stab: `Übungs${SHY}stab`, licht: `Licht${SHY}funke`, spiegel: `Spiegel der Weit${SHY}sicht`,
  trank: `Kräuter${SHY}trank`, kristall: `Glimmer${SHY}kristall`, kobold: `Feuer${SHY}kobold`, kauz: `Boten${SHY}kauz`,
  staub: `Staub${SHY}wedel${SHY}zauber`, schild: `Schild${SHY}bann`, otter: `Silber${SHY}otter`, regen: `Funken${SHY}regen`,
  foliant: `Alter Foliant`, laeut: `Läute${SHY}rung`, kessel: `Goldener Kessel`, phiole: `Erinne${SHY}rungs${SHY}phiole`,
  greif: `Sturm${SHY}feder-Greif`, feder: `Junger Phönix`, zirkel: `Sternen${SHY}zirkel`, bann: `Bann${SHY}kreis`,
  drache: `Nacht${SHY}schwingen-Drache`, herz: `Herz der Akademie`,
  irrlicht: `Irrlicht-Schemen`, spinne: `Moor${SHY}spinne`, kraehe: `Fluch${SHY}krähe`, wolf: `Knochen${SHY}wolf`,
  weber: `Fluch${SHY}weber`, zehrer: `Seelen${SHY}zehrer`, schattendrache: `Schatten${SHY}drache`, hexer: `Graue Hexen${SHY}meisterin`,
  fuerst: `Der Namenlose Fürst`,
};
export function displayName(id: string, fallback: string): string {
  return HYPHENS[id] ?? fallback;
}

interface Piece {
  text: string;
  sym?: SymKind;
}

export function effectPieces(effects: Effect[]): Piece[] {
  const out: Piece[] = [];
  for (const fx of effects) {
    switch (fx.op) {
      case 'influence': out.push({ text: `+${fx.amount}`, sym: 'influence' }); break;
      case 'attack': out.push({ text: `+${fx.amount}`, sym: 'attack' }); break;
      case 'heal': out.push({ text: `+${fx.amount}`, sym: 'life' }); break;
      case 'shield': out.push({ text: `+${fx.amount}`, sym: 'shield' }); break;
      case 'draw': out.push({ text: `${fx.amount}`, sym: 'draw' }); break;
      case 'banish': out.push({ text: '', sym: 'banish' }); break;
      case 'cleanse': out.push({ text: `−${fx.amount}`, sym: 'shadow' }); break;
      case 'selfDamage': out.push({ text: `−${fx.amount}`, sym: 'life' }); break;
      case 'peekOmen': out.push({ text: '', sym: 'omen' }); break;
      case 'onKillThisTurn': out.push({ text: '★ +1', sym: 'influence' }); break;
      case 'perOtherOfType': out.push({ text: `+${fx.amount}/${TYPE_LABEL[fx.type]}`, sym: fx.resource }); break;
      case 'damage': out.push({ text: `${fx.amount}`, sym: 'attack' }); break;
      case 'discard': out.push({ text: `−${fx.amount} Hand` }); break;
      case 'addShadow': out.push({ text: `+${fx.amount}`, sym: 'shadow' }); break;
      case 'everyNthTurn': out.push({ text: `jeder ${fx.n}. Zug:` }, ...effectPieces(fx.then)); break;
      case 'buyTax': out.push({ text: `Kauf +${fx.amount}`, sym: 'influence' }); break;
      case 'blockHealing': out.push({ text: 'keine', sym: 'life' }); break;
    }
  }
  return out;
}

export function EffectLine({ effects, size = 16, className, compact }: { effects: Effect[]; size?: number; className?: string; compact?: boolean }) {
  const pieces = effectPieces(effects).map((p) => (compact ? { ...p, text: p.text.replace(/^\+/, '') } : p));
  return (
    <span className={`fx ${className ?? ''}`}>
      {pieces.map((p, i) => (
        <Fragment key={i}>
          {i > 0 && <span className="fx-sep"> </span>}
          <span className="fx-piece">
            {p.text && <span>{p.text}</span>}
            {p.sym && <Sym kind={p.sym} size={size} />}
          </span>
        </Fragment>
      ))}
    </span>
  );
}

function enemyName(st: GameState, uid: number): string {
  for (const e of [...st.active, ...st.defeated, ...(st.boss ? [st.boss] : [])]) if (e.uid === uid) return enemyDef(e.id).name;
  return 'Feind';
}

function cardName(st: GameState, uid: number): string {
  for (const pool of [st.hand, st.played, st.discard, st.deck, st.banished, st.market, st.marketPile, st.marketGone])
    for (const c of pool) if (c.uid === uid) return cardDef(c.id).name;
  return 'Karte';
}

/** Ereignisse der Omen- und Feindphase als kurze Sätze. */
export function describeEvents(events: GameEvent[], st: GameState): string[] {
  const out: string[] = [];
  for (const e of events) {
    switch (e.type) {
      case 'OMEN_RESHUFFLED': out.push('Omen-Stapel neu gemischt: +1 Schatten.'); break;
      case 'OMEN_REVEALED': { const o = OMEN_BY_ID[e.omen]; out.push(`Omen „${o.name}“: ${o.text}.`); break; }
      case 'ENEMY_ACTED': {
        const name = enemyName(st, e.enemyUid);
        const def = enemyDef([...st.active, ...(st.boss ? [st.boss] : [])].find((x) => x.uid === e.enemyUid)?.id ?? 'irrlicht');
        out.push(`${name}: ${def.abilityText}${e.wut ? ' (Wut: +1 Schaden)' : ''}.`);
        break;
      }
      case 'STUNNED': out.push('Betäubt! 1 Schatten, halbe Hand abgeworfen, Leben wieder voll.'); break;
      case 'LOCATION_FALLEN': out.push(`${LOCATIONS[e.location]?.name ?? 'Ort'} ist voller Schatten und fällt.`); break;
      case 'DAMAGE_TAKEN': if (e.blocked) out.push(`Schild blockt ${e.blocked} Schaden.`); break;
      case 'ENEMY_REGENERATED': out.push(`${enemyName(st, e.enemyUid)} regeneriert ${e.amount}.`); break;
      case 'ENEMY_ARRIVED': out.push(`${enemyName(st, e.enemyUid)} rückt nach.`); break;
      case 'BOSS_ARRIVED': out.push('Der Namenlose Fürst tritt hervor.'); break;
      case 'ENEMY_DEFEATED': out.push(`${enemyDef(e.enemyId).name} besiegt: ${enemyDef(e.enemyId).rewardText}.`); break;
      case 'OMEN_PEEKED': { const o = OMEN_BY_ID[e.omen]; out.push(e.discarded ? `Spiegel: „${o.name}“ abgeworfen.` : `Spiegel: „${o.name}“ bleibt liegen.`); break; }
      case 'INFLUENCE_SAVED': out.push(`${e.amount} Einfluss mitgenommen.`); break;
      case 'CARD_BANISHED': out.push(`${cardName(st, e.uid)} verbannt.`); break;
      case 'GAME_OVER': out.push(e.result === 'win' ? 'Sieg! Der Namenlose Fürst ist gefallen.' : 'Niederlage. Der dritte Ort ist voller Schatten.'); break;
      default: break;
    }
  }
  return out;
}
