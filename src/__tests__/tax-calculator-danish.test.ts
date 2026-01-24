/**
 * Tests for Danish Tax Calculator
 * Validates tax calculations including AM-bidrag, municipal tax, bottom tax, top tax, and §7P benefits
 */

import { describe, it, expect } from 'vitest';
import {
  calculateDanishTax,
  getTaxRates,
  TAX_RATES_2024,
  type TaxInput,
} from '../lib/tax-calculator-danish';

describe('Danish Tax Calculator', () => {
  describe('Tax Rates', () => {
    it('should return 2024 tax rates', () => {
      const rates = getTaxRates(2024);
      expect(rates).toEqual(TAX_RATES_2024);
      expect(rates.amBidrag).toBe(0.08);
      expect(rates.bottomTax).toBe(0.1209);
      expect(rates.topTax).toBe(0.15);
      expect(rates.municipalTax).toBe(0.25);
    });

    it('should return 2024 rates for any year (fallback)', () => {
      const rates2025 = getTaxRates(2025);
      const rates2023 = getTaxRates(2023);
      expect(rates2025).toEqual(TAX_RATES_2024);
      expect(rates2023).toEqual(TAX_RATES_2024);
    });
  });

  describe('AM-bidrag Calculation', () => {
    it('should calculate 8% AM-bidrag on total income', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 100000,
        fradragDkk: 0,
        amountOn7pDkk: 0,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      expect(result.amBidrag).toBe(8000); // 100000 * 0.08
    });

    it('should apply AM-bidrag to salary + RSU income', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 500000,
        fradragDkk: 0,
        amountOn7pDkk: 100000,
        amountNotOn7pDkk: 50000,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      const totalIncome = 500000 + 100000 + 50000; // 650000
      expect(result.totalIncome).toBe(totalIncome);
      expect(result.amBidrag).toBe(totalIncome * 0.08); // 52000
    });

    it('should handle zero income', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 0,
        fradragDkk: 0,
        amountOn7pDkk: 0,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      expect(result.amBidrag).toBe(0);
      expect(result.totalTax).toBe(0);
    });
  });

  describe('Deductions and Personal Allowance', () => {
    it('should apply personal allowance (49,700 DKK for 2024)', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 100000,
        fradragDkk: 0,
        amountOn7pDkk: 0,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      const incomeAfterAm = 100000 * 0.92; // 92000
      const expectedTaxable = incomeAfterAm - 49700; // 42300
      expect(result.taxableIncomeAfterDeductions).toBe(expectedTaxable);
    });

    it('should apply personal allowance and additional deductions', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 200000,
        fradragDkk: 10000,
        amountOn7pDkk: 0,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      const incomeAfterAm = 200000 * 0.92; // 184000
      const expectedTaxable = incomeAfterAm - 49700 - 10000; // 124300
      expect(result.taxableIncomeAfterDeductions).toBe(expectedTaxable);
    });

    it('should not allow negative taxable income', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 30000,
        fradragDkk: 20000,
        amountOn7pDkk: 0,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      // Income after AM: 30000 * 0.92 = 27600
      // Deductions: 49700 + 20000 = 69700
      // Should be capped at 0
      expect(result.taxableIncomeAfterDeductions).toBe(0);
      expect(result.municipalTax).toBe(0);
      expect(result.bottomTax).toBe(0);
      expect(result.topTax).toBe(0);
    });
  });

  describe('Municipal Tax Calculation', () => {
    it('should calculate 25% municipal tax on taxable income', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 500000,
        fradragDkk: 0,
        amountOn7pDkk: 0,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      const expected = result.taxableIncomeAfterDeductions * 0.25;
      expect(result.municipalTax).toBeCloseTo(expected, 2);
    });

    it('should apply municipal tax after deductions', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 300000,
        fradragDkk: 50000,
        amountOn7pDkk: 0,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      expect(result.municipalTaxBase).toBe(result.taxableIncomeAfterDeductions);
      expect(result.municipalTax).toBe(result.taxableIncomeAfterDeductions * 0.25);
    });
  });

  describe('Bottom Tax Calculation', () => {
    it('should calculate 12.09% bottom tax', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 400000,
        fradragDkk: 0,
        amountOn7pDkk: 0,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      const expected = result.taxableIncomeAfterDeductions * 0.1209;
      expect(result.bottomTax).toBeCloseTo(expected, 2);
    });

    it('should apply bottom tax to same base as municipal tax', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 350000,
        fradragDkk: 0,
        amountOn7pDkk: 0,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      expect(result.bottomTaxBase).toBe(result.municipalTaxBase);
      expect(result.bottomTaxBase).toBe(result.taxableIncomeAfterDeductions);
    });
  });

  describe('Top Tax Calculation', () => {
    it('should not charge top tax below threshold (588,900 DKK)', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 500000,
        fradragDkk: 0,
        amountOn7pDkk: 0,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      // Taxable income after deductions will be less than threshold
      expect(result.topTax).toBe(0);
      expect(result.topTaxBase).toBe(0);
    });

    it('should charge 15% top tax only on income above threshold', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 700000,
        fradragDkk: 0,
        amountOn7pDkk: 0,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      // Income after AM: 700000 * 0.92 = 644000
      // After deductions: 644000 - 49700 = 594300
      // Above threshold: 594300 - 588900 = 5400
      if (result.taxableIncomeAfterDeductions > TAX_RATES_2024.topTaxThreshold) {
        const expectedBase = result.taxableIncomeAfterDeductions - TAX_RATES_2024.topTaxThreshold;
        expect(result.topTaxBase).toBeCloseTo(expectedBase, 2);
        expect(result.topTax).toBeCloseTo(expectedBase * 0.15, 2);
      }
    });

    it('should charge top tax on high income', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 1000000,
        fradragDkk: 0,
        amountOn7pDkk: 0,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      // Income after AM: 1000000 * 0.92 = 920000
      // After deductions: 920000 - 49700 = 870300
      // Above threshold: 870300 - 588900 = 281400
      const expectedBase = 281400;
      expect(result.topTaxBase).toBeCloseTo(expectedBase, 2);
      expect(result.topTax).toBeCloseTo(expectedBase * 0.15, 2);
    });
  });

  describe('§7P Allowance Auto-Calculation', () => {
    it('should auto-calculate §7P allowance as 20% of salary', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 500000,
        fradragDkk: 0,
        amountOn7pDkk: 100000,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      expect(result.microsoftAllowance7pDkk).toBe(100000); // 500000 * 0.20
    });

    it('should use manual override if provided', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 500000,
        fradragDkk: 0,
        amountOn7pDkk: 100000,
        amountNotOn7pDkk: 0,
        microsoftAllowance7pDkk: 80000, // Manual override
        year: 2024,
      };
      const result = calculateDanishTax(input);
      expect(result.microsoftAllowance7pDkk).toBe(80000);
    });

    it('should calculate §7P allowance for zero salary', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 0,
        fradragDkk: 0,
        amountOn7pDkk: 50000,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      expect(result.microsoftAllowance7pDkk).toBe(0); // 0 * 0.20
    });
  });

  describe('§7P Tax Reduction', () => {
    it('should apply §7P tax reduction when income is on §7P', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 500000,
        fradragDkk: 0,
        amountOn7pDkk: 100000,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      expect(result.tax7pReduction).toBeGreaterThan(0);
      // The reduction should be based on the allowance (20% of salary = 100000)
      const allowanceAfterAm = 100000 * 0.92;
      const averageTaxRate = 0.25 + 0.1209;
      const expectedReduction = allowanceAfterAm * averageTaxRate;
      expect(result.tax7pReduction).toBeCloseTo(expectedReduction, 2);
    });

    it('should not apply §7P reduction when amount on §7P is zero', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 500000,
        fradragDkk: 0,
        amountOn7pDkk: 0,
        amountNotOn7pDkk: 100000,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      expect(result.tax7pReduction).toBe(0);
    });

    it('should not apply §7P reduction when allowance is zero', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 0,
        fradragDkk: 0,
        amountOn7pDkk: 100000,
        amountNotOn7pDkk: 0,
        microsoftAllowance7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      expect(result.tax7pReduction).toBe(0);
    });

    it('should reduce total tax by §7P benefit', () => {
      const inputWithout7p: TaxInput = {
        yearlySalaryDkk: 500000,
        fradragDkk: 0,
        amountOn7pDkk: 0,
        amountNotOn7pDkk: 100000,
        year: 2024,
      };
      const inputWith7p: TaxInput = {
        yearlySalaryDkk: 500000,
        fradragDkk: 0,
        amountOn7pDkk: 100000,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const resultWithout = calculateDanishTax(inputWithout7p);
      const resultWith = calculateDanishTax(inputWith7p);

      // Tax with §7P should be less than without
      expect(resultWith.totalTax).toBeLessThan(resultWithout.totalTax);
      // The difference should be the tax reduction
      expect(resultWith.totalTax).toBeCloseTo(
        resultWithout.totalTax - resultWith.tax7pReduction,
        0
      );
    });
  });

  describe('Total Tax and Net Income', () => {
    it('should calculate total tax as sum of all components minus §7P reduction', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 600000,
        fradragDkk: 0,
        amountOn7pDkk: 100000,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      const expectedTotal =
        result.amBidrag +
        result.municipalTax +
        result.bottomTax +
        result.topTax -
        result.tax7pReduction;
      expect(result.totalTax).toBeCloseTo(expectedTotal, 2);
    });

    it('should calculate net income as total income minus total tax', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 500000,
        fradragDkk: 0,
        amountOn7pDkk: 0,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      expect(result.netIncome).toBe(result.totalIncome - result.totalTax);
    });

    it('should calculate effective tax rate correctly', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 500000,
        fradragDkk: 0,
        amountOn7pDkk: 0,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      const expected = (result.totalTax / result.totalIncome) * 100;
      expect(result.effectiveTaxRate).toBeCloseTo(expected, 2);
      expect(result.effectiveTaxRate).toBeGreaterThan(0);
      expect(result.effectiveTaxRate).toBeLessThan(100);
    });

    it('should handle zero income for effective tax rate', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 0,
        fradragDkk: 0,
        amountOn7pDkk: 0,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      expect(result.effectiveTaxRate).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very high income', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 5000000,
        fradragDkk: 0,
        amountOn7pDkk: 1000000,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      expect(result.totalIncome).toBe(6000000);
      expect(result.totalTax).toBeGreaterThan(0);
      expect(result.netIncome).toBeGreaterThan(0);
      expect(result.topTax).toBeGreaterThan(0); // Should definitely hit top tax
    });

    it('should handle mixed §7P and non-§7P income', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 500000,
        fradragDkk: 0,
        amountOn7pDkk: 100000,
        amountNotOn7pDkk: 50000,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      expect(result.totalIncome).toBe(650000);
      expect(result.tax7pReduction).toBeGreaterThan(0);
    });

    it('should handle large deductions', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 200000,
        fradragDkk: 150000,
        amountOn7pDkk: 0,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);
      // Large deductions should result in low or zero taxable income
      expect(result.taxableIncomeAfterDeductions).toBeGreaterThanOrEqual(0);
    });

    it('should handle all positive values for realistic scenario', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 750000,
        fradragDkk: 0,
        amountOn7pDkk: 150000,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);

      // All tax components should be positive or zero
      expect(result.amBidrag).toBeGreaterThanOrEqual(0);
      expect(result.municipalTax).toBeGreaterThanOrEqual(0);
      expect(result.bottomTax).toBeGreaterThanOrEqual(0);
      expect(result.topTax).toBeGreaterThanOrEqual(0);
      expect(result.totalTax).toBeGreaterThanOrEqual(0);
      expect(result.netIncome).toBeGreaterThanOrEqual(0);

      // Income values should be consistent
      expect(result.totalIncome).toBe(900000);
      expect(result.taxableIncome).toBe(result.totalIncome - result.amBidrag);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should calculate tax for typical Microsoft employee (500K salary + 100K RSU on §7P)', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 500000,
        fradragDkk: 0,
        amountOn7pDkk: 100000,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);

      expect(result.totalIncome).toBe(600000);
      expect(result.microsoftAllowance7pDkk).toBe(100000); // 20% of salary
      expect(result.tax7pReduction).toBeGreaterThan(30000); // Significant reduction
      expect(result.effectiveTaxRate).toBeGreaterThan(30);
      expect(result.effectiveTaxRate).toBeLessThan(40);
    });

    it('should calculate tax for employee just below top tax threshold', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 550000,
        fradragDkk: 0,
        amountOn7pDkk: 0,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);

      // Income after AM: 550000 * 0.92 = 506000
      // After deductions: 506000 - 49700 = 456300
      // Should be below threshold (588900)
      expect(result.topTax).toBe(0);
    });

    it('should calculate tax for employee just above top tax threshold', () => {
      const input: TaxInput = {
        yearlySalaryDkk: 750000,
        fradragDkk: 0,
        amountOn7pDkk: 0,
        amountNotOn7pDkk: 0,
        year: 2024,
      };
      const result = calculateDanishTax(input);

      // Income after AM: 750000 * 0.92 = 690000
      // After deductions: 690000 - 49700 = 640300
      // Above threshold: 640300 - 588900 = 51400
      expect(result.topTax).toBeGreaterThan(0);
      expect(result.topTaxBase).toBeCloseTo(51400, 2);
    });
  });
});
