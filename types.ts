
export interface Game {
  id: number;
  numbers: number[];
  hits?: number;
}

export interface GenerationResult {
  games: Game[];
  combinationsTested: number;
  minPoints: number;
  guaranteed: boolean;
  attempts: number;
  timeMs: number;
}

export interface FinancialResult {
  cost: number;
  prize: number;
  balance: number;
  hitCount: {
    [key: number]: number;
  };
}

export const PRIZE_TABLE: Record<number, number> = {
  11: 7.00,
  12: 14.00,
  13: 35.00,
  14: 1000.00,
  15: 1000000.00
};

export const COST_PER_GAME = 3.50;
