import { useGame } from '../context/GameContext';
import { ColorPeg } from './ColorPeg';

export function GameOverModal() {
  const { status, guesses, revealedSecret, newGame } = useGame();

  if (status === 'in-progress') return null;

  const won = status === 'won';

  return (
    <div className="modal__overlay" role="dialog" aria-modal="true" aria-label="Game over">
      <div className="modal">
        <div className="modal__header">
          <h2 className="modal__title">{won ? 'You cracked it!' : 'Better luck next time'}</h2>
        </div>

        <div className="modal__body">
          <p className="modal__message">
            {won
              ? `Solved in ${guesses.length} ${guesses.length === 1 ? 'guess' : 'guesses'}!`
              : 'You ran out of guesses. The secret was:'}
          </p>

          {revealedSecret && (
            <div className="modal__secret">
              {revealedSecret.map((colorId, i) => (
                <ColorPeg key={i} colorId={colorId} />
              ))}
            </div>
          )}
        </div>

        <button
          className="modal__play-again"
          onClick={() => newGame()}
          type="button"
        >
          Play Again
        </button>
      </div>
    </div>
  );
}
