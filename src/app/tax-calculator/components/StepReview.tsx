'use client';

import { useMemo } from 'react';
import { WizardFormData } from '../types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { calculateDanishTax, type TaxInput } from '@/lib/tax-calculator-danish';
import { useFormCurrencyConversion } from '@/lib/hooks/useCurrencyConversion';
import { useStockData } from '../hooks/useStockData';
import IncomeSummary from './IncomeSummary';
import TaxCalculationBreakdown from './TaxCalculationBreakdown';
import TotalTaxSummary from './TotalTaxSummary';
import DanishTaxReturnSection from './DanishTaxReturnSection';

interface StepReviewProps {
  formData: WizardFormData;
  updateFormData: (data: Partial<WizardFormData>) => void;
}

/**
 * Final review step of the tax calculator wizard
 * Displays income summary, tax calculations, and Danish tax return boxes
 */
export default function StepReview({ formData, updateFormData }: StepReviewProps) {
  // Currency conversion utilities
  const { valueInDkk } = useFormCurrencyConversion(formData);

  // Calculate RSU income taxes
  const taxResult = useMemo(() => {
    const taxInput: TaxInput = {
      yearlySalaryDkk: valueInDkk(formData.yearlySalary),
      fradragDkk: valueInDkk(formData.fradrag),
      amountOn7pDkk: valueInDkk(formData.amountOn7p),
      amountNotOn7pDkk: valueInDkk(formData.amountNotOn7p),
      year: formData.year,
    };
    return calculateDanishTax(taxInput);
  }, [formData, valueInDkk]);

  // Fetch stock data (dividends, capital gains, portfolio)
  const { dividendData, capitalGainsData, portfolioValue, loading } = useStockData(
    formData.year,
    formData.isUsPerson,
    formData.irsTaxPaidUsd
  );

  return (
    <div className="space-y-6">
      {/* Income Summary */}
      <IncomeSummary
        formData={formData}
        valueInDkk={valueInDkk}
        taxResult={taxResult}
      />

      {/* Tax Calculation Breakdown */}
      <TaxCalculationBreakdown taxResult={taxResult} />

      {/* Total Tax Summary */}
      <TotalTaxSummary taxResult={taxResult} />

      {/* Danish Tax Return Boxes */}
      <DanishTaxReturnSection
        year={formData.year}
        loading={loading}
        dividendData={dividendData}
        capitalGainsData={capitalGainsData}
        portfolioValue={portfolioValue}
        isUsPerson={formData.isUsPerson}
      />

      {/* Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => updateFormData({ notes: e.target.value })}
          placeholder="Add any notes about this tax calculation..."
          rows={3}
        />
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Disclaimer:</strong> This is an estimate based on 2024 Danish tax
          rates. Actual taxes may vary based on your municipality, personal
          circumstances, and other factors. Always consult with a tax professional or
          KPMG for accurate tax calculations.
        </p>
      </div>
    </div>
  );
}
