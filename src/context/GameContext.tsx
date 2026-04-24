import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useCallback,
  useEffect,
} from 'react';
import { GameConfig, GameSession, SecretSequence } from '@slothluvchunk/pegkit';
import type { Guess, InvalidGuessReason } from '@slothluvchunk/pegkit';
import { PALETTE, generateSecret, type ColorDef } from '../colors';

// --- Types ---

export interface GameSettings {
  sequenceLength: number;
  colorCount: number;
  allowDuplicates: boolean;
}

interface GameState {
  guesses: readonly Guess[];
  status: 'in-progress' | 'won' | 'lost';
  remainingGuesses: number;
  currentGuess: string[];
  settings: GameSettings;
  activePool: ColorDef[];
  lastError: InvalidGuessReason | null;
  revealedSecret: readonly string[] | null;
}

interface GameActions {
  addColor: (colorId: string) => void;
  removeColor: (position: number) => void;
  clearCurrentGuess: () => void;
  submitGuess: () => void;
  newGame: (confirmIfActive?: boolean) => void;
  updateSettings: (s: Partial<GameSettings>) => void;
}

type GameContextValue = GameState & GameActions;

// --- Context ---

const GameContext = createContext<GameContextValue | null>(null);

export function useGame(): GameContextValue {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}

// --- Helpers ---

const DEFAULT_SETTINGS: GameSettings = {
  sequenceLength: 4,
  colorCount: 8,
  allowDuplicates: true,
};

function buildSession(settings: GameSettings, pool: ColorDef[]): GameSession {
  const config = new GameConfig({
    sequenceLength: settings.sequenceLength,
    maxGuesses: 10,
    allowDuplicates: settings.allowDuplicates,
    symbolPool: pool.map((c) => c.id),
  });
  const secretSymbols = generateSecret(pool, settings.sequenceLength, settings.allowDuplicates);
  const secret = new SecretSequence(secretSymbols, config);
  return new GameSession(config, secret);
}

// --- Provider ---

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [guesses, setGuesses] = useState<readonly Guess[]>([]);
  const [status, setStatus] = useState<'in-progress' | 'won' | 'lost'>('in-progress');
  const [remainingGuesses, setRemainingGuesses] = useState(10);
  const [currentGuess, setCurrentGuess] = useState<string[]>([]);
  const [lastError, setLastError] = useState<InvalidGuessReason | null>(null);
  const [revealedSecret, setRevealedSecret] = useState<readonly string[] | null>(null);

  // Session lives in a ref — it's mutable and shouldn't drive re-renders directly.
  // React state tracks the derived values we actually render.
  const sessionRef = useRef<GameSession | null>(null);
  const unsubsRef = useRef<Array<() => void>>([]);

  const activePool = PALETTE.slice(0, settings.colorCount);

  const syncFromSession = useCallback(() => {
    const s = sessionRef.current;
    if (!s) return;
    setGuesses(s.guesses);
    setStatus(s.status);
    setRemainingGuesses(s.remainingGuesses);
  }, []);

  const attachListeners = useCallback(
    (session: GameSession) => {
      // Clean up any previous subscriptions before attaching new ones
      unsubsRef.current.forEach((u) => u());
      unsubsRef.current = [
        session.on('guess-submitted', () => {
          syncFromSession();
          setCurrentGuess([]);
          setLastError(null);
        }),
        session.on('game-won', (e) => {
          syncFromSession();
          // game-won doesn't include the secret, but the winning guess IS the secret
          // (every position is exact by definition), so we can read it from there.
          setRevealedSecret(e.guesses[e.guessCount - 1].symbols);
        }),
        session.on('game-lost', (e) => {
          syncFromSession();
          setRevealedSecret(e.secret);
        }),
        session.on('invalid-guess', (e) => {
          setLastError(e.reason);
        }),
      ];
    },
    [syncFromSession],
  );

  const startNewGame = useCallback(
    (overrideSettings?: GameSettings) => {
      const s = overrideSettings ?? settings;
      const pool = PALETTE.slice(0, s.colorCount);
      const session = buildSession(s, pool);
      sessionRef.current = session;
      attachListeners(session);
      setGuesses([]);
      setStatus('in-progress');
      setRemainingGuesses(session.remainingGuesses);
      setCurrentGuess([]);
      setLastError(null);
      setRevealedSecret(null);
    },
    [settings, attachListeners],
  );

  // Boot the first session on mount
  useEffect(() => {
    startNewGame();
    return () => {
      unsubsRef.current.forEach((u) => u());
    };
    // Intentionally omit startNewGame — we only want this on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addColor = useCallback(
    (colorId: string) => {
      setLastError(null);
      setCurrentGuess((prev) => {
        if (prev.length >= settings.sequenceLength) return prev;
        return [...prev, colorId];
      });
    },
    [settings.sequenceLength],
  );

  const removeColor = useCallback((position: number) => {
    setCurrentGuess((prev) => prev.filter((_, i) => i !== position));
  }, []);

  const clearCurrentGuess = useCallback(() => setCurrentGuess([]), []);

  const submitGuess = useCallback(() => {
    const session = sessionRef.current;
    if (!session) return;
    // submitGuess returns Guess | InvalidGuessReason (a string union)
    // The event listeners handle state updates — we only need to fire it here.
    session.submitGuess(currentGuess);
  }, [currentGuess]);

  const newGame = useCallback(
    (_confirmIfActive?: boolean) => {
      startNewGame();
    },
    [startNewGame],
  );

  const updateSettings = useCallback(
    (partial: Partial<GameSettings>) => {
      const next = { ...settings, ...partial };
      setSettings(next);
      startNewGame(next);
    },
    [settings, startNewGame],
  );

  const value: GameContextValue = {
    guesses,
    status,
    remainingGuesses,
    currentGuess,
    settings,
    activePool,
    lastError,
    revealedSecret,
    addColor,
    removeColor,
    clearCurrentGuess,
    submitGuess,
    newGame,
    updateSettings,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
