'use client';

import { useMemo, useState, useEffect } from 'react';
import { WizardFormData } from '../types';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { calculateDanishTax, convertUsdToDkk, formatDKK, type TaxInput } from '@/lib/tax-calculator-danish';

interface StepReviewProps {
  formData: WizardFormData;
  updateFormData: (data: Partial<WizardFormData>) => void;
}

export default function StepReview({ formData, updateFormData }: StepReviewProps) {
  const [dividendData, setDividendData] = useState<any>(null);
  const [capitalGainsData, setCapitalGainsData] = useState<any>(null);
  const [portfolioValue, setPortfolioValue] = useState<number>(0);
  const [loadingStockData, setLoadingStockData] = useState(true);

  // Convert values to DKK if needed
  const valueInDkk = (value: number) => {
    return formData.currency === 'USD' ? convertUsdToDkk(value, formData.usdToDkkRate) : value;
  };

  // Calculate RSU income taxes
  const taxResult = useMemo(() => {
    const taxInput: TaxInput = {
      yearlySalaryDkk: valueInDkk(formData.yearlySalary),
      fradragDkk: valueInDkk(formData.fradrag),
      amountOn7pDkk: valueInDkk(formData.amountOn7p),
      amountNotOn7pDkk: valueInDkk(formData.amountNotOn7p),
      // microsoftAllowance7pDkk is now auto-calculated as 20% of salary
      year: formData.year,
    };
    return calculateDanishTax(taxInput);
  }, [formData]);

  // Fetch dividend and capital gains data for the tax year
  useEffect(() => {
    const fetchStockData = async () => {
      setLoadingStockData(true);
      try {
        // Fetch dividends (with US Person status)
        const divUrl = `/api/dividend-report?year=${formData.year}&is_us_person=${formData.isUsPerson}&irs_tax_paid=${formData.irsTaxPaidUsd}`;
        const divResponse = await fetch(divUrl);
        if (divResponse.ok) {
          const divData = await divResponse.json();
          if (divData.success) {
            setDividendData(divData.data);
          }
        }

        // Fetch capital gains
        const cgResponse = await fetch(`/api/capital-gains?year=${formData.year}`);
        if (cgResponse.ok) {
          const cgData = await cgResponse.json();
          if (cgData.success) {
            setCapitalGainsData(cgData.data);
          }
        }

        // Fetch portfolio value
        const grantsResponse = await fetch('/api/grants');
        if (grantsResponse.ok) {
          const grantsData = await grantsResponse.json();
          if (grantsData.success) {
            const totalValue = grantsData.data.reduce(
              (sum: number, grant: any) => sum + (grant.current_value || 0),
              0
            );
            setPortfolioValue(totalValue);
          }
        }
      } catch (error) {
        console.error('Error fetching stock data:', error);
      } finally {
        setLoadingStockData(false);
      }
    };

    fetchStockData();
  }, [formData.year, formData.isUsPerson, formData.irsTaxPaidUsd]);

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

            {formData.isUsPerson && (
              <>
                <span className="text-muted-foreground">US Person Status:</span>
                <span className="font-semibold text-yellow-600 dark:text-yellow-400">Yes (US Taxpayer)</span>

                {formData.irsTaxPaidUsd > 0 && (
                  <>
                    <span className="text-muted-foreground">IRS Tax Paid:</span>
                    <span className="font-semibold">${formData.irsTaxPaidUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </>
                )}
              </>
            )}

            <span className="text-muted-foreground">RSU on §7P:</span>
            <span className="font-semibold">{formatDKK(valueInDkk(formData.amountOn7p))}</span>

            <span className="text-muted-foreground">RSU not on §7P:</span>
            <span className="font-semibold">{formatDKK(valueInDkk(formData.amountNotOn7p))}</span>

            <span className="text-muted-foreground">§7P Allowance (auto):</span>
            <span className="font-semibold text-green-600 dark:text-green-400">
              -{formatDKK(taxResult.microsoftAllowance7pDkk)} (20% of salary)
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

            {taxResult.microsoftAllowance7pDkk > 0 && (
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
            <span className="text-lg">Total RSU Income Tax:</span>
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

      {/* Danish Tax Return Boxes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Danish Tax Return (Selvangivelse)</h3>
          <a
            href={`/tax-report/${formData.year}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 hover:text-blue-800 underline"
          >
            View Full Report →
          </a>
        </div>

        {loadingStockData ? (
          <div className="rounded-lg border border-border p-6 text-center text-muted-foreground">
            Loading stock transaction data...
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {/* Box 454: Capital Gains */}
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">📈</span>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Rubrik 454</p>
                    <p className="text-sm font-medium">Capital Gains/Loss</p>
                  </div>
                </div>
              </div>
              {capitalGainsData ? (
                <>
                  <p className="text-2xl font-bold">
                    {formatDKK(capitalGainsData.netGainLossDkk)}
                  </p>
                  {capitalGainsData.salesTransactions?.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {capitalGainsData.salesTransactions.length} sale(s) in {formData.year}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No sales recorded</p>
              )}
            </div>

            {/* Box 452: Gross Dividends */}
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💰</span>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Rubrik 452</p>
                    <p className="text-sm font-medium">Foreign Dividends</p>
                  </div>
                </div>
              </div>
              {dividendData ? (
                <>
                  <p className="text-2xl font-bold">
                    {formatDKK(dividendData.grossDividendsDkk)}
                  </p>
                  {dividendData.dividendTransactions?.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {dividendData.dividendTransactions.length} dividend(s) in {formData.year}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No dividends recorded</p>
              )}
            </div>

            {/* Box 496: Tax Credit */}
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">🏦</span>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Rubrik 496</p>
                    <p className="text-sm font-medium">Foreign Tax Credit</p>
                  </div>
                </div>
              </div>
              {dividendData ? (
                <>
                  <p className="text-2xl font-bold">
                    {formatDKK(dividendData.foreignTaxCreditDkk)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.isUsPerson ? (
                      <span className="text-yellow-600 dark:text-yellow-400">
                        US Person: Based on actual IRS tax paid
                      </span>
                    ) : (
                      '15% credit (US-Denmark treaty)'
                    )}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No credit available</p>
              )}
            </div>

            {/* Box 490: Portfolio Value */}
            <div className="rounded-lg border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💼</span>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Rubrik 490</p>
                    <p className="text-sm font-medium">Portfolio Value (Dec 31)</p>
                  </div>
                </div>
              </div>
              {portfolioValue > 0 ? (
                <>
                  <p className="text-2xl font-bold">
                    ${portfolioValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Current portfolio value
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No holdings recorded</p>
              )}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
            📋 What to Declare
          </p>
          <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
            <li>
              • <strong>RSU Income:</strong> Your salary and RSU income (shown above) must be reported as B-income
            </li>
            {capitalGainsData?.netGainLossDkk !== 0 && (
              <li>
                • <strong>Rubrik 454:</strong> Report capital gains/losses: {formatDKK(capitalGainsData?.netGainLossDkk || 0)}
              </li>
            )}
            {dividendData?.grossDividendsDkk > 0 && (
              <>
                <li>
                  • <strong>Rubrik 452:</strong> Report gross foreign dividends: {formatDKK(dividendData?.grossDividendsDkk || 0)}
                </li>
                <li>
                  • <strong>Rubrik 496:</strong> Claim foreign tax credit: {formatDKK(dividendData?.foreignTaxCreditDkk || 0)}
                </li>
              </>
            )}
            {portfolioValue > 0 && (
              <li>
                • <strong>Rubrik 490:</strong> Report portfolio value as of December 31st
              </li>
            )}
          </ul>
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
