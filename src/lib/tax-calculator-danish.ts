/**
 * Danish Tax Calculator
 * Implements Danish tax rules including AM-bidrag, bottom tax, top tax, and municipal tax
 * Based on 2024 rates (can be adjusted for different years)
 */

export interface TaxInput {
  yearlySalaryDkk: number;
  fradragDkk: number; // Deductions
  amountOn7pDkk: number; // Amount reported on ligningslovens § 7P
  amountNotOn7pDkk: number; // Amount not on 7P (taxed as regular income)
  microsoftAllowance7pDkk: number; // Microsoft's calculated 7P allowance
  year: number;
}

export interface TaxResult {
  // Income breakdown
  totalIncome: number;
  taxableIncome: number;
  taxableIncomeAfterDeductions: number;

  // AM-bidrag (Labor Market Contribution) - 8%
  amBidrag: number;

  // Tax brackets
  bottomTaxBase: number;
  bottomTax: number; // ~12.09%

  topTaxBase: number;
  topTax: number; // 15% on income above threshold

  municipalTaxBase: number;
  municipalTax: number; // ~25% (average)

  // Total
  totalTax: number;
  effectiveTaxRate: number;
  netIncome: number;

  // 7P benefit
  tax7pReduction: number;
  regularTaxOn7pAmount: number;
}

/**
 * Danish tax rates for 2024
 * These should be updated annually
 */
export const TAX_RATES_2024 = {
  amBidrag: 0.08, // 8% AM-bidrag
  bottomTax: 0.1209, // 12.09% bundskat
  topTax: 0.15, // 15% topskat
  municipalTax: 0.25, // ~25% kommuneskat (average, varies by municipality)
  topTaxThreshold: 588900, // DKK - threshold for top tax in 2024
  personalAllowance: 49700, // DKK - personfradrag 2024
};

/**
 * Get tax rates for a specific year
 */
export function getTaxRates(year: number) {
  // For now, return 2024 rates for all years
  // This should be expanded with historical rates
  return TAX_RATES_2024;
}

/**
 * Calculate Danish taxes
 */
export function calculateDanishTax(input: TaxInput): TaxResult {
  const rates = getTaxRates(input.year);

  // Step 1: Calculate total income
  // Salary + RSU income (both 7P and non-7P)
  const totalIncome = input.yearlySalaryDkk + input.amountOn7pDkk + input.amountNotOn7pDkk;

  // Step 2: Calculate AM-bidrag (8% on all income before deductions)
  const amBidrag = totalIncome * rates.amBidrag;

  // Step 3: Income after AM-bidrag
  const incomeAfterAmBidrag = totalIncome - amBidrag;

  // Step 4: Apply personal allowance and other deductions
  const taxableIncomeAfterDeductions = Math.max(0, incomeAfterAmBidrag - rates.personalAllowance - input.fradragDkk);

  // Step 5: Calculate municipal tax (kommuneskat)
  const municipalTaxBase = taxableIncomeAfterDeductions;
  const municipalTax = municipalTaxBase * rates.municipalTax;

  // Step 6: Calculate bottom tax (bundskat)
  const bottomTaxBase = taxableIncomeAfterDeductions;
  const bottomTax = bottomTaxBase * rates.bottomTax;

  // Step 7: Calculate top tax (topskat) - only on income above threshold
  let topTaxBase = 0;
  let topTax = 0;
  if (taxableIncomeAfterDeductions > rates.topTaxThreshold) {
    topTaxBase = taxableIncomeAfterDeductions - rates.topTaxThreshold;
    topTax = topTaxBase * rates.topTax;
  }

  // Step 8: Calculate regular tax (what would be paid on the full amount)
  const regularTotalTax = amBidrag + municipalTax + bottomTax + topTax;

  // Step 9: Calculate 7P benefit
  // Under § 7P, the taxable value is reduced by the Microsoft allowance
  // This means we calculate tax on (amountOn7p - microsoftAllowance7p) instead of full amountOn7p
  let tax7pReduction = 0;
  let regularTaxOn7pAmount = 0;

  if (input.amountOn7pDkk > 0 && input.microsoftAllowance7pDkk > 0) {
    // Calculate what the tax would be on the 7P amount without the allowance
    const totalIncomeWithout7pBenefit = totalIncome;
    const amBidragOn7p = input.amountOn7pDkk * rates.amBidrag;
    const taxableOn7p = input.amountOn7pDkk - amBidragOn7p;

    // Simplified calculation: apply average tax rate to the allowance
    const averageTaxRate = rates.municipalTax + rates.bottomTax;
    regularTaxOn7pAmount = taxableOn7p * averageTaxRate;

    // The benefit is the tax on the allowance amount
    const allowanceAfterAmBidrag = input.microsoftAllowance7pDkk * (1 - rates.amBidrag);
    tax7pReduction = allowanceAfterAmBidrag * averageTaxRate;
  }

  // Step 10: Final tax with 7P benefit
  const totalTax = regularTotalTax - tax7pReduction;

  // Step 11: Calculate effective rate and net income
  const effectiveTaxRate = totalIncome > 0 ? (totalTax / totalIncome) * 100 : 0;
  const netIncome = totalIncome - totalTax;

  return {
    totalIncome,
    taxableIncome: incomeAfterAmBidrag,
    taxableIncomeAfterDeductions,
    amBidrag,
    bottomTaxBase,
    bottomTax,
    topTaxBase,
    topTax,
    municipalTaxBase,
    municipalTax,
    totalTax,
    effectiveTaxRate,
    netIncome,
    tax7pReduction,
    regularTaxOn7pAmount,
  };
}

/**
 * Format DKK currency
 */
export function formatDKK(amount: number): string {
  return new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Convert USD to DKK
 */
export function convertUsdToDkk(usd: number, rate: number = 6.9): number {
  return usd * rate;
}

/**
 * Convert DKK to USD
 */
export function convertDkkToUsd(dkk: number, rate: number = 6.9): number {
  return dkk / rate;
}
