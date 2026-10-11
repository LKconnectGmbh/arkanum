import { useMemo } from 'react';
import { DIFFICULTY } from '../engine/data';
import type { Difficulty } from '../engine/types';
import { Board } from './Board';
import { loadSave, useGame } from './store';

export function App() {
  const save = useMemo(() => loadSave(), []);
  const game = useGame(save);

  if (!game.state) return <StartScreen onStart={(d) => game.start(d)} />;
  return <Board game={game} onQuit={game.abandon} />;
}

function StartScreen({ onStart }: { onStart: (d: Difficulty) => void }) {
  return (
    <main className="start">
      <div className="start-inner">
        <p className="start-kicker">Die Wächter von Mondfels</p>
        <h1 className="start-title">Arkanum</h1>
        <p className="start-text">Ein Deck, sechs Feinde, drei Orte. Besiege den Namenlosen Fürsten, bevor der dritte Ort voller Schatten ist.</p>
        <div className="start-buttons">
          {(Object.keys(DIFFICULTY) as Difficulty[]).map((d) => (
            <button key={d} type="button" className="btn btn-primary btn-big" onClick={() => onStart(d)}>
              {DIFFICULTY[d].name}
              <small>
                {d === 'leicht' ? '12 Leben, Fürst 13' : d === 'normal' ? '10 Leben, Fürst 16' : 'Feinde +1, Orte 4/4/5'}
              </small>
            </button>
          ))}
        </div>
        <p className="start-foot">Freies Spiel · Prototyp</p>
      </div>
    </main>
  );
}
