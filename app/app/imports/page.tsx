'use client';

import { useState, useEffect } from 'react';
import { useCurrencyStore } from '@/lib/stores/currency-store';
import { formatCurrency } from '@/lib/currency';

interface StockGrant {
  id: number;
  ticker: string;
  acquisition_date: string;
  lot_number: number;
  capital_gain_impact: string;
  adjusted_gain_loss: number;
  adjusted_cost_basis: number;
  adjusted_cost_basis_per_share: number;
  total_shares: number;
  current_price_per_share: number;
  current_value: number;
  import_date: string;
}

export default function ImportsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [grants, setGrants] = useState<StockGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const { currency, exchangeRate } = useCurrencyStore();

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

  useEffect(() => {
    fetchGrants();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setMessage('Please select a file');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Check if it's a PDF or Excel file
      const isPDF = file.name.toLowerCase().endsWith('.pdf');
      const endpoint = isPDF ? '/api/import-pdf' : '/api/import';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`Success! Imported ${data.count} records`);
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
        // Refresh grants list
        await fetchGrants();
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleClearData = async () => {
    if (!confirm('Are you sure you want to delete all imported data?')) {
      return;
    }

    try {
      const response = await fetch('/api/grants', { method: 'DELETE' });
      const data = await response.json();

      if (data.success) {
        setMessage('All data cleared');
        await fetchGrants();
      }
    } catch (error) {
      setMessage(`Error: ${(error as Error).message}`);
    }
  };

  const formatCurrencyValue = (value: number) => {
    return formatCurrency(value, currency, exchangeRate);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Import Stock Grants
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Upload your Morgan Stanley PDF statement or Excel file to import RSU data
          </p>
        </div>

        {/* Upload Form */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label
                htmlFor="file-input"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Select Excel File
              </label>
              <input
                id="file-input"
                type="file"
                accept=".xlsx,.xls,.pdf"
                onChange={handleFileChange}
                className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400"
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={!file || uploading}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {uploading ? 'Uploading...' : 'Upload & Import'}
              </button>

              {grants.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearData}
                  className="rounded-lg border border-red-600 px-5 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 focus:outline-none focus:ring-4 focus:ring-red-300 dark:border-red-500 dark:text-red-500 dark:hover:bg-gray-700"
                >
                  Clear All Data
                </button>
              )}
            </div>

            {message && (
              <div
                className={`rounded-lg p-4 ${
                  message.startsWith('Success')
                    ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                {message}
              </div>
            )}
          </form>
        </div>

        {/* Data Table */}
        <div className="rounded-2xl bg-white shadow-lg dark:bg-gray-800">
          <div className="border-b border-gray-200 p-6 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Imported Data
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {grants.length} records
            </p>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                Loading...
              </div>
            ) : grants.length === 0 ? (
              <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                No data imported yet. Upload an Excel file to get started.
              </div>
            ) : (
              <table className="w-full text-left text-sm text-gray-700 dark:text-gray-300">
                <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th className="px-6 py-3">Ticker</th>
                    <th className="px-6 py-3">Acquisition Date</th>
                    <th className="px-6 py-3">Lot</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Shares</th>
                    <th className="px-6 py-3">Cost Basis</th>
                    <th className="px-6 py-3">Current Price</th>
                    <th className="px-6 py-3">Current Value</th>
                    <th className="px-6 py-3">Gain/Loss</th>
                  </tr>
                </thead>
                <tbody>
                  {grants.map((grant) => (
                    <tr
                      key={grant.id}
                      className="border-b bg-white hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 font-medium">{grant.ticker}</td>
                      <td className="px-6 py-4">
                        {formatDate(grant.acquisition_date)}
                      </td>
                      <td className="px-6 py-4">{grant.lot_number}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`rounded px-2 py-1 text-xs font-medium ${
                            grant.capital_gain_impact === 'Long Term'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}
                        >
                          {grant.capital_gain_impact}
                        </span>
                      </td>
                      <td className="px-6 py-4">{grant.total_shares.toFixed(3)}</td>
                      <td className="px-6 py-4">
                        {formatCurrencyValue(grant.adjusted_cost_basis)}
                      </td>
                      <td className="px-6 py-4">
                        {formatCurrencyValue(grant.current_price_per_share)}
                      </td>
                      <td className="px-6 py-4">
                        {formatCurrencyValue(grant.current_value)}
                      </td>
                      <td
                        className={`px-6 py-4 font-medium ${
                          grant.adjusted_gain_loss >= 0
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-red-600 dark:text-red-400'
                        }`}
                      >
                        {formatCurrencyValue(grant.adjusted_gain_loss)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
