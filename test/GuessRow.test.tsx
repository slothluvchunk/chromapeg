import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { Guess, Feedback } from '@slothluvchunk/pegkit';
import { GuessRow } from '../src/components/GuessRow';

// Build a real Guess using PegKit's own classes so type constraints are satisfied.
const positions = [
  { position: 0, symbol: 'blue',   result: 'exact'   as const },
  { position: 1, symbol: 'orange', result: 'present' as const },
  { position: 2, symbol: 'green',  result: 'absent'  as const },
  { position: 3, symbol: 'pink',   result: 'exact'   as const },
];
const feedback = new Feedback(positions);
const mockGuess = new Guess(['blue', 'orange', 'green', 'pink'], feedback);

// Helpers: count feedback elements by visibility state.
// A visible indicator has role="img"; a hidden one has aria-hidden="true".
const visibleCount = () => screen.queryAllByRole('img').length;
const hiddenCount = () =>
  document.querySelectorAll('[aria-hidden="true"].feedback-indicator').length;

// ─── Edge cases ────────────────────────────────────────────────────────────────

describe('GuessRow — edge cases', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('animate=false shows all feedback immediately — no hidden indicators', () => {
    render(<GuessRow guess={mockGuess} sequenceLength={4} animate={false} />);
    expect(visibleCount()).toBe(4);
    expect(hiddenCount()).toBe(0);
  });

  it('animate=true starts with all feedback hidden', () => {
    render(<GuessRow guess={mockGuess} sequenceLength={4} animate={true} />);
    expect(visibleCount()).toBe(0);
    expect(hiddenCount()).toBe(4);
  });

  it('animate=true reveals exactly one indicator after the first interval (150 ms)', () => {
    render(<GuessRow guess={mockGuess} sequenceLength={4} animate={true} />);
    act(() => vi.advanceTimersByTime(150));
    expect(visibleCount()).toBe(1);
    expect(hiddenCount()).toBe(3);
  });

  it('animate=true reveals all indicators after all intervals complete', () => {
    render(<GuessRow guess={mockGuess} sequenceLength={4} animate={true} />);
    // 4 positions × 150 ms = 600 ms for the last reveal
    act(() => vi.advanceTimersByTime(150 * 4));
    expect(visibleCount()).toBe(4);
    expect(hiddenCount()).toBe(0);
  });

  it('each 150 ms tick reveals one additional indicator', () => {
    render(<GuessRow guess={mockGuess} sequenceLength={4} animate={true} />);
    for (let i = 1; i <= 4; i++) {
      act(() => vi.advanceTimersByTime(150));
      expect(visibleCount()).toBe(i);
    }
  });
});

// ─── Common cases ──────────────────────────────────────────────────────────────

describe('GuessRow — common cases', () => {
  it('renders with role="listitem"', () => {
    render(<GuessRow guess={mockGuess} sequenceLength={4} animate={false} />);
    expect(screen.getByRole('listitem')).toBeInTheDocument();
  });

  it('renders one slot per position in sequenceLength', () => {
    render(<GuessRow guess={mockGuess} sequenceLength={4} animate={false} />);
    // Each slot contains a peg (button) and a feedback indicator.
    // There are 4 color pegs — aria-label from PALETTE + 4 feedback indicators.
    expect(screen.getAllByRole('button')).toHaveLength(4);
    expect(visibleCount()).toBe(4);
  });

  it('applies the correct aria-label to each feedback indicator', () => {
    render(<GuessRow guess={mockGuess} sequenceLength={4} animate={false} />);
    // Two positions are 'exact', one 'present', one 'absent'
    expect(screen.getAllByLabelText('correct position')).toHaveLength(2);
    expect(screen.getByLabelText('wrong position')).toBeInTheDocument();
    expect(screen.getByLabelText('not in sequence')).toBeInTheDocument();
  });
});
