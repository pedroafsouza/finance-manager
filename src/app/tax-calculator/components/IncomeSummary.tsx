import { WizardFormData } from '../types';
import { formatDKK } from '@/lib/utils/currency-formatter';
import { TaxResult } from '@/lib/tax-calculator-danish';

interface IncomeSummaryProps {
  formData: WizardFormData;
  valueInDkk: (value: number | undefined | null) => number;
  taxResult: TaxResult;
}

/**
 * Component to display income summary in the tax review step
 */
export default function IncomeSummary({
  formData,
  valueInDkk,
  taxResult,
}: IncomeSummaryProps) {
  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold">Income Summary</h3>
      <div className="space-y-3 rounded-lg border border-border p-4">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <span className="text-muted-foreground">Tax Year:</span>
          <span className="font-semibold">{formData.year}</span>

          <span className="text-muted-foreground">Yearly Salary:</span>
          <span className="font-semibold">
            {formatDKK(valueInDkk(formData.yearlySalary))}
          </span>

          <span className="text-muted-foreground">Fradrag (Deductions):</span>
          <span className="font-semibold">
            {formatDKK(valueInDkk(formData.fradrag))}
          </span>

          {formData.isUsPerson && (
            <>
              <span className="text-muted-foreground">US Person Status:</span>
              <span className="font-semibold text-yellow-600 dark:text-yellow-400">
                Yes (US Taxpayer)
              </span>

              {formData.irsTaxPaidUsd > 0 && (
                <>
                  <span className="text-muted-foreground">IRS Tax Paid:</span>
                  <span className="font-semibold">
                    ${formData.irsTaxPaidUsd.toLocaleString('en-US', {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </>
              )}
            </>
          )}

          <span className="text-muted-foreground">RSU on §7P:</span>
          <span className="font-semibold">
            {formatDKK(valueInDkk(formData.amountOn7p))}
          </span>

          <span className="text-muted-foreground">RSU not on §7P:</span>
          <span className="font-semibold">
            {formatDKK(valueInDkk(formData.amountNotOn7p))}
          </span>

          <span className="text-muted-foreground">§7P Allowance (auto):</span>
          <span className="font-semibold text-green-600 dark:text-green-400">
            -{formatDKK(taxResult.microsoftAllowance7pDkk)} (20% of salary)
          </span>

          <div className="col-span-2 border-t border-border pt-2">
            <div className="flex justify-between">
              <span className="font-medium">Total Gross Income:</span>
              <span className="text-lg font-bold">
                {formatDKK(taxResult.totalIncome)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
