import { SecretRow } from './SecretRow';
import { GuessHistory } from './GuessHistory';
import { CurrentGuessRow } from './CurrentGuessRow';
import { ColorPalette } from './ColorPalette';

export function Board() {
  return (
    <main className="board">
      <SecretRow />
      <div className="board__history">
        <CurrentGuessRow />
        <GuessHistory />
      </div>
      <ColorPalette />
    </main>
  );
}
