# ChromaPeg

A mobile-first color-sequence guessing game — Bulls & Cows with colors instead of numbers. Built as the reference consumer implementation of [PegKit](https://www.npmjs.com/package/@slothluvchunk/pegkit), an open-source TypeScript engine for guess-and-feedback logic games.

## Playing the game

Tap colors from the palette to fill your guess slots, then tap **Submit**. After each guess, feedback dots appear below each peg:

| Dot       | Meaning 
|-----------|---------
| Green (●) | Right color, right position 
| Amber (●) | Right color, wrong position 
| Gray  (●) | Color is not in the secret 

Guess the full sequence within 10 attempts to win.

## Running locally

**Prerequisites:** Node 18+ and npm. Check with `node --version`. If you manage versions with nvm, run `nvm use 22` (or whichever version ≥ 18 you have installed) before the steps below.

```bash
npm install
npm run dev
```

The dev server starts on http://localhost:5173 (or the next available port).

## Settings

Open the gear icon (⚙) to change:

- **Sequence length** — 4, 5, or 6 colors to guess
- **Number of colors** — 6 or 8 active colors from the palette
- **Allow duplicates** — whether the same color can appear more than once in the secret

Changing any setting starts a new game immediately.

---

## Architecture: how ChromaPeg uses PegKit

ChromaPeg contains **no game logic of its own**. Every rule — comparison, validation, duplicate detection, win/loss detection — is delegated entirely to PegKit. The UI layer is a thin React wrapper that translates PegKit's objects and events into rendered state.

### The boundary

```
ColorPalette / CurrentGuessRow          ← user taps colors
        ↓
   GameProvider (React context)         ← bridge layer
        ↓
   GameSession.submitGuess()            ← PegKit evaluates the guess
        ↓
   PegKit events                        ← fire back into React
        ↓
   GuessHistory / GuessRow              ← render Feedback objects
```

### GameProvider: the bridge

`src/context/GameContext.tsx` is the only file that imports PegKit at runtime. `GuessRow.tsx` and `FeedbackIndicator.tsx` import PegKit types only (erased at compile time). Everything else in the UI receives pre-digested React state.

**Why the session lives in a ref, not state:**

```tsx
const sessionRef = useRef<GameSession | null>(null);
```

`GameSession` is a mutable object that PegKit manages internally — it accumulates guesses, changes status, fires events. Storing it in `useState` would mean React re-renders every time you call any method on it, even if nothing the UI cares about changed. The ref holds the live session; `useState` tracks only the derived values that actually drive rendering (`guesses`, `status`, `remainingGuesses`).

### Building a session

```tsx
function buildSession(settings: GameSettings, pool: ColorDef[]): GameSession {
  const config = new GameConfig({
    sequenceLength: settings.sequenceLength,
    maxGuesses: 10,
    allowDuplicates: settings.allowDuplicates,
    symbolPool: pool.map((c) => c.id),   // string[] of PegKit symbol IDs
  });

  // SecretSequence validates that symbols are in the pool and respect allowDuplicates
  const secretSymbols = generateSecret(pool, settings.sequenceLength, settings.allowDuplicates);
  const secret = new SecretSequence(secretSymbols, config);

  return new GameSession(config, secret);
}
```

`GameConfig` requires `symbolPool` to be a plain `string[]` — it must contain no duplicates and, when `allowDuplicates` is false, must have at least `sequenceLength` entries. Validation errors throw synchronously in the constructor.

`SecretSequence` also validates on construction: the symbols must be the right length, all in the pool, and (when `allowDuplicates` is false) contain no repeats.

### Submitting a guess

`session.submitGuess()` returns a union type:

```ts
type Result = Guess | InvalidGuessReason

type InvalidGuessReason =
  | 'wrong-length'
  | 'symbol-not-in-pool'
  | 'duplicate-not-allowed'
  | 'validation-failed'
  | 'game-over'
```

ChromaPeg doesn't inspect the return value directly — it relies on PegKit's event system instead, which fires for both success and failure. The call in `GameProvider` is deliberately fire-and-forget:

```tsx
const submitGuess = useCallback(() => {
  const session = sessionRef.current;
  if (!session) return;
  // Return value intentionally ignored — event listeners handle all state updates
  session.submitGuess(currentGuess);
}, [currentGuess]);
```

### Subscribing to events

PegKit's `session.on()` returns an unsubscribe function. ChromaPeg stores all unsubscribes in a ref and calls them before attaching new listeners (on new game) and on unmount:

```tsx
const unsubsRef = useRef<Array<() => void>>([]);

// Inside attachListeners():
unsubsRef.current.forEach((u) => u());   // clean up previous session's listeners
unsubsRef.current = [
  session.on('guess-submitted', () => {
    syncFromSession();
    setCurrentGuess([]);
    setLastError(null);
  }),
  session.on('game-won', (e) => {
    syncFromSession();
    // game-won doesn't include the secret in its payload, but the winning
    // guess IS the secret (all positions exact), so we extract it from there.
    setRevealedSecret(e.guesses[e.guessCount - 1].symbols);
  }),
  session.on('game-lost', (e) => {
    syncFromSession();
    setRevealedSecret(e.secret);   // game-lost does expose the secret
  }),
  session.on('invalid-guess', (e) => {
    setLastError(e.reason);
  }),
];
```

#### Event payloads (from PegKit source)

| Event             | Payload 
|-------------------|---------
| `guess-submitted` | `{ guess: Guess, guessNumber: number }` 
| `game-won`        | `{ guesses: readonly Guess[], guessCount: number }` 
| `game-lost`       | `{ guesses: readonly Guess[], secret: readonly string[] }` 
| `invalid-guess`   | `{ symbols: readonly string[], reason: InvalidGuessReason }` 

Note that `game-won` does **not** include the secret — only `game-lost` does. This is intentional in PegKit: the secret is only revealed on loss. ChromaPeg works around this by reconstructing the secret from the winning guess.

### Reading Feedback

After a successful guess, `guess.feedback` is a `Feedback` object:

```ts
guess.feedback.positions      // readonly PositionFeedback[]
guess.feedback.exactCount     // number of green (correct position) results
guess.feedback.presentCount   // number of amber (wrong position) results
guess.feedback.absentCount    // number of gray (not in sequence) results
guess.feedback.isAllExact()   // true only when the guess is the secret
```

Each `PositionFeedback` has:

```ts
{
  position: number          // 0-based index
  symbol: string            // the guessed color ID at this position
  result: 'exact' | 'present' | 'absent'
}
```

`FeedbackIndicator.tsx` maps `result` directly to a CSS modifier class:

```tsx
<span className={`feedback-indicator feedback-indicator--${result}`} />
```

### Session state properties

| Property                   | Type                               | Description 
|----------------------------|------------------------------------|-------------
| `session.status`           | `'in-progress' \| 'won' \| 'lost'` | Current game state 
| `session.guesses`          | `readonly Guess[]`                 | All submitted guesses so far 
| `session.guessCount`       | `number`                           | `guesses.length` 
| `session.remainingGuesses` | `number`                           | `maxGuesses - guessCount` 
| `session.config`            | `GameConfig`                        | The config the session was created with 

---

## Color system

Colors are defined in `src/colors.ts` as `ColorDef` objects. The `id` field is the PegKit symbol string passed to `symbolPool` and used in every guess array.

```ts
interface ColorDef {
  id: string;        // PegKit symbol: 'blue', 'orange', etc.
  hex: string;       // CSS color for rendering
  label: string;     // Human-readable name (also used as aria-label)
  icon: string;      // Shape rendered inside the peg for accessibility
  textColor: string; // Contrast-safe color for the icon
}
```

The 8-color palette uses the [Wong (2011)](https://www.nature.com/articles/nmeth.1618) CVD-safe palette, ordered so adjacent colors have maximum perceptual distance. Every color has a distinct icon shape so color is never the sole differentiator (protanopia / deuteranopia / tritanopia support).

| ID       | Color  | Icon | Hex  
|----------|--------|------|----------
| `blue`   | Blue   | ◆    | `#0072B2` 
| `orange` | Orange | ★    | `#E69F00` 
| `green`  | Green  | ●    | `#009E73` 
| `pink`   | Pink   | ♥    | `#CC79A7` 
| `sky`    | Sky    | ▲    | `#56B4E9` 
| `red`    | Red    | ■    | `#D55E00` 
| `yellow` | Yellow | ♦    | `#F0E442` 
| `purple` | Purple | ✦    | `#7B2D8B` 

---

## File structure

```
src/
├── main.tsx                     React entry point
├── App.tsx                      Root: imports GameProvider + all top-level components
├── colors.ts                    ColorDef palette + generateSecret()
├── context/
│   └── GameContext.tsx          GameProvider + useGame hook (the only PegKit import boundary)
├── components/
│   ├── Header.tsx               Guess counter, New Game button, Settings trigger
│   ├── Board.tsx                SecretRow + history scroll area + CurrentGuessRow
│   ├── SecretRow.tsx            Hidden ?-slots; revealed on win or loss
│   ├── GuessHistory.tsx         Stack of submitted GuessRows (most recent first)
│   ├── GuessRow.tsx             One submitted row: pegs + staggered feedback reveal
│   ├── CurrentGuessRow.tsx      Active row being built; Submit button
│   ├── ColorPalette.tsx         Tappable color swatches at the bottom
│   ├── ColorPeg.tsx             Single colored circle with accessibility icon
│   ├── FeedbackIndicator.tsx    Single feedback dot (exact / present / absent)
│   ├── SettingsModal.tsx        Sequence length, color count, duplicates toggle
│   └── GameOverModal.tsx        Win/loss message + secret reveal + Play Again
└── styles/
    ├── reset.css
    ├── variables.css            CSS custom properties (colors, sizes, spacing)
    ├── app.css                  Body + root layout
    └── components/              One file per component, BEM naming
        ├── header.css
        ├── peg.css
        ├── feedback.css
        ├── guess-row.css
        ├── board.css
        ├── palette.css
        └── modal.css
```

---

## What ChromaPeg does NOT implement

By design, ChromaPeg contains no reimplementation of:

- Guess comparison logic (exact / present / absent)
- Duplicate detection in submitted guesses
- Win / loss detection
- Guess count tracking
- Symbol pool validation

All of this is PegKit's domain. If you find yourself writing comparison or validation logic in the UI layer, it belongs in PegKit instead.
