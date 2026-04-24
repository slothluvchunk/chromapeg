import { useState } from 'react';
import { useGame } from '../context/GameContext';
import { SettingsModal } from './SettingsModal';

export function Header() {
  const { guesses, newGame, status } = useGame();
  const [showSettings, setShowSettings] = useState(false);

  const guessCount = guesses.length;
  const maxGuesses = 10;

  function handleNewGame() {
    if (status === 'in-progress' && guessCount > 0) {
      if (!confirm('Start a new game? Your current progress will be lost.')) return;
    }
    newGame();
  }

  return (
    <>
      <header className="header">
        <div className="header__brand">
          <h1 className="header__title">ChromaPeg</h1>
          <p className="header__subtitle">a color logic game</p>
        </div>
        <div className="header__meta">
          <span className="header__counter">
            Guess {guessCount} of {maxGuesses}
          </span>
          <button
            className="header__btn header__btn--new"
            onClick={handleNewGame}
            type="button"
            aria-label="New game"
          >
            New
          </button>
          <button
            className="header__btn header__btn--settings"
            onClick={() => setShowSettings(true)}
            type="button"
            aria-label="Settings"
          >
            ⚙
          </button>
        </div>
      </header>
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
    </>
  );
}
