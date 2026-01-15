'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { Options } from 'highcharts';
import WelcomeDialog from './components/WelcomeDialog';
import { useDemoMode } from './contexts/DemoModeContext';

const Highcharts = dynamic(() => import('highcharts'), { ssr: false });
const HighchartsReact = dynamic(() => import('highcharts-react-official'), { ssr: false });

interface StockGrant {
  id: number;
  ticker: string;
  acquisition_date: string;
  adjusted_gain_loss: number;
  adjusted_cost_basis: number;
  current_value: number;
  total_shares: number;
}

export default function Home() {
  const [grants, setGrants] = useState<StockGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const { isDemoMode, toggleDemoMode } = useDemoMode();

  useEffect(() => {
    fetchGrants();
  }, []);

  const fetchGrants = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/grants');
      const data = await response.json();

      if (data.success) {
        setGrants(data.data);
      }
    } catch (error) {
      console.error('Error fetching grants:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Calculate statistics
  const totalValue = grants.reduce((sum, g) => sum + g.current_value, 0);
  const totalCostBasis = grants.reduce((sum, g) => sum + g.adjusted_cost_basis, 0);
  const totalGainLoss = grants.reduce((sum, g) => sum + g.adjusted_gain_loss, 0);

  // Holdings by ticker for mini chart
  const holdingsByTicker = grants.reduce((acc, grant) => {
    if (!acc[grant.ticker]) {
      acc[grant.ticker] = 0;
    }
    acc[grant.ticker] += grant.current_value;
    return acc;
  }, {} as Record<string, number>);

  const miniChartData = Object.entries(holdingsByTicker).map(([ticker, value]) => ({
    name: ticker,
    y: value,
  }));

  const miniPieChart: Options = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
      height: 200,
    },
    title: { text: '' },
    tooltip: {
      pointFormatter: function () {
        return `<b>$${this.y?.toLocaleString()}</b>`;
      },
    },
    plotOptions: {
      pie: {
        dataLabels: {
          enabled: true,
          format: '{point.name}',
          style: { fontSize: '10px' },
        },
      },
    },
    series: [
      {
        type: 'pie',
        name: 'Value',
        data: miniChartData,
        size: '100%',
      },
    ],
    credits: { enabled: false },
    legend: { enabled: false },
  };

  if (loading) {
    return (
      <>
        <WelcomeDialog />
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 font-sans dark:from-gray-900 dark:to-gray-800">
          <div className="text-gray-600 dark:text-gray-400">Loading...</div>
        </div>
      </>
    );
  }

  if (grants.length === 0) {
    return (
      <>
        <WelcomeDialog />
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 font-sans dark:from-gray-900 dark:to-gray-800">
          <main className="flex w-full max-w-4xl flex-col items-center gap-12 py-20 px-6">
            <div className="flex flex-col items-center gap-6 text-center">
              <h1 className="text-5xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
                Skatly
              </h1>
              <p className="max-w-2xl text-xl leading-relaxed text-gray-700 dark:text-gray-300">
                Simplify your tax reporting and manage RSU stock grants from tech companies in Denmark
              </p>
            </div>

            {/* Call to Action */}
            {!isDemoMode && (
              <div className="w-full max-w-2xl rounded-2xl bg-white p-8 shadow-lg dark:bg-gray-800 text-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Get Started
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  You haven't imported any data yet. Try demo mode to explore the app with sample data, or import your own Morgan Stanley PDF file.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={toggleDemoMode}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-medium text-white hover:bg-purple-700 transition"
                  >
                    👁️ Try Demo Mode
                  </button>
                  <Link
                    href="/imports"
                    className="inline-flex items-center justify-center gap-2 rounded-lg border-2 border-blue-600 px-6 py-3 font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition"
                  >
                    📊 Import Your Data
                  </Link>
                </div>
              </div>
            )}

            <div className="grid w-full gap-6 md:grid-cols-3">
              <div className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  RSU Tracking
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Track vesting schedules, calculate taxable amounts, and manage your RSU grants
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Tax Calculation
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Automatically calculate Danish taxes on stock compensation and capital gains
                </p>
              </div>

              <div className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  SKAT Integration
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Generate reports ready for SKAT annual tax filing and documentation
                </p>
              </div>
            </div>
          </main>
        </div>
      </>
    );
  }

  // Show dashboard when data exists
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 font-sans dark:from-gray-900 dark:to-gray-800">
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Portfolio Dashboard
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            {isDemoMode ? 'Exploring demo data with anonymized values' : 'Welcome back! Here\'s your portfolio overview'}
          </p>
          {isDemoMode && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
              👁️ Demo Mode Active - Switch to Live Data in the top right
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Portfolio Value
            </div>
            <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(totalValue)}
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Cost Basis: {formatCurrency(totalCostBasis)}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Gain/Loss
            </div>
            <div
              className={`mt-2 text-3xl font-bold ${
                totalGainLoss >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatCurrency(totalGainLoss)}
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {((totalGainLoss / totalCostBasis) * 100).toFixed(2)}% return
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Grants
            </div>
            <div className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              {grants.length}
            </div>
            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Across {Object.keys(holdingsByTicker).length} ticker{Object.keys(holdingsByTicker).length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Mini Chart */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Holdings by Ticker
          </h2>
          {typeof window !== 'undefined' && Highcharts && (
            <HighchartsReact highcharts={Highcharts} options={miniPieChart} />
          )}
        </div>

        {/* Quick Links */}
        <div className="grid gap-6 md:grid-cols-3">
          <Link
            href="/calendar"
            className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-lg transition-all hover:shadow-xl dark:bg-gray-800"
          >
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Vesting Calendar
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              View your upcoming vesting schedule and track RSU grant dates
            </p>
          </Link>

          <Link
            href="/reports"
            className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-lg transition-all hover:shadow-xl dark:bg-gray-800"
          >
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                <svg className="h-6 w-6 text-purple-600 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Reports & Analytics
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Comprehensive insights and detailed analytics of your portfolio
            </p>
          </Link>

          <Link
            href="/imports"
            className="flex flex-col gap-3 rounded-2xl bg-white p-6 shadow-lg transition-all hover:shadow-xl dark:bg-gray-800"
          >
            <div className="flex items-center space-x-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <svg className="h-6 w-6 text-green-600 dark:text-green-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                Import More Data
              </h3>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Upload additional Morgan Stanley Excel files to update your portfolio
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
