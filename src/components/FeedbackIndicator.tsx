import type { PositionResult } from '@slothluvchunk/pegkit';

interface FeedbackIndicatorProps {
  result: PositionResult;
  visible: boolean;
}

const LABELS: Record<PositionResult, string> = {
  exact: 'correct position',
  present: 'wrong position',
  absent: 'not in sequence',
};

export function FeedbackIndicator({ result, visible }: FeedbackIndicatorProps) {
  if (!visible) {
    return <span className="feedback-indicator feedback-indicator--hidden" aria-hidden="true" />;
  }

  return (
    <span
      className={`feedback-indicator feedback-indicator--${result}`}
      aria-label={LABELS[result]}
      role="img"
    />
  );
}
