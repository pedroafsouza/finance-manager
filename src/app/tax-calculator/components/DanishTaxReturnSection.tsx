import TaxBox from './TaxBox';
import { formatDKK } from '@/lib/utils/currency-formatter';
import { DividendData, CapitalGainsData } from '../hooks/useStockData';

interface DanishTaxReturnSectionProps {
  year: number;
  loading: boolean;
  dividendData: DividendData | null;
  capitalGainsData: CapitalGainsData | null;
  portfolioValue: number;
  isUsPerson: boolean;
}

/**
 * Component to display Danish tax return boxes (Rubrik 454, 452, 496, 490)
 */
export default function DanishTaxReturnSection({
  year,
  loading,
  dividendData,
  capitalGainsData,
  portfolioValue,
  isUsPerson,
}: DanishTaxReturnSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Danish Tax Return (Selvangivelse)</h3>
        <a
          href={`/tax-report/${year}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-blue-600 hover:text-blue-800 underline"
        >
          View Full Report →
        </a>
      </div>

      {loading ? (
        <div className="rounded-lg border border-border p-6 text-center text-muted-foreground">
          Loading stock transaction data...
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 gap-4">
            {/* Box 454: Capital Gains */}
            <TaxBox
              icon="📈"
              rubrik="Rubrik 454"
              title="Capital Gains/Loss"
              value={
                capitalGainsData ? (
                  formatDKK(capitalGainsData.netGainLossDkk)
                ) : (
                  <p className="text-sm text-muted-foreground">No sales recorded</p>
                )
              }
              subtitle={
                capitalGainsData?.salesTransactions?.length
                  ? `${capitalGainsData.salesTransactions.length} sale(s) in ${year}`
                  : undefined
              }
            />

            {/* Box 452: Gross Dividends */}
            <TaxBox
              icon="💰"
              rubrik="Rubrik 452"
              title="Foreign Dividends"
              value={
                dividendData ? (
                  formatDKK(dividendData.grossDividendsDkk)
                ) : (
                  <p className="text-sm text-muted-foreground">No dividends recorded</p>
                )
              }
              subtitle={
                dividendData?.dividendTransactions?.length
                  ? `${dividendData.dividendTransactions.length} dividend(s) in ${year}`
                  : undefined
              }
            />

            {/* Box 496: Tax Credit */}
            <TaxBox
              icon="🏦"
              rubrik="Rubrik 496"
              title="Foreign Tax Credit"
              value={
                dividendData ? (
                  formatDKK(dividendData.foreignTaxCreditDkk)
                ) : (
                  <p className="text-sm text-muted-foreground">No credit available</p>
                )
              }
              subtitle={
                dividendData ? (
                  <span
                    className={
                      isUsPerson ? 'text-yellow-600 dark:text-yellow-400' : ''
                    }
                  >
                    {isUsPerson
                      ? 'US Person: Based on actual IRS tax paid'
                      : '15% credit (US-Denmark treaty)'}
                  </span>
                ) : undefined
              }
            />

            {/* Box 490: Portfolio Value */}
            <TaxBox
              icon="💼"
              rubrik="Rubrik 490"
              title="Portfolio Value (Dec 31)"
              value={
                portfolioValue > 0 ? (
                  `$${portfolioValue.toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}`
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No holdings recorded
                  </p>
                )
              }
              subtitle={portfolioValue > 0 ? 'Current portfolio value' : undefined}
            />
          </div>

          {/* Info Box */}
          <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              📋 What to Declare
            </p>
            <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
              <li>
                • <strong>RSU Income:</strong> Your salary and RSU income (shown
                above) must be reported as B-income
              </li>
              {capitalGainsData?.netGainLossDkk !== 0 && (
                <li>
                  • <strong>Rubrik 454:</strong> Report capital gains/losses:{' '}
                  {formatDKK(capitalGainsData?.netGainLossDkk || 0)}
                </li>
              )}
              {dividendData && dividendData.grossDividendsDkk > 0 && (
                <>
                  <li>
                    • <strong>Rubrik 452:</strong> Report gross foreign dividends:{' '}
                    {formatDKK(dividendData.grossDividendsDkk)}
                  </li>
                  <li>
                    • <strong>Rubrik 496:</strong> Claim foreign tax credit:{' '}
                    {formatDKK(dividendData.foreignTaxCreditDkk)}
                  </li>
                </>
              )}
              {portfolioValue > 0 && (
                <li>
                  • <strong>Rubrik 490:</strong> Report portfolio value as of December
                  31st
                </li>
              )}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
