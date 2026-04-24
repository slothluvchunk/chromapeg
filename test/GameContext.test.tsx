import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameProvider, useGame } from '../src/context/GameContext';

// Fix the secret to ['blue', 'orange', 'green', 'pink'] for all tests.
// GameContext.tsx imports generateSecret from '../colors' which resolves to
// the same canonical path as our mock target, so it will be intercepted.
// Mock generateSecret so the secret is always the first `length` colors from a
// fixed list, making win/loss conditions in tests fully deterministic.
// The secret for the default sequenceLength=4 is ['blue', 'orange', 'green', 'pink'].
const FIXED_COLORS = ['blue', 'orange', 'green', 'pink', 'sky', 'red'];

vi.mock('../src/colors', async () => {
  const actual = await vi.importActual<typeof import('../src/colors')>('../src/colors');
  return {
    ...actual,
    generateSecret: vi.fn((_pool: unknown, length: number) => FIXED_COLORS.slice(0, length)),
  };
});

// ─── Test harness ──────────────────────────────────────────────────────────────

function GameHarness() {
  const {
    currentGuess, guesses, status, remainingGuesses, lastError,
    revealedSecret, settings, activePool,
    addColor, removeColor, clearCurrentGuess, submitGuess, newGame, updateSettings,
  } = useGame();

  return (
    <div>
      <span data-testid="status">{status}</span>
      <span data-testid="remaining">{remainingGuesses}</span>
      <span data-testid="guess-count">{guesses.length}</span>
      <span data-testid="current-guess">{currentGuess.join(',')}</span>
      <span data-testid="last-error">{lastError ?? ''}</span>
      <span data-testid="revealed-secret">{revealedSecret?.join(',') ?? ''}</span>
      <span data-testid="pool-size">{activePool.length}</span>
      <span data-testid="seq-length">{settings.sequenceLength}</span>

      <button onClick={() => addColor('blue')}>add-blue</button>
      <button onClick={() => addColor('orange')}>add-orange</button>
      <button onClick={() => addColor('green')}>add-green</button>
      <button onClick={() => addColor('pink')}>add-pink</button>
      <button onClick={() => addColor('sky')}>add-sky</button>
      <button onClick={() => removeColor(0)}>remove-0</button>
      <button onClick={clearCurrentGuess}>clear</button>
      <button onClick={submitGuess}>submit</button>
      <button onClick={() => newGame()}>new-game</button>
      <button onClick={() => updateSettings({ sequenceLength: 5 })}>set-len-5</button>
      <button onClick={() => updateSettings({ allowDuplicates: false })}>no-dups</button>
    </div>
  );
}

function renderGame() {
  const user = userEvent.setup();
  render(
    <GameProvider>
      <GameHarness />
    </GameProvider>,
  );
  return { user };
}

// Helpers
const click = (user: ReturnType<typeof userEvent.setup>, label: string) =>
  user.click(screen.getByText(label));

// ─── Edge cases ────────────────────────────────────────────────────────────────

describe('GameContext — edge cases', () => {
  beforeEach(() => vi.clearAllMocks());

  it('addColor past the sequence length is silently ignored', async () => {
    const { user } = renderGame();
    // Fill all 4 slots
    await click(user, 'add-blue');
    await click(user, 'add-blue');
    await click(user, 'add-blue');
    await click(user, 'add-blue');
    // 5th add — should be a no-op
    await click(user, 'add-blue');
    expect(screen.getByTestId('current-guess').textContent).toBe('blue,blue,blue,blue');
  });

  it('submitting an empty guess sets lastError to wrong-length', async () => {
    const { user } = renderGame();
    await click(user, 'submit');
    await waitFor(() =>
      expect(screen.getByTestId('last-error').textContent).toBe('wrong-length'),
    );
  });

  it('submitting a partial guess sets lastError to wrong-length', async () => {
    const { user } = renderGame();
    await click(user, 'add-blue');
    await click(user, 'add-orange');
    await click(user, 'submit');
    await waitFor(() =>
      expect(screen.getByTestId('last-error').textContent).toBe('wrong-length'),
    );
  });

  it('submitting a duplicate when duplicates are not allowed sets lastError', async () => {
    const { user } = renderGame();
    await click(user, 'no-dups');
    // All same color → duplicate-not-allowed
    await click(user, 'add-blue');
    await click(user, 'add-blue');
    await click(user, 'add-blue');
    await click(user, 'add-blue');
    await click(user, 'submit');
    await waitFor(() =>
      expect(screen.getByTestId('last-error').textContent).toBe('duplicate-not-allowed'),
    );
  });

  it('submitting after the game is over sets lastError to game-over', async () => {
    const { user } = renderGame();
    // Submit the winning guess (secret = blue, orange, green, pink)
    await click(user, 'add-blue');
    await click(user, 'add-orange');
    await click(user, 'add-green');
    await click(user, 'add-pink');
    await click(user, 'submit');
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('won'));

    // Now try to submit anything again
    await click(user, 'add-blue');
    await click(user, 'add-blue');
    await click(user, 'add-blue');
    await click(user, 'add-blue');
    await click(user, 'submit');
    await waitFor(() =>
      expect(screen.getByTestId('last-error').textContent).toBe('game-over'),
    );
  });

  it('removeColor on an empty currentGuess does not crash', async () => {
    const { user } = renderGame();
    expect(screen.getByTestId('current-guess').textContent).toBe('');
    await click(user, 'remove-0');
    expect(screen.getByTestId('current-guess').textContent).toBe('');
  });
});

// ─── Common cases ──────────────────────────────────────────────────────────────

describe('GameContext — common cases', () => {
  beforeEach(() => vi.clearAllMocks());

  it('starts with the correct initial state', () => {
    renderGame();
    expect(screen.getByTestId('status').textContent).toBe('in-progress');
    expect(screen.getByTestId('remaining').textContent).toBe('10');
    expect(screen.getByTestId('guess-count').textContent).toBe('0');
    expect(screen.getByTestId('current-guess').textContent).toBe('');
    expect(screen.getByTestId('last-error').textContent).toBe('');
    expect(screen.getByTestId('revealed-secret').textContent).toBe('');
  });

  it('addColor appends to currentGuess', async () => {
    const { user } = renderGame();
    await click(user, 'add-blue');
    expect(screen.getByTestId('current-guess').textContent).toBe('blue');
    await click(user, 'add-orange');
    expect(screen.getByTestId('current-guess').textContent).toBe('blue,orange');
  });

  it('removeColor removes at the given index', async () => {
    const { user } = renderGame();
    await click(user, 'add-blue');
    await click(user, 'add-orange');
    await click(user, 'remove-0'); // removes 'blue' at index 0
    expect(screen.getByTestId('current-guess').textContent).toBe('orange');
  });

  it('clearCurrentGuess empties the current guess', async () => {
    const { user } = renderGame();
    await click(user, 'add-blue');
    await click(user, 'add-orange');
    await click(user, 'clear');
    expect(screen.getByTestId('current-guess').textContent).toBe('');
  });

  it('a valid submitGuess increments guesses and clears currentGuess', async () => {
    const { user } = renderGame();
    // Submit an incorrect guess (won't win, but it's valid)
    await click(user, 'add-sky');
    await click(user, 'add-sky');
    await click(user, 'add-sky');
    await click(user, 'add-sky');
    await click(user, 'submit');
    await waitFor(() =>
      expect(screen.getByTestId('guess-count').textContent).toBe('1'),
    );
    expect(screen.getByTestId('current-guess').textContent).toBe('');
  });

  it('a valid submitGuess decrements remainingGuesses', async () => {
    const { user } = renderGame();
    await click(user, 'add-sky');
    await click(user, 'add-sky');
    await click(user, 'add-sky');
    await click(user, 'add-sky');
    await click(user, 'submit');
    await waitFor(() =>
      expect(screen.getByTestId('remaining').textContent).toBe('9'),
    );
  });

  it('the winning guess transitions status to won and reveals the secret', async () => {
    const { user } = renderGame();
    await click(user, 'add-blue');
    await click(user, 'add-orange');
    await click(user, 'add-green');
    await click(user, 'add-pink');
    await click(user, 'submit');
    await waitFor(() => expect(screen.getByTestId('status').textContent).toBe('won'));
    expect(screen.getByTestId('revealed-secret').textContent).toBe('blue,orange,green,pink');
  });

  it('newGame resets all state', async () => {
    const { user } = renderGame();
    // Make a guess
    await click(user, 'add-sky');
    await click(user, 'add-sky');
    await click(user, 'add-sky');
    await click(user, 'add-sky');
    await click(user, 'submit');
    await waitFor(() =>
      expect(screen.getByTestId('guess-count').textContent).toBe('1'),
    );
    await click(user, 'new-game');
    await waitFor(() => {
      expect(screen.getByTestId('guess-count').textContent).toBe('0');
      expect(screen.getByTestId('remaining').textContent).toBe('10');
      expect(screen.getByTestId('status').textContent).toBe('in-progress');
      expect(screen.getByTestId('revealed-secret').textContent).toBe('');
    });
  });

  it('updateSettings changes the sequence length and starts a fresh game', async () => {
    const { user } = renderGame();
    await click(user, 'set-len-5');
    await waitFor(() => {
      expect(screen.getByTestId('seq-length').textContent).toBe('5');
      expect(screen.getByTestId('guess-count').textContent).toBe('0');
    });
  });

  it('activePool size matches the colorCount setting', () => {
    renderGame(); // default colorCount = 8
    expect(screen.getByTestId('pool-size').textContent).toBe('8');
  });
});
