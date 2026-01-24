import { formatDKK } from '@/lib/utils/currency-formatter';
import { TaxResult } from '@/lib/tax-calculator-danish';

interface TaxCalculationBreakdownProps {
  taxResult: TaxResult;
}

/**
 * Component to display detailed tax calculation breakdown
 */
export default function TaxCalculationBreakdown({
  taxResult,
}: TaxCalculationBreakdownProps) {
  return (
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
            <span className="text-muted-foreground">
              Taxable income (after deductions):
            </span>
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

          {taxResult.microsoftAllowance7pDkk > 0 && (
            <div className="flex justify-between text-green-600 dark:text-green-400">
              <span>§7P tax reduction:</span>
              <span className="font-semibold">
                -{formatDKK(taxResult.tax7pReduction)}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
