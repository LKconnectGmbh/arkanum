import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DIFFICULTY } from '../engine/data';
import type { Difficulty } from '../engine/types';
import { Board } from './Board';
import { useSettings } from './settings';
import { loadSave, useGame } from './store';
import { loadTutorialProgress, resetTutorialProgress, TUTORIAL_SETUP, type TutorialProgress } from './useTutorial';
import { BackAkademie, BackFeind, BackOmen } from './backs';

export function App() {
  const save = useMemo(() => loadSave(), []);
  const game = useGame(save);
  const [settings, updateSettings] = useSettings();
  const [progress, setProgress] = useState<TutorialProgress>(() => loadTutorialProgress());
  const autoStarted = useRef(false);

  const startTutorial = useCallback(() => {
    const p = resetTutorialProgress();
    setProgress(p);
    game.start('leicht', 1, TUTORIAL_SETUP);
  }, [game]);

  // Erster Start: keine Frage, die Einführung beginnt direkt. „Überspringen“ ist immer sichtbar.
  const firstStart = !game.state && !progress.done && !autoStarted.current;
  useEffect(() => {
    if (firstStart) {
      autoStarted.current = true;
      startTutorial();
    }
  }, [firstStart, startTutorial]);

  if (firstStart) return null;
  if (!game.state) return <StartScreen onStart={(d) => game.start(d)} onTutorial={startTutorial} />;
  const tutorialGame = !!game.state.tutorial;
  return (
    <Board
      key={game.state.seed + ':' + String(game.state.tutorial)}
      game={game}
      onQuit={game.abandon}
      onReplayTutorial={startTutorial}
      chanceMode={settings.chanceMode}
      onChanceMode={(m) => updateSettings({ chanceMode: m })}
      tutorialEnabled={tutorialGame && !progress.done}
      tutorialProgress={progress}
    />
  );
}

function StartScreen({ onStart, onTutorial }: { onStart: (d: Difficulty) => void; onTutorial: () => void }) {
  return (
    <main className="start">
      <div className="start-inner">
        <div className="start-backs" aria-hidden>
          <BackFeind size={44} />
          <BackAkademie size={56} />
          <BackOmen size={44} />
        </div>
        <p className="start-kicker">Die Wächter von Mondfels</p>
        <h1 className="start-title">Arkanum</h1>
        <p className="start-text">Ein Deck, sechs Feinde, drei Orte. Besiege den Namenlosen Fürsten, bevor der dritte Ort voller Schatten ist.</p>
        <div className="start-buttons">
          {(Object.keys(DIFFICULTY) as Difficulty[]).map((d) => (
            <button key={d} type="button" className="btn btn-primary btn-big" onClick={() => onStart(d)}>
              {DIFFICULTY[d].name}
              <small>{d === 'leicht' ? '12 Leben, Fürst 13' : d === 'normal' ? '10 Leben, Fürst 16' : 'Feinde +1, Orte 4/4/5'}</small>
            </button>
          ))}
          <button type="button" className="btn btn-big" onClick={onTutorial}>
            Einführung
            <small>sechs Züge, drei Lektionen, jederzeit überspringbar</small>
          </button>
        </div>
        <p className="start-foot">Freies Spiel · Prototyp</p>
      </div>
    </main>
  );
}
