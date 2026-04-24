import { useEffect, useState } from 'react';
import type { Guess } from '@slothluvchunk/pegkit';
import { ColorPeg } from './ColorPeg';
import { FeedbackIndicator } from './FeedbackIndicator';

interface GuessRowProps {
  guess: Guess;
  sequenceLength: number;
  animate?: boolean;
}

export function GuessRow({ guess, sequenceLength, animate = true }: GuessRowProps) {
  // revealIndex drives the staggered animation — feedback appears position by position.
  // We start at -1 (nothing revealed) and increment until all positions are shown.
  const [revealIndex, setRevealIndex] = useState(animate ? -1 : sequenceLength - 1);

  useEffect(() => {
    if (!animate) return;
    setRevealIndex(-1);
    let idx = 0;
    const interval = setInterval(() => {
      setRevealIndex(idx);
      idx++;
      if (idx >= sequenceLength) clearInterval(interval);
    }, 150);
    return () => clearInterval(interval);
  }, [animate, sequenceLength, guess]);

  return (
    <div className="guess-row" role="listitem">
      <div className="guess-row__pegs">
        {Array.from({ length: sequenceLength }, (_, i) => (
          <div key={i} className="guess-row__slot">
            <ColorPeg colorId={guess.symbols[i] ?? null} size="md" />
            <FeedbackIndicator
              result={guess.feedback.positions[i]?.result ?? 'absent'}
              visible={i <= revealIndex}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
