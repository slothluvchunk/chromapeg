import { useGame } from '../context/GameContext';
import { ColorPeg } from './ColorPeg';

export function CurrentGuessRow() {
  const { currentGuess, settings, submitGuess, removeColor, status, lastError } = useGame();

  if (status !== 'in-progress') return null;

  const isFull = currentGuess.length === settings.sequenceLength;

  const errorMessages: Record<string, string> = {
    'wrong-length': 'Fill all slots before submitting.',
    'symbol-not-in-pool': 'One of the colors is not available.',
    'duplicate-not-allowed': 'Duplicates are not allowed in this game.',
    'game-over': 'The game is over.',
  };

  return (
    <div className="current-guess-row">
      <div className="current-guess-row__pegs">
        {Array.from({ length: settings.sequenceLength }, (_, i) => {
          const colorId = currentGuess[i] ?? null;
          return (
            <ColorPeg
              key={i}
              colorId={colorId}
              empty={!colorId}
              onClick={colorId ? () => removeColor(i) : undefined}
              label={colorId ? `Remove color at position ${i + 1}` : `Empty slot ${i + 1}`}
            />
          );
        })}
      </div>

      <button
        className="current-guess-row__submit"
        onClick={submitGuess}
        disabled={!isFull}
        type="button"
      >
        Submit
      </button>

      {lastError && (
        <p className="current-guess-row__error" role="alert">
          {errorMessages[lastError] ?? lastError}
        </p>
      )}
    </div>
  );
}
