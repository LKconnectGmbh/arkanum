/** Karten in drei Größen: Marktkachel, Handkarte, Großansicht. */
import type { ReactNode } from 'react';
import { cardDef } from '../engine/data';
import type { CardDef } from '../engine/types';
import { displayName, EffectLine, TYPE_LABEL } from './format';
import { TypeJewel } from './icons';
import { usePress } from './press';

const MOTIF_GLYPH: Record<string, string> = {
  funke: '✦', stab: '⟋', spiegel: '◐', flasche: '⚗', kristall: '◇', flamme: '♨', kauz: '◉', wedel: '≋',
  schild: '⛨', otter: '∿', regen: '⁂', buch: '▤', licht: '☼', kessel: '◡', phiole: '⌬', feder: '❧',
  phoenix: '✺', stern: '✧', kreis: '◎', drache: '♆', herz: '♡',
};

export function Emblem({ def, size }: { def: CardDef; size: number }) {
  return (
    <div className={`emblem type-${def.type}`} style={{ width: size, height: size, fontSize: size * 0.55 }} aria-hidden>
      <span>{MOTIF_GLYPH[def.art.motif] ?? '✶'}</span>
    </div>
  );
}

/** Kompaktkachel im Markt: Typstreifen, Kostenmünze, Name, Effekt-Symbole. */
export function MarketTile({
  cardId,
  affordable,
  cost,
  onTap,
  uid,
}: {
  cardId: string;
  affordable: boolean;
  cost: number;
  onTap: () => void;
  uid?: number;
}) {
  const def = cardDef(cardId);
  const press = usePress(onTap);
  return (
    <button
      type="button"
      className={`tile market-tile type-${def.type} ${affordable ? 'affordable' : 'dim'}`}
      aria-label={`${def.name}, ${cost} Einfluss, ${def.text}`}
      data-tut={`market:${def.id}`}
      data-uid={uid}
      {...press}
    >
      <span className="tile-stripe" />
      <span className="tile-top">
        <span className="tile-name" lang="de">{displayName(def.id, def.name)}</span>
        <span className={`coin ${affordable ? '' : 'coin-red'}`}>{cost}</span>
      </span>
      <EffectLine effects={def.effects} size={14} className="tile-fx" compact />
    </button>
  );
}

/** Handkarte: Hochformat 5:7, nur Kosten, Name, Symbole. */
export function HandCard({
  cardId,
  onTap,
  width,
  dim,
  selected,
  uid,
  tut,
}: {
  cardId: string;
  onTap: () => void;
  width: number;
  dim?: boolean;
  selected?: boolean;
  uid?: number;
  /** Präfix für data-tut, z. B. „hand“ oder „choice“ */
  tut?: string;
}) {
  const def = cardDef(cardId);
  const press = usePress(onTap);
  return (
    <button
      type="button"
      className={`hand-card type-${def.type} ${dim ? 'dim' : ''} ${selected ? 'selected' : ''}`}
      style={{ width, height: Math.round((width * 7) / 5) }}
      aria-label={`${def.name}, ${def.text}`}
      data-uid={uid}
      data-tut={tut ? `${tut}:${def.id}` : undefined}
      {...press}
    >
      <span className="hc-top">
        <span className="coin coin-small">{def.cost}</span>
        <TypeJewel type={def.type} size={16} />
      </span>
      <Emblem def={def} size={Math.round(width * (width < 100 ? 0.4 : 0.5))} />
      <span className="hc-name" lang="de">{displayName(def.id, def.name)}</span>
      <EffectLine effects={def.effects} size={14} className="hc-fx" compact />
    </button>
  );
}

/** Großansicht einer Karte mit passenden Knöpfen darunter. */
export function CardView({ cardId, copiesNote, children }: { cardId: string; copiesNote?: string; children?: ReactNode }) {
  const def = cardDef(cardId);
  return (
    <div className="cardview-wrap">
      <div className={`cardview type-${def.type}`}>
        <div className="cv-frame">
          <div className="cv-top">
            <span className="coin coin-big">{def.cost}</span>
            <TypeJewel type={def.type} size={28} />
          </div>
          <div className="cv-art">
            <Emblem def={def} size={96} />
          </div>
          <div className="cv-name">{def.name}</div>
          <div className="cv-fx">
            <EffectLine effects={def.effects} size={22} />
          </div>
          <div className="cv-text">{def.text}</div>
          <div className="cv-foot">
            {TYPE_LABEL[def.type]} · {copiesNote ?? `${def.copies}×`}
          </div>
        </div>
      </div>
      {children && <div className="cv-actions">{children}</div>}
    </div>
  );
}
