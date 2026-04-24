import { useGame } from '../context/GameContext';
import { ColorPeg } from './ColorPeg';

export function SecretRow() {
  const { status, revealedSecret, settings } = useGame();
  const revealed = status !== 'in-progress' && revealedSecret !== null;

  return (
    <div className="secret-row" aria-label={revealed ? 'Secret sequence revealed' : 'Secret sequence hidden'}>
      {Array.from({ length: settings.sequenceLength }, (_, i) => {
        const colorId = revealed ? (revealedSecret?.[i] ?? null) : null;
        return (
          <div key={i} className="secret-row__slot">
            {revealed ? (
              <ColorPeg colorId={colorId} />
            ) : (
              <span className="secret-row__hidden" aria-hidden="true">?</span>
            )}
          </div>
        );
      })}
    </div>
  );
}
