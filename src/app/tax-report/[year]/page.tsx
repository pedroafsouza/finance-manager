'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface TaxReport {
  capitalGains: any;
  dividends: any;
  portfolioValue: number;
  rsuTax: any;
}

export default function TaxReportPage() {
  const params = useParams();
  const router = useRouter();
  const year = params.year as string;

  const [loading, setLoading] = useState(true);
  const [capitalGains, setCapitalGains] = useState<any>(null);
  const [dividends, setDividends] = useState<any>(null);
  const [isUsPerson, setIsUsPerson] = useState(false);
  const [irsTaxPaid, setIrsTaxPaid] = useState<number>(0);
  const [portfolioValue, setPortfolioValue] = useState(0);

  useEffect(() => {
    fetchReports();
  }, [year, isUsPerson, irsTaxPaid]);

  const fetchReports = async () => {
    setLoading(true);

    try {
      // Fetch capital gains
      const cgResponse = await fetch(`/api/capital-gains?year=${year}`);
      const cgData = await cgResponse.json();
      if (cgData.success) {
        setCapitalGains(cgData.data);
      }

      // Fetch dividends
      const divResponse = await fetch(
        `/api/dividend-report?year=${year}&is_us_person=${isUsPerson}&irs_tax_paid=${irsTaxPaid}`
      );
      const divData = await divResponse.json();
      if (divData.success) {
        setDividends(divData.data);
      }

      // Fetch portfolio value (from grants API)
      const grantsResponse = await fetch('/api/grants');
      const grantsData = await grantsResponse.json();
      if (grantsData.success) {
        const totalValue = grantsData.data.reduce(
          (sum: number, grant: any) => sum + (grant.current_value || 0),
          0
        );
        setPortfolioValue(totalValue);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDkk = (amount: number) => {
    return new Intl.NumberFormat('da-DK', {
      style: 'currency',
      currency: 'DKK',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatUsd = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <p>Loading tax report for {year}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/reports')}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back to Reports
          </button>
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Danish Tax Report {year}
              </h1>
              <p className="text-gray-600">
                Selvangivelse - Aktieindkomst (Stock Income)
              </p>
            </div>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              📄 Print / Save PDF
            </button>
          </div>
        </div>

        {/* US Person Toggle */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={isUsPerson}
                  onChange={(e) => setIsUsPerson(e.target.checked)}
                  className="w-5 h-5"
                />
                <span className="text-gray-900 font-medium">
                  I am a US Person (US Citizen or Green Card holder)
                </span>
              </label>
              {isUsPerson && (
                <div className="mt-4">
                  <label className="block text-sm text-gray-700 mb-2">
                    IRS Tax Paid on Foreign Income (USD):
                  </label>
                  <input
                    type="number"
                    value={irsTaxPaid}
                    onChange={(e) => setIrsTaxPaid(parseFloat(e.target.value) || 0)}
                    className="px-3 py-2 border border-gray-300 rounded w-64"
                    placeholder="0.00"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter the actual tax paid to IRS (from your US tax return)
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {/* Box 454: Capital Gains */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 uppercase">
                Rubrik 454
              </h3>
              <span className="text-2xl">📈</span>
            </div>
            <p className="text-xs text-gray-500 mb-1">Gevinst/Tab ved salg</p>
            <p className="text-2xl font-bold text-gray-900">
              {capitalGains ? formatDkk(capitalGains.netGainLossDkk) : '-'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {capitalGains ? formatUsd(capitalGains.netGainLossUsd) : ''}
            </p>
          </div>

          {/* Box 452: Gross Dividends */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 uppercase">
                Rubrik 452
              </h3>
              <span className="text-2xl">💰</span>
            </div>
            <p className="text-xs text-gray-500 mb-1">Udenlandsk udbytte</p>
            <p className="text-2xl font-bold text-gray-900">
              {dividends ? formatDkk(dividends.grossDividendsDkk) : '-'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {dividends ? formatUsd(dividends.grossDividendsUsd) : ''}
            </p>
          </div>

          {/* Box 496: Tax Credit */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 uppercase">
                Rubrik 496
              </h3>
              <span className="text-2xl">🏦</span>
            </div>
            <p className="text-xs text-gray-500 mb-1">Creditnedslag (15%)</p>
            <p className="text-2xl font-bold text-gray-900">
              {dividends ? formatDkk(dividends.foreignTaxCreditDkk) : '-'}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {dividends ? formatUsd(dividends.foreignTaxCreditUsd) : ''}
            </p>
            {isUsPerson && (
              <p className="text-xs text-blue-600 mt-2">
                US Person: Using actual IRS tax
              </p>
            )}
          </div>

          {/* Box 490: Portfolio Value */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-500 uppercase">
                Rubrik 490
              </h3>
              <span className="text-2xl">💼</span>
            </div>
            <p className="text-xs text-gray-500 mb-1">Værdi 31. december</p>
            <p className="text-2xl font-bold text-gray-900">
              {formatUsd(portfolioValue)}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Current portfolio value
            </p>
          </div>
        </div>

        {/* Capital Gains Detail */}
        {capitalGains && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              📈 Capital Gains Detail (Box 454)
            </h2>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              <div className="border border-gray-200 rounded p-4">
                <p className="text-sm text-gray-500 uppercase mb-1">Short Term</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDkk(capitalGains.shortTermGainLossDkk)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatUsd(capitalGains.shortTermGainLossUsd)}
                </p>
              </div>
              <div className="border border-gray-200 rounded p-4">
                <p className="text-sm text-gray-500 uppercase mb-1">Long Term</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDkk(capitalGains.longTermGainLossDkk)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatUsd(capitalGains.longTermGainLossUsd)}
                </p>
              </div>
            </div>

            {/* By Ticker */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">By Ticker:</h3>
              <div className="space-y-2">
                {Object.entries(capitalGains.byTicker).map(([ticker, data]: [string, any]) => (
                  <div
                    key={ticker}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <span className="font-medium text-gray-900">{ticker}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({data.transactionCount} sales, {data.sharesSold.toFixed(3)} shares)
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatDkk(data.netGainLossDkk)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatUsd(data.netGainLossUsd)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transactions */}
            {capitalGains.salesTransactions.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm">
                  View {capitalGains.salesTransactions.length} sale transactions
                </summary>
                <div className="mt-4 space-y-2">
                  {capitalGains.salesTransactions.map((sale: any, idx: number) => (
                    <div
                      key={idx}
                      className="text-xs p-3 bg-gray-50 rounded border border-gray-200"
                    >
                      <div className="flex justify-between mb-1">
                        <span className="font-medium">{sale.entry_date}</span>
                        <span>{sale.ticker}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-gray-600">
                        <div>
                          Sold: {Math.abs(sale.num_shares).toFixed(3)} shares @ {formatUsd(sale.share_price)}
                        </div>
                        <div>
                          Sale: {formatDkk(sale.sale_value_dkk || 0)}
                        </div>
                        <div>
                          Cost: {formatDkk(sale.cost_basis_dkk || 0)}
                        </div>
                      </div>
                      <div className="mt-1">
                        <span className={sale.gain_loss_dkk > 0 ? 'text-green-600' : 'text-red-600'}>
                          {sale.gain_loss_dkk > 0 ? 'Gain' : 'Loss'}: {formatDkk(Math.abs(sale.gain_loss_dkk || 0))}
                        </span>
                        <span className="text-gray-500 ml-2">
                          ({sale.cost_basis_method})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {/* Dividend Detail */}
        {dividends && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              💰 Dividend Detail (Box 452 & 496)
            </h2>

            <div className="grid md:grid-cols-3 gap-6 mb-6">
              <div className="border border-gray-200 rounded p-4">
                <p className="text-sm text-gray-500 uppercase mb-1">Gross Dividends</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDkk(dividends.grossDividendsDkk)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatUsd(dividends.grossDividendsUsd)}
                </p>
              </div>
              <div className="border border-gray-200 rounded p-4">
                <p className="text-sm text-gray-500 uppercase mb-1">Tax Withheld</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDkk(dividends.actualWithheldDkk)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatUsd(dividends.actualWithheldUsd)}
                </p>
              </div>
              <div className="border border-gray-200 rounded p-4">
                <p className="text-sm text-gray-500 uppercase mb-1">Net Received</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatDkk(dividends.grossDividendsDkk - dividends.actualWithheldDkk)}
                </p>
                <p className="text-xs text-gray-500">
                  {formatUsd(dividends.grossDividendsUsd - dividends.actualWithheldUsd)}
                </p>
              </div>
            </div>

            {/* By Ticker */}
            <div className="mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">By Ticker:</h3>
              <div className="space-y-2">
                {Object.entries(dividends.byTicker).map(([ticker, data]: [string, any]) => (
                  <div
                    key={ticker}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <span className="font-medium text-gray-900">{ticker}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        ({data.transactionCount} payments)
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatDkk(data.grossDividendsDkk)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Withheld: {formatDkk(data.withheldDkk)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transactions */}
            {dividends.dividendTransactions.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm">
                  View {dividends.dividendTransactions.length} dividend transactions
                </summary>
                <div className="mt-4 space-y-2">
                  {dividends.dividendTransactions.map((div: any, idx: number) => (
                    <div
                      key={idx}
                      className="text-xs p-3 bg-gray-50 rounded border border-gray-200 flex justify-between"
                    >
                      <div>
                        <span className="font-medium">{div.entry_date}</span>
                        <span className="text-gray-600 ml-2">{div.ticker}</span>
                      </div>
                      <div className="text-right">
                        <p>{formatDkk(div.cash_value_dkk || 0)}</p>
                        <p className="text-gray-500">{formatUsd(Math.abs(div.cash_value))}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
        )}

        {/* RSU Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            💼 RSU Income Tax (§7P)
          </h2>
          <p className="text-gray-600 mb-4">
            Calculate your RSU income tax separately using the Tax Calculator.
          </p>
          <button
            onClick={() => router.push('/tax-calculator')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to RSU Tax Calculator
          </button>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-3">
            📋 How to Report on Your Danish Tax Return
          </h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
            <li>
              <strong>Rubrik 454:</strong> Enter {capitalGains ? formatDkk(capitalGains.netGainLossDkk) : 'capital gains'} under "Gevinst ved salg af børsnoterede aktier"
            </li>
            <li>
              <strong>Rubrik 452:</strong> Enter {dividends ? formatDkk(dividends.grossDividendsDkk) : 'gross dividends'} under "Udenlandsk udbytteindkomst"
            </li>
            <li>
              <strong>Rubrik 496:</strong> Enter {dividends ? formatDkk(dividends.foreignTaxCreditDkk) : 'tax credit'} under "Nedslag for udenlandsk skat af udbytter"
            </li>
            <li>
              <strong>Rubrik 490:</strong> Report your portfolio value as of December 31st
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
