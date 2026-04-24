import { useGame } from '../context/GameContext';
import { GuessRow } from './GuessRow';

export function GuessHistory() {
  const { guesses, settings } = useGame();

  if (guesses.length === 0) return null;

  return (
    <div className="guess-history" role="list" aria-label="Submitted guesses">
      {[...guesses].reverse().map((guess, i) => (
        <GuessRow
          key={guess.submittedAt}
          guess={guess}
          sequenceLength={settings.sequenceLength}
          animate={i === 0}
        />
      ))}
    </div>
  );
}
