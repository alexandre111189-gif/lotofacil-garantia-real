
/**
 * Utility for bit manipulation and combinatorics.
 */

export function toBitmask(numbers: number[]): number {
  return numbers.reduce((mask, n) => mask | (1 << (n - 1)), 0);
}

export function countSetBits(n: number): number {
  n = n - ((n >> 1) & 0x55555555);
  n = (n & 0x33333333) + ((n >> 2) & 0x33333333);
  return (((n + (n >> 4)) & 0x0F0F0F0F) * 0x01010101) >> 24;
}

export function fromBitmask(mask: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < 25; i++) {
    if ((mask >> i) & 1) {
      result.push(i + 1);
    }
  }
  return result;
}

/**
 * Generates all combinations of size k from a pool of indices.
 * Optimized for Lotofácil 21->15 (54,264 combinations).
 */
export function* combine(pool: number[], k: number): IterableIterator<number[]> {
  const n = pool.length;
  if (k > n) return;
  const indices = Array.from({ length: k }, (_, i) => i);
  yield indices.map(i => pool[i]);

  while (true) {
    let i = k - 1;
    while (i >= 0 && indices[i] === i + n - k) {
      i--;
    }
    if (i < 0) return;
    indices[i]++;
    for (let j = i + 1; j < k; j++) {
      indices[j] = indices[i] + j - i;
    }
    yield indices.map(idx => pool[idx]);
  }
}

/**
 * The core mathematical proof engine.
 * Computes: min_S ( max_j acertos(jogo_j, S) )
 */
export function validateGuarantee(games: number[], pool: number[]): { minPoints: number, count: number } {
  let minOfMax = 15;
  let totalCombos = 0;

  // We iterate through all 54,264 combinations of 15 numbers within the 21 selected.
  for (const combination of combine(pool, 15)) {
    totalCombos++;
    const comboMask = toBitmask(combination);
    let maxHitsForThisCombo = 0;

    for (const gameMask of games) {
      const hits = countSetBits(comboMask & gameMask);
      if (hits > maxHitsForThisCombo) {
        maxHitsForThisCombo = hits;
      }
      // Performance optimization: if we hit 15, we can't do better for this combo
      if (maxHitsForThisCombo === 15) break;
    }

    if (maxHitsForThisCombo < minOfMax) {
      minOfMax = maxHitsForThisCombo;
    }

    // Early exit if guarantee is already proven impossible (< 11)
    if (minOfMax < 11) {
      return { minPoints: minOfMax, count: totalCombos };
    }
  }

  return { minPoints: minOfMax, count: totalCombos };
}
