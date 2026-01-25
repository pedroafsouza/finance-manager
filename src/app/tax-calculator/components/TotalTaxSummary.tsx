import { formatDKK } from '@/lib/utils/currency-formatter';
import { TaxResult } from '@/lib/tax-calculator-danish';

interface TotalTaxSummaryProps {
  taxResult: TaxResult;
}

/**
 * Component to display total tax summary with effective rate and net income
 */
export default function TotalTaxSummary({ taxResult }: TotalTaxSummaryProps) {
  return (
    <div className="rounded-lg bg-primary p-6 text-primary-foreground">
      <div className="space-y-3">
        <div className="flex items-baseline justify-between">
          <span className="text-lg">Income Tax:</span>
          <span className="text-3xl font-bold">
            {formatDKK(taxResult.totalTax)}
          </span>
        </div>
        <div className="flex items-baseline justify-between border-t border-primary-foreground/20 pt-3">
          <span>Effective Tax Rate:</span>
          <span className="text-2xl font-semibold">
            {taxResult.effectiveTaxRate.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-baseline justify-between border-t border-primary-foreground/20 pt-3">
          <span className="text-lg">Net Income:</span>
          <span className="text-3xl font-bold">
            {formatDKK(taxResult.netIncome)}
          </span>
        </div>
      </div>
    </div>
  );
}
