'use client';

import { useState, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useCurrencyStore } from '@/lib/stores/currency-store';
import { useStockPricesStore } from '@/lib/stores/stock-prices-store';
import { formatCurrency, convertCurrency } from '@/lib/currency';
import Spinner from '../components/Spinner';

interface StockGrant {
  id: number;
  ticker: string;
  acquisition_date: string;
  lot_number?: number;
  capital_gain_impact: string;
  adjusted_gain_loss: number;
  adjusted_cost_basis: number;
  total_shares: number;
  current_value: number;
}

export default function ReportsPage() {
  const [grants, setGrants] = useState<StockGrant[]>([]);
  const [loading, setLoading] = useState(true);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Reports & Analytics
            </h1>
          </div>
          <div className="flex justify-center">
            <Spinner size={32} />
          </div>
        </div>
      </div>
    );
  }

  if (grants.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
              Reports & Analytics
            </h1>
          </div>
          <div className="rounded-2xl bg-white p-8 text-center shadow-lg dark:bg-gray-800">
            <p className="text-gray-600 dark:text-gray-400">
              No data available. Import your stock grants to see reports and analytics.
            </p>
          </div>
        </div>
      </div>
    );
  }

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
  const totalShares = grants.reduce((sum, g) => sum + g.total_shares, 0);

  // Holdings by ticker (pie chart)
  const holdingsByTicker = grants.reduce((acc, grant) => {
    if (!acc[grant.ticker]) {
      acc[grant.ticker] = { value: 0, shares: 0 };
    }
    acc[grant.ticker].value += grant.current_value;
    acc[grant.ticker].shares += grant.total_shares;
    return acc;
  }, {} as Record<string, { value: number; shares: number }>);

  const pieChartData = Object.entries(holdingsByTicker).map(([ticker, data]) => ({
    name: ticker,
    y: convertCurrency(data.value, 'USD', currency, exchangeRate),
  }));

  // Portfolio value over time (line chart)
  const valueByDate = grants
    .sort((a, b) => new Date(a.acquisition_date).getTime() - new Date(b.acquisition_date).getTime())
    .reduce((acc, grant) => {
      const date = grant.acquisition_date.split('T')[0];
      if (!acc.cumulative) acc.cumulative = 0;
      acc.cumulative += grant.current_value;
      acc.data.push([new Date(date).getTime(), convertCurrency(acc.cumulative, 'USD', currency, exchangeRate)]);
      return acc;
    }, { data: [] as [number, number][], cumulative: 0 }).data;

  // Gain/Loss distribution
  const gainLossData = grants.map((grant) => ({
    x: new Date(grant.acquisition_date).getTime(),
    y: convertCurrency(grant.adjusted_gain_loss, 'USD', currency, exchangeRate),
    name: `${grant.ticker} - Lot ${grant.lot_number}`,
    color: grant.adjusted_gain_loss >= 0 ? '#10b981' : '#ef4444',
  }));

  // Capital gain impact breakdown
  const capitalGainBreakdown = grants.reduce((acc, grant) => {
    const type = grant.capital_gain_impact || 'Unknown';
    if (!acc[type]) {
      acc[type] = 0;
    }
    acc[type] += grant.current_value;
    return acc;
  }, {} as Record<string, number>);

  const capitalGainChartData = Object.entries(capitalGainBreakdown).map(([type, value]) => ({
    name: type,
    y: convertCurrency(value, 'USD', currency, exchangeRate),
  }));

  // Chart configurations
  const portfolioValueChart: Highcharts.Options = {
    chart: {
      type: 'area',
      backgroundColor: 'transparent',
    },
    title: {
      text: 'Portfolio Value Over Time',
      style: { color: '#374151' },
    },
    xAxis: {
      type: 'datetime',
      title: { text: 'Date' },
    },
    yAxis: {
      title: { text: `Portfolio Value (${currency})` },
      labels: {
        formatter: function () {
          return getCurrencySymbol() + (this.value as number).toLocaleString();
        },
      },
    },
    series: [
      {
        type: 'area',
        name: 'Portfolio Value',
        data: valueByDate,
        color: '#3b82f6',
        fillColor: {
          linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
          stops: [
            [0, 'rgba(59, 130, 246, 0.3)'],
            [1, 'rgba(59, 130, 246, 0)'],
          ],
        },
      },
    ],
    credits: { enabled: false },
    legend: { enabled: false },
  };

  const holdingsChart: Highcharts.Options = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
    },
    title: {
      text: 'Holdings by Ticker',
      style: { color: '#374151' },
    },
    tooltip: {
      pointFormatter: function () {
        return `<b>${formatCurrencyValue(this.y || 0)}</b> (${this.percentage?.toFixed(1)}%)`;
      },
    },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: {
          enabled: true,
          format: '<b>{point.name}</b>: ${point.y:,.0f}',
        },
      },
    },
    series: [
      {
        type: 'pie',
        name: 'Value',
        data: pieChartData,
      },
    ],
    credits: { enabled: false },
  };

  const gainLossChart: Highcharts.Options = {
    chart: {
      type: 'scatter',
      backgroundColor: 'transparent',
    },
    title: {
      text: 'Gain/Loss Distribution',
      style: { color: '#374151' },
    },
    xAxis: {
      type: 'datetime',
      title: { text: 'Acquisition Date' },
    },
    yAxis: {
      title: { text: `Gain/Loss (${currency})` },
      labels: {
        formatter: function () {
          return getCurrencySymbol() + (this.value as number).toLocaleString();
        },
      },
      plotLines: [
        {
          value: 0,
          color: '#94a3b8',
          width: 2,
          zIndex: 4,
        },
      ],
    },
    series: [
      {
        type: 'scatter',
        name: 'Gain/Loss',
        data: gainLossData,
      },
    ],
    credits: { enabled: false },
    legend: { enabled: false },
  };

  const capitalGainChart: Highcharts.Options = {
    chart: {
      type: 'column',
      backgroundColor: 'transparent',
    },
    title: {
      text: 'Holdings by Capital Gain Type',
      style: { color: '#374151' },
    },
    xAxis: {
      type: 'category',
    },
    yAxis: {
      title: { text: `Value (${currency})` },
      labels: {
        formatter: function () {
          return getCurrencySymbol() + (this.value as number).toLocaleString();
        },
      },
    },
    series: [
      {
        type: 'column',
        name: 'Value',
        data: capitalGainChartData,
        colorByPoint: true,
      },
    ],
    credits: { enabled: false },
    legend: { enabled: false },
  };

  const formatCurrencyValue = (value: number) => {
    return formatCurrency(value, currency, exchangeRate);
  };

  const getCurrencySymbol = () => {
    return currency === 'DKK' ? 'kr' : '$';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Reports & Analytics
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Comprehensive insights into your RSU portfolio
          </p>
        </div>

        {/* Summary Cards */}
        <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Portfolio Value
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrencyValue(displayValue)}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Cost Basis
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {formatCurrencyValue(totalCostBasis)}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Gain/Loss
            </div>
            <div
              className={`mt-2 text-2xl font-bold ${
                totalGainLoss >= 0
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-red-600 dark:text-red-400'
              }`}
            >
              {formatCurrencyValue(totalGainLoss)}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <div className="text-sm font-medium text-gray-600 dark:text-gray-400">
              Total Shares
            </div>
            <div className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">
              {totalShares.toFixed(3)}
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="space-y-6">
          {/* Portfolio Value Chart */}
          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <HighchartsReact highcharts={Highcharts} options={portfolioValueChart} />
          </div>

          {/* Holdings and Capital Gain Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
              <HighchartsReact highcharts={Highcharts} options={holdingsChart} />
            </div>

            <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
              <HighchartsReact highcharts={Highcharts} options={capitalGainChart} />
            </div>
          </div>

          {/* Gain/Loss Distribution Chart */}
          <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
            <HighchartsReact highcharts={Highcharts} options={gainLossChart} />
          </div>
        </div>
      </div>
    </div>
  );
}
