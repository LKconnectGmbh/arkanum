/** Grimoire: Kartenlexikon aller 85 Karten, Regeln auf einer Seite, Symbol-Legende, Rückseiten. */
import { useState } from 'react';
import { ENEMIES, LOCATIONS, MARKET, OMENS, STARTER, DIFFICULTY } from '../engine/data';
import type { CardType, EnemyDef } from '../engine/types';
import { BackAkademie, BackFeind, BackOmen } from './backs';
import { CardView, MarketTile } from './Card';
import { EnemyView } from './Enemy';
import { EffectLine, TYPE_LABEL } from './format';
import { Sym, TypeJewel } from './icons';
import { Sheet } from './Sheet';

type Tab = 'karten' | 'feinde' | 'regeln' | 'symbole';
type CostFilter = 'alle' | 'bis3' | '4-5' | 'ab6';

export function RulesList() {
  return (
    <ul className="summary">
      <li>Du gewinnst, wenn der Namenlose Fürst fällt. Er kommt, sobald die fünf anderen Feinde besiegt sind.</li>
      <li>Du verlierst, wenn der dritte Ort voller Schatten ist.</li>
      <li>Jeder Zug: Omen, dann handeln die Feinde, dann du: Karten spielen, Angriff verteilen, kaufen. Danach ablegen, 5 ziehen.</li>
      <li>Jede Karte vom Schwäche-Typ eines Feindes trifft ihn beim Ausspielen automatisch für 1.</li>
      <li>Feinde ab Akt II heilen am Zugende 2, wenn sie in diesem Zug keinen Schaden bekamen.</li>
      <li>Wut: Ein Feind, der 3 Züge im Spiel ist, macht ab dem 4. Zug 1 Schaden mehr.</li>
      <li>Altar: Einmal pro Zug 4 Einfluss gegen 1 Schatten, vor oder nach dem Kaufen.</li>
      <li>Bis zu 2 Einfluss bleiben für den nächsten Zug gespart. Schild hält bis nach der nächsten Feindphase.</li>
      <li>Leben auf 0: 1 Schatten, halbe Hand weg, Leben wieder voll.</li>
      <li>Verbannen entfernt eine Karte für immer. Das wichtigste Mittel, das Deck zu verbessern.</li>
    </ul>
  );
}

export function Grimoire({ onClose, onReplayTutorial }: { onClose: () => void; onReplayTutorial: () => void }) {
  const [tab, setTab] = useState<Tab>('karten');
  const [type, setType] = useState<CardType | 'alle'>('alle');
  const [cost, setCost] = useState<CostFilter>('alle');
  const [card, setCard] = useState<string | null>(null);
  const [enemy, setEnemy] = useState<EnemyDef | null>(null);

  const cards = [...STARTER, ...MARKET].filter((c) => (type === 'alle' || c.type === type) && (cost === 'alle' || (cost === 'bis3' ? c.cost <= 3 : cost === '4-5' ? c.cost >= 4 && c.cost <= 5 : c.cost >= 6)));
  const total = STARTER.reduce((n, c) => n + c.copies, 0) + MARKET.reduce((n, c) => n + c.copies, 0) + ENEMIES.length + OMENS.reduce((n, o) => n + o.copies, 0) + LOCATIONS.length;

  return (
    <Sheet onClose={onClose} title={`Grimoire · ${total} Karten`} align="bottom">
      <div className="pile-tabs">
        {(['karten', 'feinde', 'regeln', 'symbole'] as Tab[]).map((t) => (
          <button key={t} type="button" className={`btn btn-small ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'karten' ? 'Karten' : t === 'feinde' ? 'Feinde & Omen' : t === 'regeln' ? 'Regeln' : 'Symbole'}
          </button>
        ))}
      </div>

      {tab === 'karten' && (
        <>
          <div className="pile-tabs">
            {(['alle', 'zauber', 'objekt', 'wesen', 'grund'] as const).map((t) => (
              <button key={t} type="button" className={`btn btn-small ${type === t ? 'active' : ''}`} onClick={() => setType(t)}>
                {t === 'alle' ? 'Alle Typen' : TYPE_LABEL[t]}
              </button>
            ))}
          </div>
          <div className="pile-tabs">
            {(['alle', 'bis3', '4-5', 'ab6'] as CostFilter[]).map((c) => (
              <button key={c} type="button" className={`btn btn-small ${cost === c ? 'active' : ''}`} onClick={() => setCost(c)}>
                {c === 'alle' ? 'Alle Kosten' : c === 'bis3' ? 'bis 3 ◆' : c === '4-5' ? '4–5 ◆' : 'ab 6 ◆'}
              </button>
            ))}
          </div>
          <div className="grimoire-grid">
            {cards.map((c) => (
              <div key={c.id} className="grimoire-item">
                <MarketTile cardId={c.id} cost={c.cost} affordable onTap={() => setCard(c.id)} />
                <small>{c.copies}×</small>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'feinde' && (
        <div className="grimoire-list">
          <h3 className="grimoire-h">Feinde</h3>
          {ENEMIES.map((e) => (
            <button key={e.id} type="button" className="grimoire-row" onClick={() => setEnemy(e)}>
              <span className="grimoire-row-head">
                <strong>{e.name}</strong>
                <span className="hint">{e.act === 0 ? 'Endgegner' : `Akt ${['', 'I', 'II', 'III'][e.act]}`} · {e.hp} ♥{e.weakness ? ' · Schwäche ' : ''}{e.weakness && <TypeJewel type={e.weakness} size={14} />}</span>
              </span>
              <span className="hint">{e.abilityText}. Belohnung: {e.rewardText}.</span>
            </button>
          ))}
          <h3 className="grimoire-h">Omen</h3>
          {OMENS.map((o) => (
            <div key={o.id} className="grimoire-row static">
              <span className="grimoire-row-head"><strong>{o.name}</strong><span className="hint">{o.copies}×</span></span>
              <span className="hint">{o.text}. {o.id === 'kaelte' ? 'Auf Leicht durch Atempause ersetzt.' : ''}</span>
            </div>
          ))}
          <h3 className="grimoire-h">Orte</h3>
          {LOCATIONS.map((l, i) => (
            <div key={l.id} className="grimoire-row static">
              <span className="grimoire-row-head"><strong>{l.name}</strong><span className="hint">Platz für {DIFFICULTY.normal.capacities[i]} Schatten{i === 1 ? ' (Schwer: 4)' : ''}</span></span>
            </div>
          ))}
        </div>
      )}

      {tab === 'regeln' && (
        <>
          <RulesList />
          <button type="button" className="btn" onClick={onReplayTutorial}>Einführung wiederholen</button>
        </>
      )}

      {tab === 'symbole' && (
        <div className="grimoire-list">
          {(
            [
              ['influence', 'Einfluss: kauft Karten im Markt. Bis zu 2 bleiben gespart.'],
              ['attack', 'Angriff: Schaden an Feinden, verfällt am Zugende.'],
              ['life', 'Leben: Start 10 (Leicht 12). Bei 0 bist du betäubt.'],
              ['shadow', 'Schatten: Zähler auf dem Ort. Voll = Ort fällt.'],
              ['shield', 'Schild: blockt Schaden bis nach der nächsten Feindphase.'],
              ['draw', 'Ziehen: Karten vom Nachziehstapel auf die Hand.'],
              ['banish', 'Verbannen: Karte verlässt das Spiel für immer.'],
              ['omen', 'Omen: jeden Zug eines, am dritten Ort zwei (nicht auf Leicht).'],
              ['wut', 'Wut: ab dem 4. Zug im Spiel 1 Schaden mehr.'],
            ] as const
          ).map(([k, t]) => (
            <div key={k} className="legend-row"><Sym kind={k} size={22} /> <span>{t}</span></div>
          ))}
          <div className="legend-row"><TypeJewel type="zauber" size={22} /> <span>Zauber (Sternraute): gesprochene Magie.</span></div>
          <div className="legend-row"><TypeJewel type="objekt" size={22} /> <span>Objekt (eckiges Siegel): Werkzeuge der Akademie.</span></div>
          <div className="legend-row"><TypeJewel type="wesen" size={22} /> <span>Wesen (Kreis mit Pfote): magische Verbündete.</span></div>
          <div className="legend-row"><TypeJewel type="grund" size={22} /> <span>Grund: Startkarten ohne Typ, treffen keine Schwäche.</span></div>
          <h3 className="grimoire-h">Rückseiten</h3>
          <div className="backs-row">
            <div><BackAkademie size={56} /><small>Akademie</small></div>
            <div><BackOmen size={56} /><small>Omen</small></div>
            <div><BackFeind size={56} /><small>Feinde</small></div>
          </div>
          <div className="legend-row"><EffectLine effects={[{ op: 'attack', amount: 2 }, { op: 'influence', amount: 1 }]} size={18} /> <span>So liest du eine Kachel: +2 ⚡, +1 ◆.</span></div>
        </div>
      )}

      <button type="button" className="btn" onClick={onClose}>Schließen</button>

      {card && (
        <Sheet onClose={() => setCard(null)} title={cards.find((c) => c.id === card)?.name}>
          <CardView cardId={card}>
            <button type="button" className="btn" onClick={() => setCard(null)}>Schließen</button>
          </CardView>
        </Sheet>
      )}
      {enemy && (
        <Sheet onClose={() => setEnemy(null)} title={enemy.name}>
          <EnemyView enemy={{ uid: 0, id: enemy.id, hp: enemy.hp, dmg: 0, age: 0, hitTurn: 0, act: enemy.act }} isBoss={enemy.act === 0}>
            <button type="button" className="btn" onClick={() => setEnemy(null)}>Schließen</button>
          </EnemyView>
        </Sheet>
      )}
    </Sheet>
  );
}
