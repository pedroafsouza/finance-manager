'use client';

import { useState, useEffect } from 'react';
import { useCurrencyStore } from '@/lib/stores/currency-store';
import { formatCurrency } from '@/lib/currency';
import Spinner from '../components/Spinner';

type BrokerageType = 'morgan-stanley' | 'fidelity' | null;
type WizardStep = 1 | 2 | 3;

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
  const [showWizard, setShowWizard] = useState(false);
  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [brokerage, setBrokerage] = useState<BrokerageType>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fidelityCurrentFile, setFidelityCurrentFile] = useState<File | null>(null);
  const [fidelityPreviousFile, setFidelityPreviousFile] = useState<File | null>(null);
  const [showMissingFilePrompt, setShowMissingFilePrompt] = useState(false);
  const [ticker, setTicker] = useState('');
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [grants, setGrants] = useState<StockGrant[]>([]);
  const [loading, setLoading] = useState(true);
  const { currency, exchangeRate } = useCurrencyStore();

  const resetWizard = () => {
    setShowWizard(false);
    setWizardStep(1);
    setBrokerage(null);
    setFile(null);
    setFidelityCurrentFile(null);
    setFidelityPreviousFile(null);
    setTicker('');
    setShowMissingFilePrompt(false);
  };

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

  const handleFidelityCurrentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFidelityCurrentFile(e.target.files[0]);
      setMessage('');
      setShowMissingFilePrompt(false);
    }
  };

  const handleFidelityPreviousFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFidelityPreviousFile(e.target.files[0]);
      setMessage('');
      setShowMissingFilePrompt(false);
    }
  };

  const handleSelectBrokerage = (selected: BrokerageType) => {
    setBrokerage(selected);
    setWizardStep(2);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (brokerage === 'fidelity') {
      if ((fidelityCurrentFile && !fidelityPreviousFile) || (!fidelityCurrentFile && fidelityPreviousFile)) {
        if (!showMissingFilePrompt) {
          setShowMissingFilePrompt(true);
          return;
        }
      }

      if (!fidelityCurrentFile && !fidelityPreviousFile) {
        setMessage('Please select at least one CSV file');
        return;
      }

      setUploading(true);
      setMessage('');
      setShowMissingFilePrompt(false);

      try {
        const formData = new FormData();
        if (fidelityCurrentFile) formData.append('currentFile', fidelityCurrentFile);
        if (fidelityPreviousFile) formData.append('previousFile', fidelityPreviousFile);
        if (ticker) formData.append('ticker', ticker);

        const response = await fetch('/api/import-fidelity', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          setMessage(`Success! Imported ${data.currentHoldings || 0} current holdings and ${data.previousHoldings || 0} sold positions`);
          setWizardStep(3);
          await fetchGrants();
        } else {
          setMessage(`Error: ${data.error}`);
        }
      } catch (error) {
        setMessage(`Error: ${(error as Error).message}`);
      } finally {
        setUploading(false);
      }
      return;
    }

    // Morgan Stanley flow
    if (!file) {
      setMessage('Please select a file');
      return;
    }

    setUploading(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const isPDF = file.name.toLowerCase().endsWith('.pdf');
      const endpoint = isPDF ? '/api/import-pdf' : '/api/import';

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`Success! Imported ${data.count || data.holdings || 0} records`);
        setWizardStep(3);
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

  const stepLabels = ['Select Brokerage', 'Upload Files', 'Complete'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Import Stock Grants
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Upload your brokerage statement to import stock holdings
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-8 rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
          <div className="flex gap-4">
            <button
              onClick={() => setShowWizard(true)}
              className="flex-1 rounded-lg border-2 border-blue-600 bg-blue-600 p-4 text-center text-white hover:bg-blue-700 hover:border-blue-700"
            >
              <div className="text-lg font-semibold">Import Data</div>
              <div className="text-sm text-blue-100">Upload brokerage statements</div>
            </button>
            <button
              onClick={handleClearData}
              className="flex-1 rounded-lg border-2 border-red-600 p-4 text-center text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <div className="text-lg font-semibold">Clear All Data</div>
              <div className="text-sm opacity-75">Delete all imported records</div>
            </button>
          </div>
          {message && !showWizard && (
            <div
              className={`mt-4 rounded-lg p-4 ${
                message.startsWith('Success') || message === 'All data cleared'
                  ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200'
                  : 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}
            >
              {message}
            </div>
          )}
        </div>

        {/* Import Wizard Modal */}
        {showWizard && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => wizardStep !== 3 && resetWizard()}
            />
            
            {/* Modal */}
            <div className="relative z-10 w-full max-w-2xl mx-4 rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
              {/* Close button */}
              <button
                onClick={resetWizard}
                className="absolute right-4 top-4 rounded-lg border border-gray-300 p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Step Indicator */}
              <div className="mb-8 mt-2">
                <div className="flex items-center justify-between">
                  {stepLabels.map((label, index) => {
                    const stepNum = (index + 1) as WizardStep;
                    const isActive = wizardStep === stepNum;
                    const isCompleted = wizardStep > stepNum;
                    return (
                      <div key={label} className="flex flex-1 items-center">
                        <div className="flex flex-col items-center">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold ${
                              isCompleted
                                ? 'bg-green-500 text-white'
                                : isActive
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                            }`}
                          >
                            {isCompleted ? '✓' : stepNum}
                          </div>
                          <span
                            className={`mt-2 text-xs font-medium ${
                              isActive
                                ? 'text-blue-600 dark:text-blue-400'
                                : 'text-gray-500 dark:text-gray-400'
                            }`}
                          >
                            {label}
                          </span>
                        </div>
                        {index < stepLabels.length - 1 && (
                          <div
                            className={`mx-4 h-1 flex-1 rounded ${
                              wizardStep > stepNum
                                ? 'bg-green-500'
                                : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            {/* Step 1: Select Brokerage */}
            {wizardStep === 1 && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Which brokerage are you importing from?
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <button
                    onClick={() => handleSelectBrokerage('morgan-stanley')}
                    className="rounded-lg border-2 border-gray-200 p-6 text-left hover:border-blue-500 hover:bg-blue-50 dark:border-gray-600 dark:hover:border-blue-400 dark:hover:bg-gray-700"
                  >
                    <div className="text-xl font-semibold text-gray-900 dark:text-white">Morgan Stanley</div>
                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">PDF or Excel statement</div>
                  </button>
                  <button
                    onClick={() => handleSelectBrokerage('fidelity')}
                    className="rounded-lg border-2 border-gray-200 p-6 text-left hover:border-blue-500 hover:bg-blue-50 dark:border-gray-600 dark:hover:border-blue-400 dark:hover:bg-gray-700"
                  >
                    <div className="text-xl font-semibold text-gray-900 dark:text-white">Fidelity</div>
                    <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">CSV export files</div>
                  </button>
                </div>
                <div className="pt-4">
                  <button
                    onClick={resetWizard}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Upload Files - Morgan Stanley */}
            {wizardStep === 2 && brokerage === 'morgan-stanley' && (
              <form onSubmit={handleUpload} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Upload Morgan Stanley Statement
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Select your PDF or Excel file from Morgan Stanley
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="file-input"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Statement File
                  </label>
                  <input
                    id="file-input"
                    type="file"
                    accept=".xlsx,.xls,.pdf"
                    onChange={handleFileChange}
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                  {file && (
                    <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                      ✓ {file.name}
                    </p>
                  )}
                </div>

                {message && (
                  <div className={`rounded-lg p-4 ${
                    message.startsWith('Success')
                      ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {message}
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => { setWizardStep(1); setBrokerage(null); setFile(null); setMessage(''); }}
                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={!file || uploading}
                    className="rounded-lg border border-blue-600 bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 hover:border-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploading ? 'Importing...' : 'Import'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Upload Files - Fidelity */}
            {wizardStep === 2 && brokerage === 'fidelity' && (
              <form onSubmit={handleUpload} className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Upload Fidelity CSV Files
                  </h3>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    Upload your currently held and/or previously held shares CSV exports
                  </p>
                </div>

                <div>
                  <label
                    htmlFor="ticker-input"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Stock Ticker Symbol
                  </label>
                  <input
                    id="ticker-input"
                    type="text"
                    value={ticker}
                    onChange={(e) => setTicker(e.target.value.toUpperCase())}
                    placeholder="e.g., AAPL, MSFT"
                    className="block w-full max-w-xs rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="fidelity-current-input"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Currently Held Shares (CSV)
                    </label>
                    <input
                      id="fidelity-current-input"
                      type="file"
                      accept=".csv"
                      onChange={handleFidelityCurrentFileChange}
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    {fidelityCurrentFile && (
                      <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                        ✓ {fidelityCurrentFile.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="fidelity-previous-input"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Previously Held Shares (CSV)
                    </label>
                    <input
                      id="fidelity-previous-input"
                      type="file"
                      accept=".csv"
                      onChange={handleFidelityPreviousFileChange}
                      className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    {fidelityPreviousFile && (
                      <p className="mt-2 text-sm text-green-600 dark:text-green-400">
                        ✓ {fidelityPreviousFile.name}
                      </p>
                    )}
                  </div>
                </div>

                {showMissingFilePrompt && (
                  <div className="rounded-lg border border-yellow-300 bg-yellow-50 p-4 dark:border-yellow-600 dark:bg-yellow-900/30">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      {fidelityCurrentFile && !fidelityPreviousFile
                        ? 'You only selected currently held shares. Would you also like to include previously held shares?'
                        : 'You only selected previously held shares. Would you also like to include currently held shares?'}
                    </p>
                    <div className="mt-3 flex gap-3">
                      <button
                        type="submit"
                        className="rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700"
                      >
                        Continue without it
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowMissingFilePrompt(false)}
                        className="rounded-lg border border-yellow-600 px-4 py-2 text-sm font-medium text-yellow-600 hover:bg-yellow-100 dark:text-yellow-400 dark:hover:bg-yellow-900/50"
                      >
                        Add the file
                      </button>
                    </div>
                  </div>
                )}

                {message && (
                  <div className={`rounded-lg p-4 ${
                    message.startsWith('Success')
                      ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200'
                  }`}>
                    {message}
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={() => { 
                      setWizardStep(1); 
                      setBrokerage(null); 
                      setFidelityCurrentFile(null);
                      setFidelityPreviousFile(null);
                      setTicker('');
                      setMessage('');
                      setShowMissingFilePrompt(false);
                    }}
                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={(!fidelityCurrentFile && !fidelityPreviousFile) || uploading}
                    className="rounded-lg border border-blue-600 bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 hover:border-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {uploading ? 'Importing...' : 'Import'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Complete */}
            {wizardStep === 3 && (
              <div className="space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400">
                    <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Import Complete!
                  </h3>
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    {message}
                  </p>
                </div>
                <div className="pt-4">
                  <button
                    onClick={resetWizard}
                    className="rounded-lg border border-blue-600 bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 hover:border-blue-700"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        )}

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
              <div className="flex justify-center p-8">
                <Spinner size={32} />
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
