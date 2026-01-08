
import { toBitmask, validateGuarantee, fromBitmask } from './math';
import { Game, GenerationResult } from '../types';

/**
 * LEVEL 3 - DYNAMIC SEARCH
 * Attempts to find 8 games that satisfy frequency and guarantee constraints.
 */
export function searchClosure(pool: number[]): GenerationResult {
  const startTime = Date.now();
  let attempts = 0;
  const maxAttempts = 500; // Limit search to prevent hangs
  
  // Total slots: 8 games * 15 numbers = 120.
  // Pool size: 21 numbers.
  // 120 / 21 = 5.71...
  // Target: each number appears 5 or 6 times.
  
  while (attempts < maxAttempts) {
    attempts++;
    
    // 1. Generate 8 candidates
    const gamesMasks: number[] = [];
    const frequency = new Array(25).fill(0);
    
    for (let i = 0; i < 8; i++) {
      // Shuffle pool and take 15
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, 15);
      selected.forEach(n => frequency[n - 1]++);
      gamesMasks.push(toBitmask(selected));
    }

    // 2. Validate Frequency Constraint
    // "Nenhuma dezena pode aparecer em menos de 5 jogos."
    const freqCheck = pool.every(n => frequency[n - 1] >= 5);
    if (!freqCheck) continue;

    // 3. Mathematical Validation (The heavy part)
    const proof = validateGuarantee(gamesMasks, pool);
    
    if (proof.minPoints >= 11) {
      const duration = Date.now() - startTime;
      return {
        games: gamesMasks.map((mask, idx) => ({ id: idx + 1, numbers: fromBitmask(mask).sort((a, b) => a - b) })),
        combinationsTested: 54264,
        minPoints: proof.minPoints,
        guaranteed: true,
        attempts,
        timeMs: duration
      };
    }
  }

  const duration = Date.now() - startTime;
  return {
    games: [],
    combinationsTested: 0,
    minPoints: 0,
    guaranteed: false,
    attempts,
    timeMs: duration
  };
}
