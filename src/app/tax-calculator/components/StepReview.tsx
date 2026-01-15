'use client';

import { useMemo } from 'react';
import { WizardFormData } from '../types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { calculateDanishTax, convertUsdToDkk, formatDKK, type TaxInput } from '@/lib/tax-calculator-danish';

interface StepReviewProps {
  formData: WizardFormData;
  updateFormData: (data: Partial<WizardFormData>) => void;
}

export default function StepReview({ formData, updateFormData }: StepReviewProps) {
  // Convert values to DKK if needed
  const valueInDkk = (value: number) => {
    return formData.currency === 'USD' ? convertUsdToDkk(value, formData.usdToDkkRate) : value;
  };

  // Calculate taxes
  const taxResult = useMemo(() => {
    const taxInput: TaxInput = {
      yearlySalaryDkk: valueInDkk(formData.yearlySalary),
      fradragDkk: valueInDkk(formData.fradrag),
      amountOn7pDkk: valueInDkk(formData.amountOn7p),
      amountNotOn7pDkk: valueInDkk(formData.amountNotOn7p),
      microsoftAllowance7pDkk: valueInDkk(formData.microsoftAllowance7p),
      year: formData.year,
    };
    return calculateDanishTax(taxInput);
  }, [formData]);

  return (
    <div className="space-y-6">
      {/* Input Summary */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Income Summary</h3>
        <div className="space-y-3 rounded-lg border border-border p-4">
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <span className="text-muted-foreground">Tax Year:</span>
            <span className="font-semibold">{formData.year}</span>

            <span className="text-muted-foreground">Yearly Salary:</span>
            <span className="font-semibold">{formatDKK(valueInDkk(formData.yearlySalary))}</span>

            <span className="text-muted-foreground">Fradrag (Deductions):</span>
            <span className="font-semibold">{formatDKK(valueInDkk(formData.fradrag))}</span>

            <span className="text-muted-foreground">RSU on §7P:</span>
            <span className="font-semibold">{formatDKK(valueInDkk(formData.amountOn7p))}</span>

            <span className="text-muted-foreground">RSU not on §7P:</span>
            <span className="font-semibold">{formatDKK(valueInDkk(formData.amountNotOn7p))}</span>

            <span className="text-muted-foreground">§7P Allowance:</span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              -{formatDKK(valueInDkk(formData.microsoftAllowance7p))}
            </span>

            <div className="col-span-2 border-t border-border pt-2">
              <div className="flex justify-between">
                <span className="font-medium">Total Gross Income:</span>
                <span className="text-lg font-bold">{formatDKK(taxResult.totalIncome)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tax Calculation Results */}
      <div>
        <h3 className="mb-3 text-lg font-semibold">Tax Calculation</h3>
        <div className="space-y-3 rounded-lg border border-border p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">AM-bidrag (8%):</span>
              <span className="font-semibold">{formatDKK(taxResult.amBidrag)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Income after AM-bidrag:</span>
              <span>{formatDKK(taxResult.taxableIncome)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxable income (after deductions):</span>
              <span>{formatDKK(taxResult.taxableIncomeAfterDeductions)}</span>
            </div>

            <div className="border-t border-border pt-2"></div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Municipal tax (~25%):</span>
              <span className="font-semibold">{formatDKK(taxResult.municipalTax)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-muted-foreground">Bottom tax (12.09%):</span>
              <span className="font-semibold">{formatDKK(taxResult.bottomTax)}</span>
            </div>

            {taxResult.topTax > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Top tax (15%):</span>
                <span className="font-semibold">{formatDKK(taxResult.topTax)}</span>
              </div>
            )}

            {formData.microsoftAllowance7p > 0 && (
              <div className="flex justify-between text-green-600 dark:text-green-400">
                <span>§7P tax reduction:</span>
                <span className="font-semibold">-{formatDKK(taxResult.tax7pReduction)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Total Tax Summary */}
      <div className="rounded-lg bg-primary p-6 text-primary-foreground">
        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-lg">Total Tax:</span>
            <span className="text-3xl font-bold">{formatDKK(taxResult.totalTax)}</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-primary-foreground/20 pt-3">
            <span>Effective Tax Rate:</span>
            <span className="text-2xl font-semibold">{taxResult.effectiveTaxRate.toFixed(1)}%</span>
          </div>
          <div className="flex items-baseline justify-between border-t border-primary-foreground/20 pt-3">
            <span className="text-lg">Net Income:</span>
            <span className="text-3xl font-bold">{formatDKK(taxResult.netIncome)}</span>
          </div>
        </div>
      </div>

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
          <strong>Disclaimer:</strong> This is an estimate based on 2024 Danish tax rates. Actual taxes may vary based on your municipality, personal circumstances, and other factors. Always consult with a tax professional or KPMG for accurate tax calculations.
        </p>
      </div>
    </div>
  );
}
