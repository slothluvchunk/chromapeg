import { useGame } from '../context/GameContext';
import { PaletteSwatch } from './ColorPeg';

export function ColorPalette() {
  const { activePool, addColor, currentGuess, settings, status } = useGame();
  const isFull = currentGuess.length >= settings.sequenceLength;
  const disabled = isFull || status !== 'in-progress';

  const cols = activePool.length <= 6 ? 3 : 4;

  return (
    <div className={`color-palette color-palette--cols-${cols}`} aria-label="Color palette">
      {activePool.map((color) => (
        <PaletteSwatch
          key={color.id}
          color={color}
          onClick={disabled ? () => {} : () => addColor(color.id)}
        />
      ))}
    </div>
  );
}
