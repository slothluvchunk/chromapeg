import { describe, it, expect } from 'vitest';
import { PALETTE, generateSecret } from '../src/colors';

// ─── PALETTE ──────────────────────────────────────────────────────────────────

describe('PALETTE', () => {
  it('contains 8 entries', () => {
    expect(PALETTE).toHaveLength(8);
  });

  it('all ids are unique', () => {
    const ids = PALETTE.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every entry has a valid 6-digit hex color', () => {
    for (const c of PALETTE) {
      expect(c.hex).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(c.textColor).toMatch(/^#[0-9a-fA-F]{3,6}$/);
    }
  });

  it('every entry has a non-empty label and icon', () => {
    for (const c of PALETTE) {
      expect(c.label.length).toBeGreaterThan(0);
      expect(c.icon.length).toBeGreaterThan(0);
    }
  });
});

// ─── generateSecret — edge cases ──────────────────────────────────────────────

describe('generateSecret — edge cases', () => {
  it('throws when length exceeds pool size and duplicates are not allowed', () => {
    const pool = PALETTE.slice(0, 3); // only 3 distinct colors
    expect(() => generateSecret(pool, 4, false)).toThrow();
  });

  it('does NOT throw when length exceeds pool size if duplicates are allowed', () => {
    const pool = PALETTE.slice(0, 3); // only 3 colors
    expect(() => generateSecret(pool, 5, true)).not.toThrow();
  });

  it('single-color pool with duplicates fills every slot with that one color', () => {
    const pool = [PALETTE[0]];
    const result = generateSecret(pool, 4, true);
    expect(result).toHaveLength(4);
    expect(result.every((id) => id === PALETTE[0].id)).toBe(true);
  });

  it('single-color pool without duplicates throws for length > 1', () => {
    const pool = [PALETTE[0]];
    expect(() => generateSecret(pool, 2, false)).toThrow();
  });

  it('length === 1 always returns a single element from the pool', () => {
    const poolIds = PALETTE.map((c) => c.id);
    const result = generateSecret(PALETTE, 1, false);
    expect(result).toHaveLength(1);
    expect(poolIds).toContain(result[0]);
  });

  it('length === pool.length without duplicates uses every color exactly once (a permutation)', () => {
    const pool = PALETTE.slice(0, 5);
    const poolIds = pool.map((c) => c.id);
    const result = generateSecret(pool, pool.length, false);
    expect(result).toHaveLength(pool.length);
    expect([...result].sort()).toEqual([...poolIds].sort());
  });
});

// ─── generateSecret — common cases ────────────────────────────────────────────

describe('generateSecret — common cases', () => {
  it('returns the requested length', () => {
    expect(generateSecret(PALETTE, 4, true)).toHaveLength(4);
    expect(generateSecret(PALETTE, 6, false)).toHaveLength(6);
  });

  it('every returned id belongs to the pool', () => {
    const pool = PALETTE.slice(0, 6);
    const poolIds = pool.map((c) => c.id);
    const result = generateSecret(pool, 4, false);
    for (const id of result) {
      expect(poolIds).toContain(id);
    }
  });

  it('never contains duplicates when allowDuplicates is false (over 50 runs)', () => {
    for (let i = 0; i < 50; i++) {
      const result = generateSecret(PALETTE, 6, false);
      expect(new Set(result).size).toBe(result.length);
    }
  });

  it('can produce duplicates when allowDuplicates is true (statistical check)', () => {
    // With a 2-color pool and length 2, P(duplicate) = 0.5 per run.
    // The probability of seeing zero duplicates in 100 runs is (0.5)^100 ≈ 0.
    const pool = PALETTE.slice(0, 2);
    let foundDuplicate = false;
    for (let i = 0; i < 100; i++) {
      const result = generateSecret(pool, 2, true);
      if (result[0] === result[1]) {
        foundDuplicate = true;
        break;
      }
    }
    expect(foundDuplicate).toBe(true);
  });
});
