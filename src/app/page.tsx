'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import type { Options } from 'highcharts';
import WelcomeDialog from './components/WelcomeDialog';
import AnalyzeButton from './components/AnalyzeButton';
import { useDemoModeStore } from '@/lib/stores/demo-mode-store';
import { useCurrencyStore } from '@/lib/stores/currency-store';
import { useStockPricesStore } from '@/lib/stores/stock-prices-store';
import { formatCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Eye, Upload, Calendar as CalendarIcon, TrendingUp, Package, Sparkles } from 'lucide-react';
import Spinner from './components/Spinner';

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
  const { isDemoMode, toggleDemoMode } = useDemoModeStore();
  const { currency, exchangeRate } = useCurrencyStore();
  const { prices, portfolioValueUSD, portfolioValueDKK } = useStockPricesStore();

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

  const formatCurrencyValue = (value: number) => {
    return formatCurrency(value, currency, exchangeRate);
  };

  // Calculate statistics using LIVE stock prices
  const totalValue = currency === 'USD' ? portfolioValueUSD : portfolioValueDKK;

  // Fallback to database values if live prices not available yet
  const totalValueFallback = grants.reduce((sum, g) => {
    const price = prices.get(g.ticker);
    if (price) {
      // Use live price: shares * current_price
      const liveValue = g.total_shares * price.price;
      return sum + (currency === 'USD' ? liveValue : liveValue * exchangeRate);
    }
    // Fallback to database value
    return sum + g.current_value;
  }, 0);

  const displayValue = totalValue > 0 ? totalValue : totalValueFallback;

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
      height: '100%',
    },
    title: { text: '' },
    tooltip: {
      pointFormatter: function () {
        return `<b>${formatCurrencyValue(this.y || 0)}</b>`;
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
        size: '80%',
      },
    ],
    credits: { enabled: false },
    legend: { enabled: false },
  };

  if (loading) {
    return (
      <>
        <WelcomeDialog />
        <div className="flex min-h-screen items-center justify-center">
          <Spinner size={32} />
        </div>
      </>
    );
  }

  if (grants.length === 0) {
    return (
      <>
        <WelcomeDialog />
        <div className="flex min-h-screen items-center justify-center p-6">
          <main className="flex w-full max-w-4xl flex-col items-center gap-12">
            <div className="flex flex-col items-center gap-6 text-center">
              <h1 className="text-5xl font-bold leading-tight tracking-tight">
                Skatly
              </h1>
              <p className="max-w-2xl text-xl leading-relaxed text-muted-foreground">
                Simplify your tax reporting and manage RSU stock grants from tech companies in Denmark
              </p>
            </div>

            {/* Call to Action */}
            {!isDemoMode && (
              <Card className="w-full max-w-2xl shadow-lg">
                <CardHeader>
                  <CardTitle>Get Started</CardTitle>
                  <CardDescription>
                    You haven't imported any data yet. Try demo mode to explore the app with sample data, or import your own Morgan Stanley PDF file.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                  <Button
                    onClick={toggleDemoMode}
                    className="flex items-center gap-2"
                    variant="default"
                  >
                    <Eye className="h-4 w-4" />
                    Try Demo Mode
                  </Button>
                  <Button asChild variant="outline" className="flex items-center gap-2">
                    <Link href="/imports">
                      <Upload className="h-4 w-4" />
                      Import Your Data
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            <div className="grid w-full gap-6 md:grid-cols-3">
              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>RSU Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Track vesting schedules, calculate taxable amounts, and manage your RSU grants
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>Tax Calculation</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Automatically calculate Danish taxes on stock compensation and capital gains
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-md">
                <CardHeader>
                  <CardTitle>SKAT Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Generate reports ready for SKAT annual tax filing and documentation
                  </p>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </>
    );
  }

  // Show dashboard when data exists
  return (
    <div className="min-h-screen p-6">
      <main className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">
            Portfolio Dashboard
          </h1>
          <p className="mt-2 text-muted-foreground">
            {isDemoMode ? 'Exploring demo data with anonymized values' : 'Welcome back! Here\'s your portfolio overview'}
          </p>
          {isDemoMode && (
            <Badge variant="secondary" className="mt-4">
              <Eye className="mr-1 h-3 w-3" />
              Demo Mode Active - Switch to Live Data in the top right
            </Badge>
          )}
        </div>

        {/* AI Portfolio Analysis - Highlighted Section */}
        <Card className="mb-8 border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-blue-50 shadow-lg dark:border-purple-800 dark:from-purple-950/30 dark:to-blue-950/30">
          <CardContent className="flex flex-col items-center justify-center gap-4 p-6 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-300" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-semibold">AI Portfolio Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Get AI-powered buy/sell/hold recommendations based on your portfolio
                </p>
              </div>
            </div>
            <AnalyzeButton />
          </CardContent>
        </Card>

        {/* Chart and Summary Cards Side by Side */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Left: Holdings Chart */}
          <Card className="shadow-md flex flex-col">
            <CardHeader>
              <CardTitle>Holdings by Ticker</CardTitle>
            </CardHeader>
            <CardContent className="flex-1">
              {typeof window !== 'undefined' && Highcharts && (
                <HighchartsReact highcharts={Highcharts} options={miniPieChart} />
              )}
            </CardContent>
          </Card>

          {/* Right: Summary Cards Stacked */}
          <div className="flex flex-col gap-6">
            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardDescription>Total Gain/Loss</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-3xl font-bold ${
                    totalGainLoss >= 0
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}
                >
                  {formatCurrencyValue(totalGainLoss)}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {((totalGainLoss / totalCostBasis) * 100).toFixed(2)}% return
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="pb-2">
                <CardDescription>Total Grants</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {grants.length}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Across {Object.keys(holdingsByTicker).length} ticker{Object.keys(holdingsByTicker).length !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Links */}
        <div className="grid gap-6 md:grid-cols-3">
          <Link href="/calendar" className="group">
            <Card className="shadow-md transition-all hover:shadow-xl">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                    <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                  </div>
                  <CardTitle>Vesting Calendar</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View your upcoming vesting schedule and track RSU grant dates
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/reports" className="group">
            <Card className="shadow-md transition-all hover:shadow-xl">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                    <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-300" />
                  </div>
                  <CardTitle>Reports & Analytics</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Comprehensive insights and detailed analytics of your portfolio
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/imports" className="group">
            <Card className="shadow-md transition-all hover:shadow-xl">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <Upload className="h-6 w-6 text-green-600 dark:text-green-300" />
                  </div>
                  <CardTitle>Import More Data</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Upload additional Morgan Stanley PDF files to update your portfolio
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>
    </div>
  );
}
