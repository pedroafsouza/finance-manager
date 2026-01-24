'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface PortfolioPosition {
  ticker: string;
  total_shares: number;
  cost_basis_method: string;
  weighted_average_cost_per_share?: number;
  lots: {
    lot_number: number;
    acquisition_date: string;
    shares: number;
    cost_per_share: number;
    capital_gain_impact: string;
  }[];
}

export default function CostBasisSettings() {
  const router = useRouter();
  const [positions, setPositions] = useState<PortfolioPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    fetchPositions();
  }, []);

  const fetchPositions = async () => {
    try {
      const response = await fetch('/api/capital-gains?action=positions');
      const data = await response.json();

      if (data.success) {
        setPositions(data.data);
      }
    } catch (error) {
      console.error('Error fetching positions:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateMethod = async (ticker: string, method: 'lot-based' | 'average-cost') => {
    if (!confirm(`Switch ${ticker} to ${method === 'average-cost' ? 'Gennemsnitsmetoden (Average Cost)' : 'Lot-Based'}?`)) {
      return;
    }

    setUpdating(ticker);

    try {
      const response = await fetch('/api/capital-gains', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, method }),
      });

      const data = await response.json();

      if (data.success) {
        await fetchPositions();
        alert('Cost basis method updated successfully!');
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Error updating method:', error);
      alert('Failed to update cost basis method');
    } finally {
      setUpdating(null);
    }
  };

  const calculateWeightedAverage = (position: PortfolioPosition): number => {
    if (position.weighted_average_cost_per_share) {
      return position.weighted_average_cost_per_share;
    }

    const totalCost = position.lots.reduce(
      (sum, lot) => sum + lot.shares * lot.cost_per_share,
      0
    );
    return position.total_shares > 0 ? totalCost / position.total_shares : 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-6xl mx-auto">
          <p>Loading portfolio...</p>
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
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Cost Basis Method Settings
          </h1>
          <p className="text-gray-600">
            Choose how to calculate your cost basis for capital gains tax reporting
          </p>
        </div>

        {/* Explanation Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Understanding Cost Basis Methods
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Lot-Based Method */}
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                📦 Lot-Based Method (FIFO)
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                Each stock purchase (vest, DRIP, etc.) is tracked separately as a "lot".
                When you sell, shares are matched to specific lots using First-In-First-Out (FIFO).
              </p>
              <div className="bg-gray-50 p-3 rounded text-sm">
                <p className="font-semibold mb-1">Example:</p>
                <p className="text-gray-700">
                  • You buy 10 shares at $100 (Lot A)<br />
                  • You buy 5 shares at $150 (Lot B)<br />
                  • You sell 12 shares at $200<br />
                  • Cost basis: (10 × $100) + (2 × $150) = $1,300
                </p>
              </div>
              <div className="mt-3 text-sm">
                <p className="font-semibold text-gray-700">✅ Best for:</p>
                <ul className="list-disc list-inside text-gray-600">
                  <li>Detailed tracking</li>
                  <li>Tax optimization</li>
                  <li>Few transactions</li>
                </ul>
              </div>
            </div>

            {/* Average Cost Method */}
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <h3 className="font-semibold text-lg text-gray-900 mb-2">
                📊 Gennemsnitsmetoden (Average Cost)
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                All shares are averaged together into a single cost per share.
                Every time you acquire new shares, the average is recalculated.
                This is the standard method in Denmark.
              </p>
              <div className="bg-white p-3 rounded text-sm">
                <p className="font-semibold mb-1">Example:</p>
                <p className="text-gray-700">
                  • You buy 10 shares at $100 (Total: $1,000)<br />
                  • You buy 5 shares at $150 (Total: $750)<br />
                  • Average: $1,750 ÷ 15 = $116.67 per share<br />
                  • You sell 12 shares at $200<br />
                  • Cost basis: 12 × $116.67 = $1,400
                </p>
              </div>
              <div className="mt-3 text-sm">
                <p className="font-semibold text-gray-700">✅ Best for:</p>
                <ul className="list-disc list-inside text-gray-600">
                  <li>Simplicity</li>
                  <li>Many transactions</li>
                  <li>Standard Danish practice</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-gray-700">
              <strong>⚠️ Important:</strong> Once you switch to Gennemsnitsmetoden for a ticker,
              you cannot switch back to Lot-Based for that ticker (Danish tax rules).
              The average cost will be recalculated every time you acquire new shares.
            </p>
          </div>
        </div>

        {/* Portfolio Positions */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Your Portfolio
          </h2>

          {positions.length === 0 ? (
            <p className="text-gray-500">No holdings found. Import your Morgan Stanley statement first.</p>
          ) : (
            <div className="space-y-6">
              {positions.map((position) => {
                const weightedAvg = calculateWeightedAverage(position);
                const totalCostLotBased = position.lots.reduce(
                  (sum, lot) => sum + lot.shares * lot.cost_per_share,
                  0
                );
                const totalCostAverage = position.total_shares * weightedAvg;
                const difference = totalCostAverage - totalCostLotBased;

                return (
                  <div
                    key={position.ticker}
                    className="border border-gray-200 rounded-lg p-4"
                  >
                    {/* Ticker Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {position.ticker}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {position.total_shares.toFixed(3)} shares •{' '}
                          {position.lots.length} lots
                        </p>
                      </div>
                      <div className="text-right">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                            position.cost_basis_method === 'average-cost'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {position.cost_basis_method === 'average-cost'
                            ? '📊 Average Cost'
                            : '📦 Lot-Based'}
                        </span>
                      </div>
                    </div>

                    {/* Cost Comparison */}
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      <div className="bg-gray-50 p-3 rounded">
                        <p className="text-xs text-gray-500 uppercase mb-1">Lot-Based Total Cost</p>
                        <p className="text-lg font-semibold text-gray-900">
                          ${totalCostLotBased.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div className="bg-blue-50 p-3 rounded">
                        <p className="text-xs text-gray-500 uppercase mb-1">Average Cost Total</p>
                        <p className="text-lg font-semibold text-gray-900">
                          ${totalCostAverage.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          ${weightedAvg.toFixed(2)} per share
                        </p>
                      </div>
                    </div>

                    {difference !== 0 && (
                      <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                        <p className="text-sm text-gray-700">
                          <strong>Impact of switching:</strong>{' '}
                          {difference > 0 ? (
                            <span className="text-red-600">
                              Higher cost basis by ${Math.abs(difference).toFixed(2)} (lower future gains)
                            </span>
                          ) : (
                            <span className="text-green-600">
                              Lower cost basis by ${Math.abs(difference).toFixed(2)} (higher future gains)
                            </span>
                          )}
                        </p>
                      </div>
                    )}

                    {/* Lots Detail (for lot-based) */}
                    {position.cost_basis_method === 'lot-based' && (
                      <details className="mb-4">
                        <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                          View {position.lots.length} lots
                        </summary>
                        <div className="mt-2 space-y-1">
                          {position.lots.map((lot) => (
                            <div
                              key={lot.lot_number}
                              className="flex justify-between text-xs text-gray-600 py-1 px-2 bg-gray-50 rounded"
                            >
                              <span>
                                Lot {lot.lot_number} • {lot.acquisition_date}
                              </span>
                              <span>
                                {lot.shares.toFixed(3)} shares @ ${lot.cost_per_share.toFixed(2)}
                              </span>
                              <span className="text-gray-500">{lot.capital_gain_impact}</span>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    {/* Action Button */}
                    <div className="flex gap-2">
                      {position.cost_basis_method === 'lot-based' ? (
                        <button
                          onClick={() => updateMethod(position.ticker, 'average-cost')}
                          disabled={updating === position.ticker}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                          {updating === position.ticker
                            ? 'Updating...'
                            : 'Switch to Average Cost (Gennemsnitsmetoden)'}
                        </button>
                      ) : (
                        <div className="text-sm text-gray-600 italic">
                          ✓ Using Gennemsnitsmetoden (cannot switch back)
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
