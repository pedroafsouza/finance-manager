/**
 * Tests for Cost Basis Calculations
 * Validates both Average Cost (Gennemsnitsmetoden) and Lot-Based (FIFO) methods
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock data structures matching the actual types
interface MockLot {
  entry_date: string;
  quantity: number;
  cost_basis_dkk: number;
  lot_number?: number;
}

interface MockPosition {
  ticker: string;
  total_shares: number;
  weighted_average_cost_per_share: number;
  cost_basis_method: 'average-cost' | 'lot-based';
  lots: MockLot[];
}

/**
 * Calculate average cost basis
 * This mirrors the logic in capital-gains-calculator.ts
 */
function calculateAverageCostBasis(
  position: MockPosition,
  sharesSold: number
): { costBasis: number; remainingShares: number } {
  const costPerShare = position.weighted_average_cost_per_share;
  const costBasis = costPerShare * sharesSold;
  const remainingShares = position.total_shares - sharesSold;

  return {
    costBasis,
    remainingShares,
  };
}

/**
 * Calculate lot-based FIFO cost basis
 * This mirrors the logic in capital-gains-calculator.ts
 */
function calculateLotBasedCostBasis(
  position: MockPosition,
  sharesSold: number,
  specificLotNumber?: number
): {
  costBasis: number;
  remainingShares: number;
  lotsUsed: Array<{ lotNumber: number; shares: number; costBasis: number; date: string }>;
  term: 'Short Term' | 'Long Term';
} {
  const lotsUsed: Array<{
    lotNumber: number;
    shares: number;
    costBasis: number;
    date: string;
  }> = [];
  let totalCostBasis = 0;
  let remainingToSell = sharesSold;
  let oldestDate = '';

  // Sort lots by entry_date (FIFO) unless specific lot is requested
  const sortedLots = specificLotNumber
    ? position.lots.filter((lot) => lot.lot_number === specificLotNumber)
    : [...position.lots].sort((a, b) => a.entry_date.localeCompare(b.entry_date));

  for (const lot of sortedLots) {
    if (remainingToSell <= 0) break;

    const sharesToTakeFromLot = Math.min(lot.quantity, remainingToSell);
    const costPerShare = lot.cost_basis_dkk / lot.quantity;
    const costFromLot = sharesToTakeFromLot * costPerShare;

    lotsUsed.push({
      lotNumber: lot.lot_number || 0,
      shares: sharesToTakeFromLot,
      costBasis: costFromLot,
      date: lot.entry_date,
    });

    if (!oldestDate) {
      oldestDate = lot.entry_date;
    }

    totalCostBasis += costFromLot;
    remainingToSell -= sharesToTakeFromLot;
  }

  // Determine term (simplified: >1 year = Long Term)
  const daysSinceAcquisition = oldestDate
    ? (new Date().getTime() - new Date(oldestDate).getTime()) / (1000 * 60 * 60 * 24)
    : 0;
  const term = daysSinceAcquisition > 365 ? 'Long Term' : 'Short Term';

  return {
    costBasis: totalCostBasis,
    remainingShares: position.total_shares - sharesSold,
    lotsUsed,
    term,
  };
}

describe('Cost Basis Calculations', () => {
  describe('Average Cost Method (Gennemsnitsmetoden)', () => {
    it('should calculate cost basis using weighted average', () => {
      const position: MockPosition = {
        ticker: 'MSFT',
        total_shares: 100,
        weighted_average_cost_per_share: 200,
        cost_basis_method: 'average-cost',
        lots: [],
      };

      const result = calculateAverageCostBasis(position, 50);

      expect(result.costBasis).toBe(10000); // 50 * 200
      expect(result.remainingShares).toBe(50);
    });

    it('should handle selling all shares', () => {
      const position: MockPosition = {
        ticker: 'MSFT',
        total_shares: 100,
        weighted_average_cost_per_share: 250,
        cost_basis_method: 'average-cost',
        lots: [],
      };

      const result = calculateAverageCostBasis(position, 100);

      expect(result.costBasis).toBe(25000); // 100 * 250
      expect(result.remainingShares).toBe(0);
    });

    it('should handle partial share sales', () => {
      const position: MockPosition = {
        ticker: 'MSFT',
        total_shares: 100,
        weighted_average_cost_per_share: 150.5,
        cost_basis_method: 'average-cost',
        lots: [],
      };

      const result = calculateAverageCostBasis(position, 25);

      expect(result.costBasis).toBeCloseTo(3762.5, 2); // 25 * 150.5
      expect(result.remainingShares).toBe(75);
    });

    it('should handle single lot with average cost', () => {
      const position: MockPosition = {
        ticker: 'MSFT',
        total_shares: 50,
        weighted_average_cost_per_share: 300,
        cost_basis_method: 'average-cost',
        lots: [
          {
            entry_date: '2024-01-01',
            quantity: 50,
            cost_basis_dkk: 15000, // 50 * 300
          },
        ],
      };

      const result = calculateAverageCostBasis(position, 25);

      expect(result.costBasis).toBe(7500); // 25 * 300
    });

    it('should use same average cost for multiple sales', () => {
      const position: MockPosition = {
        ticker: 'MSFT',
        total_shares: 100,
        weighted_average_cost_per_share: 200,
        cost_basis_method: 'average-cost',
        lots: [],
      };

      const sale1 = calculateAverageCostBasis(position, 30);
      const sale2 = calculateAverageCostBasis(position, 40);

      // Both sales use the same average cost
      expect(sale1.costBasis / 30).toBe(200);
      expect(sale2.costBasis / 40).toBe(200);
    });

    it('should handle fractional average costs', () => {
      const position: MockPosition = {
        ticker: 'MSFT',
        total_shares: 100,
        weighted_average_cost_per_share: 123.456,
        cost_basis_method: 'average-cost',
        lots: [],
      };

      const result = calculateAverageCostBasis(position, 100);

      expect(result.costBasis).toBeCloseTo(12345.6, 2);
    });
  });

  describe('Lot-Based FIFO Method', () => {
    it('should use FIFO order for lot selection', () => {
      const position: MockPosition = {
        ticker: 'MSFT',
        total_shares: 150,
        weighted_average_cost_per_share: 0,
        cost_basis_method: 'lot-based',
        lots: [
          {
            entry_date: '2024-01-01',
            quantity: 50,
            cost_basis_dkk: 10000, // $200/share
            lot_number: 1,
          },
          {
            entry_date: '2024-03-01',
            quantity: 50,
            cost_basis_dkk: 12500, // $250/share
            lot_number: 2,
          },
          {
            entry_date: '2024-05-01',
            quantity: 50,
            cost_basis_dkk: 15000, // $300/share
            lot_number: 3,
          },
        ],
      };

      const result = calculateLotBasedCostBasis(position, 75);

      // Should use first two lots
      expect(result.lotsUsed).toHaveLength(2);
      expect(result.lotsUsed[0].lotNumber).toBe(1);
      expect(result.lotsUsed[0].shares).toBe(50);
      expect(result.lotsUsed[1].lotNumber).toBe(2);
      expect(result.lotsUsed[1].shares).toBe(25);
      expect(result.costBasis).toBeCloseTo(16250, 2); // 10000 + 6250
    });

    it('should consume entire lot when selling exact amount', () => {
      const position: MockPosition = {
        ticker: 'MSFT',
        total_shares: 100,
        weighted_average_cost_per_share: 0,
        cost_basis_method: 'lot-based',
        lots: [
          {
            entry_date: '2024-01-01',
            quantity: 50,
            cost_basis_dkk: 10000,
            lot_number: 1,
          },
          {
            entry_date: '2024-02-01',
            quantity: 50,
            cost_basis_dkk: 12000,
            lot_number: 2,
          },
        ],
      };

      const result = calculateLotBasedCostBasis(position, 50);

      expect(result.lotsUsed).toHaveLength(1);
      expect(result.lotsUsed[0].shares).toBe(50);
      expect(result.costBasis).toBe(10000);
      expect(result.remainingShares).toBe(50);
    });

    it('should handle partial lot consumption', () => {
      const position: MockPosition = {
        ticker: 'MSFT',
        total_shares: 100,
        weighted_average_cost_per_share: 0,
        cost_basis_method: 'lot-based',
        lots: [
          {
            entry_date: '2024-01-01',
            quantity: 100,
            cost_basis_dkk: 20000, // $200/share
            lot_number: 1,
          },
        ],
      };

      const result = calculateLotBasedCostBasis(position, 30);

      expect(result.lotsUsed).toHaveLength(1);
      expect(result.lotsUsed[0].shares).toBe(30);
      expect(result.costBasis).toBeCloseTo(6000, 2); // 30 * 200
      expect(result.remainingShares).toBe(70);
    });

    it('should select specific lot when lot number provided', () => {
      const position: MockPosition = {
        ticker: 'MSFT',
        total_shares: 150,
        weighted_average_cost_per_share: 0,
        cost_basis_method: 'lot-based',
        lots: [
          {
            entry_date: '2024-01-01',
            quantity: 50,
            cost_basis_dkk: 10000,
            lot_number: 1,
          },
          {
            entry_date: '2024-02-01',
            quantity: 50,
            cost_basis_dkk: 12500,
            lot_number: 2,
          },
          {
            entry_date: '2024-03-01',
            quantity: 50,
            cost_basis_dkk: 15000,
            lot_number: 3,
          },
        ],
      };

      // Select lot 3 specifically (not FIFO)
      const result = calculateLotBasedCostBasis(position, 25, 3);

      expect(result.lotsUsed).toHaveLength(1);
      expect(result.lotsUsed[0].lotNumber).toBe(3);
      expect(result.lotsUsed[0].shares).toBe(25);
      expect(result.costBasis).toBeCloseTo(7500, 2); // 25 * 300
    });

    it('should span multiple lots when needed', () => {
      const position: MockPosition = {
        ticker: 'MSFT',
        total_shares: 200,
        weighted_average_cost_per_share: 0,
        cost_basis_method: 'lot-based',
        lots: [
          {
            entry_date: '2024-01-01',
            quantity: 50,
            cost_basis_dkk: 10000,
            lot_number: 1,
          },
          {
            entry_date: '2024-02-01',
            quantity: 50,
            cost_basis_dkk: 11000,
            lot_number: 2,
          },
          {
            entry_date: '2024-03-01',
            quantity: 50,
            cost_basis_dkk: 12000,
            lot_number: 3,
          },
          {
            entry_date: '2024-04-01',
            quantity: 50,
            cost_basis_dkk: 13000,
            lot_number: 4,
          },
        ],
      };

      const result = calculateLotBasedCostBasis(position, 125);

      // Should consume lots 1, 2 fully and 25 from lot 3
      expect(result.lotsUsed).toHaveLength(3);
      expect(result.lotsUsed[0].shares).toBe(50);
      expect(result.lotsUsed[1].shares).toBe(50);
      expect(result.lotsUsed[2].shares).toBe(25);

      const expectedCost = 10000 + 11000 + 6000; // 50% of lot 3
      expect(result.costBasis).toBeCloseTo(expectedCost, 2);
    });
  });

  describe('Term Determination (Short vs Long)', () => {
    it('should mark as short term for recent purchases (<= 1 year)', () => {
      const position: MockPosition = {
        ticker: 'MSFT',
        total_shares: 50,
        weighted_average_cost_per_share: 0,
        cost_basis_method: 'lot-based',
        lots: [
          {
            entry_date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0], // 180 days ago
            quantity: 50,
            cost_basis_dkk: 10000,
            lot_number: 1,
          },
        ],
      };

      const result = calculateLotBasedCostBasis(position, 25);

      expect(result.term).toBe('Short Term');
    });

    it('should mark as long term for old purchases (> 1 year)', () => {
      const position: MockPosition = {
        ticker: 'MSFT',
        total_shares: 50,
        weighted_average_cost_per_share: 0,
        cost_basis_method: 'lot-based',
        lots: [
          {
            entry_date: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0], // 400 days ago
            quantity: 50,
            cost_basis_dkk: 10000,
            lot_number: 1,
          },
        ],
      };

      const result = calculateLotBasedCostBasis(position, 25);

      expect(result.term).toBe('Long Term');
    });

    it('should use oldest lot date for term determination in FIFO', () => {
      const position: MockPosition = {
        ticker: 'MSFT',
        total_shares: 100,
        weighted_average_cost_per_share: 0,
        cost_basis_method: 'lot-based',
        lots: [
          {
            entry_date: new Date(Date.now() - 400 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0], // 400 days ago
            quantity: 30,
            cost_basis_dkk: 6000,
            lot_number: 1,
          },
          {
            entry_date: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split('T')[0], // 100 days ago
            quantity: 70,
            cost_basis_dkk: 14000,
            lot_number: 2,
          },
        ],
      };

      const result = calculateLotBasedCostBasis(position, 50);

      // Uses lots 1 (30 shares) and 2 (20 shares)
      // Term based on lot 1 which is >1 year old
      expect(result.term).toBe('Long Term');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero shares sold', () => {
      const position: MockPosition = {
        ticker: 'MSFT',
        total_shares: 100,
        weighted_average_cost_per_share: 200,
        cost_basis_method: 'average-cost',
        lots: [],
      };

      const result = calculateAverageCostBasis(position, 0);

      expect(result.costBasis).toBe(0);
      expect(result.remainingShares).toBe(100);
    });

    it('should handle zero average cost', () => {
      const position: MockPosition = {
        ticker: 'MSFT',
        total_shares: 100,
        weighted_average_cost_per_share: 0,
        cost_basis_method: 'average-cost',
        lots: [],
      };

      const result = calculateAverageCostBasis(position, 50);

      expect(result.costBasis).toBe(0);
      expect(result.remainingShares).toBe(50);
    });

    it('should handle single share transactions', () => {
      const position: MockPosition = {
        ticker: 'MSFT',
        total_shares: 1,
        weighted_average_cost_per_share: 250,
        cost_basis_method: 'average-cost',
        lots: [],
      };

      const result = calculateAverageCostBasis(position, 1);

      expect(result.costBasis).toBe(250);
      expect(result.remainingShares).toBe(0);
    });

    it('should handle fractional shares in average cost', () => {
      const position: MockPosition = {
        ticker: 'MSFT',
        total_shares: 100.5,
        weighted_average_cost_per_share: 200,
        cost_basis_method: 'average-cost',
        lots: [],
      };

      const result = calculateAverageCostBasis(position, 50.25);

      expect(result.costBasis).toBeCloseTo(10050, 2); // 50.25 * 200
      expect(result.remainingShares).toBeCloseTo(50.25, 2);
    });

    it('should handle empty lots array for FIFO', () => {
      const position: MockPosition = {
        ticker: 'MSFT',
        total_shares: 0,
        weighted_average_cost_per_share: 0,
        cost_basis_method: 'lot-based',
        lots: [],
      };

      const result = calculateLotBasedCostBasis(position, 0);

      expect(result.lotsUsed).toHaveLength(0);
      expect(result.costBasis).toBe(0);
    });
  });

  describe('Method Comparison', () => {
    it('should produce same result for single lot regardless of method', () => {
      const position: MockPosition = {
        ticker: 'MSFT',
        total_shares: 100,
        weighted_average_cost_per_share: 200,
        cost_basis_method: 'lot-based',
        lots: [
          {
            entry_date: '2024-01-01',
            quantity: 100,
            cost_basis_dkk: 20000,
            lot_number: 1,
          },
        ],
      };

      const avgResult = calculateAverageCostBasis(position, 50);
      const fifoResult = calculateLotBasedCostBasis(position, 50);

      expect(avgResult.costBasis).toBeCloseTo(fifoResult.costBasis, 2);
    });

    it('should produce different results for multiple lots with varying costs', () => {
      const position: MockPosition = {
        ticker: 'MSFT',
        total_shares: 100,
        weighted_average_cost_per_share: 225, // (10000 + 15000) / 100
        cost_basis_method: 'lot-based',
        lots: [
          {
            entry_date: '2024-01-01',
            quantity: 50,
            cost_basis_dkk: 10000, // $200/share
            lot_number: 1,
          },
          {
            entry_date: '2024-02-01',
            quantity: 50,
            cost_basis_dkk: 15000, // $300/share
            lot_number: 2,
          },
        ],
      };

      const avgResult = calculateAverageCostBasis(position, 50);
      const fifoResult = calculateLotBasedCostBasis(position, 50);

      // Average: 50 * 225 = 11250
      // FIFO: Uses lot 1 entirely = 10000
      expect(avgResult.costBasis).toBeCloseTo(11250, 2);
      expect(fifoResult.costBasis).toBeCloseTo(10000, 2);
      expect(avgResult.costBasis).toBeGreaterThan(fifoResult.costBasis);
    });
  });
});
