/** Das Spielfeld: sechs Zonen, Großansichten, Auswahl, Zugzusammenfassung, Partieende, Einführung, Hinweise. */
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { cardDef, enemyDef, LOCATIONS, OMEN_BY_ID, DIFFICULTY } from '../engine/data';
import { ALTAR_COST, bossActive, buyCost, canUseAltar, capacity, remaining } from '../engine/rules';
import type { CardInst, EnemyInst, GameEvent, GameState } from '../engine/types';
import { BackAkademie, BackFeind, BackOmen } from './backs';
import { CardView, HandCard, MarketTile } from './Card';
import { ChanceBadge, ChanceCurve, ChanceSettings } from './Chance';
import { CoachMark } from './CoachMark';
import { rectOfSelector, useEffects } from './effects';
import { EnemyTile, EnemyView } from './Enemy';
import { describeEvents } from './format';
import { Grimoire, RulesList } from './Grimoire';
import { Sym } from './icons';
import { effectiveChanceMode, type ChanceMode } from './settings';
import { Sheet } from './Sheet';
import type { Game } from './store';
import { useHints } from './useHints';
import { useTutorial, type TutorialProgress } from './useTutorial';
import { useWinChance } from './useWinChance';

type SheetState =
  | { kind: 'hand'; uid: number }
  | { kind: 'market'; uid: number }
  | { kind: 'card'; id: string }
  | { kind: 'enemy'; uid: number }
  | { kind: 'summary'; lines: string[]; title: string }
  | { kind: 'choice' }
  | { kind: 'pile'; which: 'discard' | 'deck' | 'banished' | 'played' }
  | { kind: 'omen' }
  | { kind: 'location' }
  | { kind: 'menu' }
  | { kind: 'rules' }
  | { kind: 'grimoire' }
  | { kind: 'newgame'; tutorial?: boolean }
  | { kind: 'endwarn'; reasons: string[] }
  | { kind: 'chance' }
  | { kind: 'over' };

const START_EVENTS = new Set<GameEvent['type']>([
  'OMEN_REVEALED', 'OMEN_RESHUFFLED', 'ENEMY_ACTED', 'STUNNED', 'LOCATION_FALLEN', 'ENEMY_REGENERATED', 'INFLUENCE_SAVED',
]);

function sortCards(cards: CardInst[]): CardInst[] {
  return cards.slice().sort((a, b) => {
    const da = cardDef(a.id);
    const db = cardDef(b.id);
    return da.cost - db.cost || da.name.localeCompare(db.name, 'de');
  });
}

export interface BoardProps {
  game: Game;
  onQuit: () => void;
  onReplayTutorial: () => void;
  chanceMode: ChanceMode;
  onChanceMode: (m: ChanceMode) => void;
  tutorialEnabled: boolean;
  tutorialProgress: TutorialProgress;
}

export function Board({ game, onQuit, onReplayTutorial, chanceMode, onChanceMode, tutorialEnabled, tutorialProgress }: BoardProps) {
  const st = game.state;
  const chanceView = effectiveChanceMode(chanceMode, st.difficulty);
  const chanceStatus = useWinChance(game, true);
  const tutorial = useTutorial(game, tutorialEnabled, tutorialProgress);
  const hints = useHints(game, !tutorial.active, chanceView !== 'off');
  const fx = useEffects();
  const [sheet, setSheet] = useState<SheetState | null>(null);
  const [choicePick, setChoicePick] = useState<number | null>(null);
  const [sparks, setSparks] = useState<Set<number>>(new Set());
  const queueRef = useRef<SheetState[]>([]);
  const sheetRef = useRef<SheetState | null>(null);
  sheetRef.current = sheet;

  const showNext = useCallback(() => {
    const next = queueRef.current.shift() ?? null;
    setSheet(next);
  }, []);

  /** Nach jeder Aktion: Zusammenfassung der Omen-/Feindphase, offene Auswahl, Partieende. */
  const handleEvents = useCallback(
    (events: GameEvent[], next: GameState) => {
      // Reine Oberflächen-Ereignisse ändern keine Blätter
      if (events.every((e) => e.type === 'CARD_ZOOMED' || e.type === 'CHOICE_PICKED' || e.type === 'SHEET_CLOSED')) return;
      const startEvents = events.filter((e) => START_EVENTS.has(e.type));
      const q: SheetState[] = [];
      if (next.result) {
        q.push({ kind: 'over' });
      } else {
        if (startEvents.length) {
          const turnStarted = events.find((e) => e.type === 'TURN_STARTED');
          q.push({ kind: 'summary', title: turnStarted ? `Zug ${next.turn}` : `Zug ${next.turn}, weiter`, lines: describeEvents(events, next) });
        }
        if (next.pending) q.push({ kind: 'choice' });
      }
      if (q.length) {
        queueRef.current = q.slice(1);
        setChoicePick(null);
        setSheet(q[0]);
        return;
      }
      const cur = sheetRef.current;
      if (cur?.kind === 'choice') setSheet(null);
      if (cur?.kind === 'enemy' && events.some((e) => e.type === 'ENEMY_DEFEATED')) setSheet(null);
    },
    [],
  );

  /** Bewegung: Schadenszahlen, Funken, Belohnungen. Gemessen wird vor dem Neuzeichnen. */
  const animateEvents = useCallback(
    (events: GameEvent[]) => {
      for (const e of events) {
        switch (e.type) {
          case 'ATTACK_ASSIGNED':
            fx.float(`[data-enemy="${e.enemyUid}"]`, `−${e.amount}`, 'float-dmg');
            break;
          case 'WEAKNESS_HIT':
            fx.float(`[data-enemy="${e.enemyUid}"]`, '−1 ✦', 'float-weak', -22);
            setSparks((s) => new Set(s).add(e.enemyUid));
            window.setTimeout(() => setSparks((s) => { const n = new Set(s); n.delete(e.enemyUid); return n; }), 450);
            break;
          case 'ENEMY_DEFEATED':
            fx.float(`[data-enemy="${e.enemyUid}"]`, 'Besiegt!', 'float-win', 10);
            break;
          case 'DAMAGE_TAKEN':
            if (e.amount > 0) fx.float('[data-tut="life"]', `−${e.amount}`, 'float-dmg', 4);
            break;
          case 'HEALED':
            fx.float('[data-tut="life"]', `+${e.amount}`, 'float-heal', 4);
            break;
          case 'INFLUENCE_GAINED':
            fx.float('[data-tut="influence"]', `+${e.amount}`, 'float-inf', 4);
            break;
          case 'SHADOW_REMOVED':
            fx.float('[data-tut="location"]', `−${e.amount} ☾`, 'float-heal', 0);
            break;
          case 'SHADOW_ADDED':
            fx.float('[data-tut="location"]', `+${e.amount} ☾`, 'float-dmg', 0);
            break;
          default:
            break;
        }
      }
    },
    [fx],
  );

  useEffect(() => game.subscribe(handleEvents), [game, handleEvents]);
  useEffect(() => game.subscribe(animateEvents), [game, animateEvents]);
  useEffect(() => {
    if (import.meta.env.DEV) (window as unknown as { __arkanum: Game }).__arkanum = game;
  }, [game]);

  // Beim Laden einer gespeicherten Partie: offene Auswahl oder Ende gleich zeigen
  const mounted = useRef(false);
  useEffect(() => {
    if (mounted.current) return;
    mounted.current = true;
    if (st.result) setSheet({ kind: 'over' });
    else if (game.lastEvents.length) handleEvents(game.lastEvents, st);
    else if (st.pending) setSheet({ kind: 'choice' });
  }, [st, game.lastEvents, handleEvents]);

  const close = useCallback(() => {
    setChoicePick(null);
    showNext();
    game.emitUi({ type: 'SHEET_CLOSED' });
  }, [showNext, game]);

  const d = DIFFICULTY[st.difficulty];
  const cap = capacity(st);
  const boss = bossActive(st) ? st.boss : null;
  const altarOk = canUseAltar(st);
  const altarUrgent = st.shadow >= cap - 2 && st.shadow > 0;
  const acting = st.phase === 'action' && !st.pending;
  const pileSel = '[data-tut="pile"]';

  // ---------- Aktionen mit Bewegung ----------
  const playCard = (uid: number) => {
    const c = st.hand.find((x) => x.uid === uid);
    const from = rectOfSelector(`.hand [data-uid="${uid}"]`);
    game.dispatch({ type: 'playCard', uid });
    if (c) fx.fly(c.id, from, rectOfSelector(pileSel));
  };
  const playAll = () => {
    const rects = st.hand.map((c) => ({ id: c.id, from: rectOfSelector(`.hand [data-uid="${c.uid}"]`) }));
    game.dispatch({ type: 'playAll' });
    const to = rectOfSelector(pileSel);
    rects.forEach((r, i) => window.setTimeout(() => fx.fly(r.id, r.from, to), i * 40));
  };
  const buy = (uid: number) => {
    const c = st.market.find((x) => x.uid === uid);
    const from = rectOfSelector(`.market [data-uid="${uid}"]`);
    game.dispatch({ type: 'buy', uid });
    if (c) fx.fly(c.id, from, rectOfSelector(pileSel));
  };

  const tapEnemy = (e: EnemyInst) => {
    if (acting && st.attack > 0) game.dispatch({ type: 'assignAttack', enemyUid: e.uid, amount: 1 });
    else setSheet({ kind: 'enemy', uid: e.uid });
  };
  const longEnemy = (e: EnemyInst) => {
    if (acting && st.attack > 0) game.dispatch({ type: 'assignAttack', enemyUid: e.uid, amount: 'kill' });
    else setSheet({ kind: 'enemy', uid: e.uid });
  };

  const tryEndTurn = () => {
    const reasons: string[] = [];
    if (st.influence > 2) reasons.push(`${st.influence - 2} Einfluss verfällt (2 bleiben gespart).`);
    if (st.attack > 0) reasons.push(`${st.attack} Angriff ist noch nicht verteilt.`);
    if (st.hand.length > 0) reasons.push(`${st.hand.length} Handkarte${st.hand.length > 1 ? 'n werden' : ' wird'} ungespielt abgelegt.`);
    const guided = tutorial.step?.target === 'endTurn';
    if (reasons.length && !guided) setSheet({ kind: 'endwarn', reasons });
    else game.dispatch({ type: 'endTurn' });
  };

  const findEnemy = (uid: number): EnemyInst | null =>
    st.active.find((e) => e.uid === uid) ?? (st.boss && st.boss.uid === uid ? st.boss : null);

  const openZoom = (kind: 'hand' | 'market', uid: number) => {
    setSheet({ kind, uid });
    game.emitUi({ type: 'CARD_ZOOMED', uid, zone: kind });
  };

  // ---------- Hand-Layout ----------
  const handRef = useRef<HTMLDivElement>(null);
  const [handWidth, setHandWidth] = useState(328);
  useLayoutEffect(() => {
    const el = handRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHandWidth(el.clientWidth));
    ro.observe(el);
    setHandWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);
  const n = st.hand.length;
  const cardW = n >= 6 ? 100 : 114;
  const scroll = n >= 7;
  let visible = n <= 1 ? cardW : Math.floor((handWidth - cardW) / (n - 1));
  if (n <= 5) visible = Math.min(visible, 54 + cardW - 114 + 60);
  if (n === 6) visible = Math.min(visible, 46);
  if (scroll) visible = 46;
  visible = Math.max(44, Math.min(visible, cardW));

  // ---------- Sheets ----------
  let sheetNode: ReactNode = null;
  if (sheet) {
    switch (sheet.kind) {
      case 'hand': {
        const c = st.hand.find((x) => x.uid === sheet.uid);
        if (c)
          sheetNode = (
            <Sheet onClose={close} title={cardDef(c.id).name}>
              <CardView cardId={c.id}>
                <button type="button" className="btn btn-primary" disabled={!acting} onClick={() => { playCard(c.uid); close(); }}>
                  Ausspielen
                </button>
                <button type="button" className="btn" onClick={close}>Schließen</button>
              </CardView>
            </Sheet>
          );
        break;
      }
      case 'market': {
        const c = st.market.find((x) => x.uid === sheet.uid);
        if (c) {
          const cost = buyCost(st, c.id);
          const ok = acting && st.influence >= cost;
          sheetNode = (
            <Sheet onClose={close} title={cardDef(c.id).name}>
              <CardView cardId={c.id}>
                <button type="button" className="btn btn-primary" disabled={!ok} onClick={() => { buy(c.uid); close(); }}>
                  Kaufen für {cost} <Sym kind="influence" size={16} />
                  {cost > cardDef(c.id).cost ? ' (Fluchkrähe +1)' : ''}
                </button>
                {!ok && acting && <p className="hint">Du hast {st.influence} Einfluss.</p>}
                <button type="button" className="btn" onClick={close}>Schließen</button>
              </CardView>
            </Sheet>
          );
        }
        break;
      }
      case 'card':
        sheetNode = (
          <Sheet onClose={close} title={cardDef(sheet.id).name}>
            <CardView cardId={sheet.id}>
              <button type="button" className="btn" onClick={close}>Schließen</button>
            </CardView>
          </Sheet>
        );
        break;
      case 'enemy': {
        const e = findEnemy(sheet.uid);
        if (e) {
          const isBoss = !!st.boss && e.uid === st.boss.uid;
          const canHit = acting && st.attack > 0 && (!isBoss || bossActive(st));
          sheetNode = (
            <Sheet onClose={close} title={enemyDef(e.id).name}>
              <EnemyView enemy={e} isBoss={isBoss}>
                {canHit && (
                  <button type="button" className="btn btn-primary" onClick={() => game.dispatch({ type: 'assignAttack', enemyUid: e.uid, amount: 1 })}>
                    +1 <Sym kind="attack" size={16} /> zuweisen ({st.attack} übrig)
                  </button>
                )}
                {canHit && st.attack >= remaining(e) && (
                  <button type="button" className="btn btn-primary" onClick={() => { game.dispatch({ type: 'assignAttack', enemyUid: e.uid, amount: 'kill' }); close(); }}>
                    Besiegen mit {remaining(e)} <Sym kind="attack" size={16} />
                  </button>
                )}
                <button type="button" className="btn" onClick={close}>Schließen</button>
              </EnemyView>
            </Sheet>
          );
        }
        break;
      }
      case 'summary':
        sheetNode = (
          <Sheet onClose={close} title={sheet.title} align="bottom">
            <ul className="summary">
              {sheet.lines.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
            <button type="button" className="btn btn-primary" onClick={close}>Weiter</button>
          </Sheet>
        );
        break;
      case 'choice': {
        const p = st.pending;
        if (p) {
          const cands = p.kind === 'discard' ? st.hand : [...st.hand, ...st.discard];
          const title = p.kind === 'discard' ? `${p.source}: wirf ${p.count > 1 ? p.count + ' Handkarten' : '1 Handkarte'} ab` : `${p.source}: verbanne 1 Karte`;
          sheetNode = (
            <Sheet title={title} dismissible={false} align="bottom">
              <div data-tut="choiceSheet" className="choice-body">
              <p className="hint">{p.kind === 'discard' ? 'Wähle die Karte, die du abwirfst.' : 'Aus Hand oder Ablage. Die Karte verlässt das Spiel für immer.'}</p>
              <div className="choice-row">
                {cands.map((c) => (
                  <HandCard key={c.uid} cardId={c.id} width={84} uid={c.uid} tut="choice" selected={choicePick === c.uid} onTap={() => { const next = choicePick === c.uid ? null : c.uid; setChoicePick(next); game.emitUi({ type: 'CHOICE_PICKED', uid: next }); }} />
                ))}
              </div>
              <div className="row">
                <button type="button" className="btn btn-primary" disabled={choicePick === null} data-tut="choiceConfirm" onClick={() => { const uid = choicePick; setChoicePick(null); game.dispatch({ type: 'choose', uid }); }}>
                  {p.kind === 'discard' ? 'Abwerfen' : 'Verbannen'}
                </button>
                {p.kind === 'banish' && (
                  <button type="button" className="btn" onClick={() => { setChoicePick(null); game.dispatch({ type: 'choose', uid: null }); }}>
                    Nichts verbannen
                  </button>
                )}
              </div>
              </div>
            </Sheet>
          );
        }
        break;
      }
      case 'pile': {
        const map = { discard: st.discard, deck: st.deck, banished: st.banished, played: st.played };
        const titles = { discard: 'Ablage', deck: 'Nachziehstapel (Reihenfolge unbekannt)', banished: 'Verbannt', played: 'In diesem Zug gespielt' };
        const cards = sheet.which === 'deck' ? sortCards(st.deck) : sheet.which === 'discard' ? st.discard.slice().reverse() : map[sheet.which];
        sheetNode = (
          <Sheet onClose={close} title={`${titles[sheet.which]} · ${cards.length}`} align="bottom">
            <div className="pile-tabs">
              {(['played', 'discard', 'deck', 'banished'] as const).map((w) => (
                <button key={w} type="button" className={`btn btn-small ${sheet.which === w ? 'active' : ''}`} onClick={() => setSheet({ kind: 'pile', which: w })}>
                  {w === 'played' ? 'Gespielt' : w === 'discard' ? 'Ablage' : w === 'deck' ? 'Stapel' : 'Verbannt'} {map[w].length}
                </button>
              ))}
            </div>
            <div className="pile-grid">
              {cards.map((c) => (
                <HandCard key={c.uid} cardId={c.id} width={72} onTap={() => { setSheet({ kind: 'card', id: c.id }); game.emitUi({ type: 'CARD_ZOOMED', uid: c.uid, zone: 'pile' }); }} />
              ))}
              {!cards.length && <p className="hint">Leer.</p>}
            </div>
            <button type="button" className="btn" onClick={close}>Schließen</button>
          </Sheet>
        );
        break;
      }
      case 'omen': {
        const last = st.omenDiscard.slice().reverse();
        sheetNode = (
          <Sheet onClose={close} title={`Omen · ${st.omenPile.length} im Stapel`} align="bottom">
            <p className="hint">Jeden Zug wird {d.omensPerLocation[Math.min(st.location, 2)] === 2 ? 'werden zwei Omen' : 'ein Omen'} aufgedeckt. Ist der Stapel leer, wird neu gemischt und 1 Schatten gelegt.</p>
            <ul className="summary">
              {last.map((o, i) => (
                <li key={i}><strong>{OMEN_BY_ID[o].name}</strong>: {OMEN_BY_ID[o].text}{i === 0 ? ' (zuletzt)' : ''}</li>
              ))}
              {!last.length && <li>Noch kein Omen aufgedeckt.</li>}
            </ul>
            <button type="button" className="btn" onClick={close}>Schließen</button>
          </Sheet>
        );
        break;
      }
      case 'location':
        sheetNode = (
          <Sheet onClose={close} title="Orte" align="bottom">
            <ul className="summary">
              {LOCATIONS.map((l, i) => (
                <li key={l.id} className={i === st.location ? 'current' : i < st.location ? 'fallen' : ''}>
                  <strong>{l.name}</strong>: Platz für {d.capacities[i]} Schatten
                  {i < st.location ? ' · gefallen' : i === st.location ? ` · ${st.shadow} von ${d.capacities[i]}` : ''}
                </li>
              ))}
            </ul>
            <p className="hint">Ist der dritte Ort voll, ist die Partie verloren. Der Altar entfernt für {ALTAR_COST} Einfluss einen Schatten, einmal pro Zug.</p>
            <button type="button" className="btn" onClick={close}>Schließen</button>
          </Sheet>
        );
        break;
      case 'menu':
        sheetNode = (
          <Sheet onClose={close} title="Arkanum" align="bottom">
            <p className="hint">Zug {st.turn} · {d.name} · Leben {st.life} von {st.maxLife} · {st.stuns} Betäubungen</p>
            <button type="button" className="btn" onClick={() => setSheet({ kind: 'grimoire' })}>Grimoire: Karten, Regeln, Symbole</button>
            <button type="button" className="btn" onClick={() => setSheet({ kind: 'chance' })}>Siegchance anzeigen: {chanceView === 'off' ? 'aus' : chanceView === 'trend' ? 'nur Trend' : 'Zahl'}</button>
            <button type="button" className="btn" onClick={() => setSheet({ kind: 'newgame' })}>Partie aufgeben, neu starten</button>
            <button type="button" className="btn" onClick={close}>Weiterspielen</button>
          </Sheet>
        );
        break;
      case 'rules':
        sheetNode = (
          <Sheet onClose={close} title="Regeln in Kürze" align="bottom">
            <RulesList />
            <button type="button" className="btn" onClick={close}>Schließen</button>
          </Sheet>
        );
        break;
      case 'grimoire':
        sheetNode = <Grimoire onClose={close} onReplayTutorial={() => setSheet({ kind: 'newgame', tutorial: true })} />;
        break;
      case 'newgame':
        sheetNode = (
          <Sheet onClose={close} title={sheet.tutorial ? 'Einführung starten?' : 'Partie aufgeben?'} align="bottom">
            <p className="hint">Die laufende Partie geht verloren.</p>
            <button type="button" className="btn btn-danger" onClick={() => { setSheet(null); if (sheet.tutorial) onReplayTutorial(); else onQuit(); }}>
              {sheet.tutorial ? 'Ja, Einführung starten' : 'Ja, aufgeben'}
            </button>
            <button type="button" className="btn" onClick={close}>Zurück</button>
          </Sheet>
        );
        break;
      case 'endwarn':
        sheetNode = (
          <Sheet onClose={close} title="Zug wirklich beenden?" align="bottom">
            <ul className="summary">
              {sheet.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
            <button type="button" className="btn btn-primary" onClick={() => { setSheet(null); game.dispatch({ type: 'endTurn' }); }}>Trotzdem beenden</button>
            <button type="button" className="btn" onClick={close}>Zurück</button>
          </Sheet>
        );
        break;
      case 'chance':
        sheetNode = (
          <Sheet onClose={close} title="Siegchance" align="bottom">
            <ChanceSettings mode={chanceMode} onChange={onChanceMode} lastMs={chanceStatus.lastMs} />
            <button type="button" className="btn" onClick={close}>Schließen</button>
          </Sheet>
        );
        break;
      case 'over':
        sheetNode = (
          <Sheet title={st.result === 'win' ? 'Sieg!' : 'Niederlage'} dismissible={false}>
            <p className="over-text">{st.result === 'win' ? 'Der Namenlose Fürst ist gefallen. Mondfels ist sicher.' : 'Der dritte Ort ist voller Schatten.'}</p>
            <p className="hint">Zug {st.turn} · {d.name} · {st.stuns} Betäubungen · {st.defeated.length} Feinde besiegt</p>
            <ChanceCurve points={game.chance} result={st.result} />
            <button type="button" className="btn btn-primary" onClick={onQuit}>Neue Partie</button>
          </Sheet>
        );
        break;
    }
  }

  const enemiesHit = useMemo(() => new Set(st.active.filter((e) => e.hitTurn === st.turn).map((e) => e.uid)), [st]);
  const step = tutorial.step;
  const sheetOpen = sheet !== null;

  return (
    <div className={`board ${tutorial.locked ? 'tutorial-locked' : ''}`}>
      <header className="zone head">
        <span className="stat" data-tut="life" title={`Leben ${st.life} von ${st.maxLife}`} aria-label={`Leben ${st.life} von ${st.maxLife}`}><Sym kind="life" /> <b>{st.life}</b></span>
        <span className="stat" data-tut="influence" title="Einfluss"><Sym kind="influence" /> <b>{st.phase === 'start' ? st.saved : st.influence}</b></span>
        <span className="stat" data-tut="attack" title="Angriff"><Sym kind="attack" /> <b>{st.attack}</b></span>
        {st.shield > 0 && <span className="stat" title="Schild"><Sym kind="shield" /> <b>{st.shield}</b></span>}
        <span className="spacer" />
        <span data-tut="chance" className="chance-wrap">
          <ChanceBadge points={game.chance} turn={st.turn} mode={chanceView} computing={chanceStatus.computing} onTap={() => setSheet({ kind: 'chance' })} />
        </span>
        {!tutorial.active && <button type="button" className="iconbtn" aria-label="Rückgängig" disabled={!game.canUndo} onClick={game.undo}>↶</button>}
        {tutorial.active ? (
          <button type="button" className="btn btn-small skip" onClick={tutorial.skip}>Überspringen</button>
        ) : (
          <button type="button" className="iconbtn" aria-label="Menü" onClick={() => setSheet({ kind: 'menu' })}>☰</button>
        )}
      </header>

      <section className="zone enemies" aria-label="Feinde">
        {boss ? (
          <EnemyTile enemy={boss} isBoss canAttack={acting && st.attack > 0} onTap={() => tapEnemy(boss)} onLong={() => longEnemy(boss)} hitThisTurn={false} spark={sparks.has(boss.uid)} />
        ) : (
          st.active.map((e) => (
            <EnemyTile key={e.uid} enemy={e} isBoss={false} canAttack={acting && st.attack > 0} onTap={() => tapEnemy(e)} onLong={() => longEnemy(e)} hitThisTurn={enemiesHit.has(e.uid)} spark={sparks.has(e.uid)} />
          ))
        )}
        <span className="queue-note">
          <BackFeind size={9} /> Zug {st.turn} · {st.result === 'win' ? 'der Fürst ist gefallen' : boss ? 'Endgegner' : st.queue.length ? `noch ${st.queue.length} im Feindstapel, dann der Fürst` : 'letzter Feind, dann der Fürst'}
        </span>
      </section>

      <section className="zone market" aria-label="Markt" data-tut="market">
        {st.market.map((c) => {
          const cost = buyCost(st, c.id);
          return <MarketTile key={c.uid} uid={c.uid} cardId={c.id} cost={cost} affordable={acting && st.influence >= cost} onTap={() => openZoom('market', c.uid)} />;
        })}
      </section>

      <section className="zone location">
        <button type="button" className="loc-btn" data-tut="location" onClick={() => setSheet({ kind: 'location' })} aria-label={`Ort ${st.location + 1} von 3, ${LOCATIONS[st.location].name}, ${st.shadow} von ${cap} Schatten`}>
          <span className="loc-name">{st.location + 1}/3 {LOCATIONS[st.location].name}</span>
          <span className="pips" aria-hidden>
            {Array.from({ length: cap }, (_, i) => (
              <span key={i} className={`pip ${i < st.shadow ? 'on' : ''}`}><Sym kind="shadow" size={14} color={i < st.shadow ? 'var(--schatten)' : 'rgba(244,241,232,0.25)'} /></span>
            ))}
          </span>
        </button>
        <button type="button" className="omen-chip" data-tut="omen" onClick={() => setSheet({ kind: 'omen' })} aria-label="Omen">
          <BackOmen size={14} /> {st.omenDiscard.length ? OMEN_BY_ID[st.omenDiscard[st.omenDiscard.length - 1]].name : 'Omen'}
        </button>
        <button type="button" className="pile-chip" data-tut="pile" onClick={() => setSheet({ kind: 'pile', which: 'discard' })} aria-label={`Nachziehstapel ${st.deck.length}, Ablage ${st.discard.length}`}>
          <BackAkademie size={14} /> {st.deck.length} · {st.discard.length}
        </button>
        <button type="button" className="iconbtn iconbtn-small" aria-label="Regeln" onClick={() => setSheet({ kind: 'rules' })}>?</button>
      </section>

      <section className={`zone hand ${scroll ? 'scroll' : ''}`} aria-label="Hand" ref={handRef} data-tut="hand">
        <div className="hand-row" style={{ width: scroll ? cardW + (n - 1) * visible : undefined }}>
          {st.hand.map((c, i) => (
            <div key={c.uid} className="hand-slot" style={{ marginLeft: i === 0 ? 0 : visible - cardW, zIndex: i }}>
              <HandCard cardId={c.id} uid={c.uid} tut="hand" width={cardW} onTap={() => openZoom('hand', c.uid)} dim={!acting} />
            </div>
          ))}
          {!n && <p className="hint hand-empty">Keine Handkarten{st.played.length ? ' – alle gespielt' : ''}.</p>}
        </div>
      </section>

      <footer className="zone actions">
        <button type="button" className="btn btn-main" data-tut="playAll" disabled={!acting || !n} onClick={playAll}>Alle spielen</button>
        <button type="button" className={`btn btn-main altar ${altarOk && altarUrgent ? 'glow' : ''}`} data-tut="altar" disabled={!altarOk} onClick={() => game.dispatch({ type: 'useAltar' })} aria-label={`Altar, ${ALTAR_COST} Einfluss gegen 1 Schatten${st.altarUsed ? ', in diesem Zug schon benutzt' : ''}`}>
          Altar · {ALTAR_COST} <Sym kind="influence" size={14} />
        </button>
        <button type="button" className="btn btn-main btn-primary" data-tut="endTurn" disabled={!acting} onClick={tryEndTurn}>Zug beenden</button>
      </footer>

      {sheetNode}
      {fx.node}

      {step && (
        <CoachMark
          target={step.target}
          text={step.text}
          silent={step.silent}
          dim
          sheetOpen={sheetOpen}
          label={tutorial.lessonLabel}
          onNext={step.done === 'next' ? tutorial.next : undefined}
          onMiss={tutorial.miss}
          showMe={tutorial.fails >= 3}
        />
      )}
      {!step && hints.hint && (
        <CoachMark target={hints.hint.target} text={hints.hint.text} dim={false} sheetOpen={sheetOpen} onClose={hints.close} label="Hinweis" />
      )}
      {tutorial.feedback && <div className="toast" role="status">{tutorial.feedback}</div>}
    </div>
  );
}
