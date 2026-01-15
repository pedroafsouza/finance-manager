'use client';

import { useState } from 'react';
import LLMSettingsForm from './components/LLMSettingsForm';

export default function SettingsPage() {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleClearRecords = async () => {
    if (!confirm('⚠️ Are you sure you want to delete ALL imported records?\n\nThis will:\n- Delete all stock grant records from the database\n- Keep the database file\n- This action cannot be undone')) {
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/clear-all', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✓ Success! Deleted ${data.recordsDeleted} records. Database has been cleared but the file remains.`);
      } else {
        setMessage(`✗ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`✗ Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDatabase = async () => {
    if (!confirm('🚨 DANGER: Delete database files?\n\nThis will:\n- DELETE the entire database file\n- REMOVE all data permanently\n- Reinitialize an empty database\n\nThis action CANNOT be undone!\n\nAre you absolutely sure?')) {
      return;
    }

    // Double confirmation for destructive action
    const confirmText = prompt('Type "DELETE" to confirm you want to permanently delete the database:');
    if (confirmText !== 'DELETE') {
      setMessage('✗ Deletion cancelled - confirmation text did not match');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/clear-all', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessage(`✓ Success! Deleted files: ${data.filesDeleted.join(', ')}. A fresh database has been initialized.`);
      } else {
        setMessage(`✗ Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`✗ Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Clear browser cache and reload?\n\nThis will reload the page and clear local browser data.')) {
      return;
    }

    // Clear localStorage if any
    localStorage.clear();

    // Reload page
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8 dark:from-gray-900 dark:to-gray-800">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Settings & Data Management
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Manage your imported data and application settings
          </p>
        </div>

        {/* Message Display */}
        {message && (
          <div
            className={`mb-6 rounded-lg p-4 ${
              message.startsWith('✓')
                ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200'
                : 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
          >
            {message}
          </div>
        )}

        {/* LLM Integration Section */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            AI Analysis Settings
          </h2>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            Configure Claude or Gemini AI to provide portfolio insights and recommendations.
          </p>

          <LLMSettingsForm />
        </div>

        {/* Data Management Section */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            Data Management
          </h2>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            Manage your imported stock grant data. Use these options carefully as some actions cannot be undone.
          </p>

          <div className="space-y-4">
            {/* Clear Records Button */}
            <div className="flex items-start justify-between rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-900/20">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Clear All Records
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Delete all imported stock grant records from the database. The database structure remains intact.
                </p>
                <p className="mt-2 text-xs text-yellow-800 dark:text-yellow-300">
                  ⚠️ This action cannot be undone
                </p>
              </div>
              <button
                onClick={handleClearRecords}
                disabled={loading}
                className="ml-4 rounded-lg bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-4 focus:ring-yellow-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Clearing...' : 'Clear Records'}
              </button>
            </div>

            {/* Delete Database Button */}
            <div className="flex items-start justify-between rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Delete Database Files
                </h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Permanently delete the entire database file and all associated files. A fresh database will be created.
                </p>
                <p className="mt-2 text-xs text-red-800 dark:text-red-300">
                  🚨 DANGER: This permanently deletes all data and cannot be undone
                </p>
              </div>
              <button
                onClick={handleDeleteDatabase}
                disabled={loading}
                className="ml-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Deleting...' : 'Delete Database'}
              </button>
            </div>
          </div>
        </div>

        {/* Cache Management Section */}
        <div className="mb-6 rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            Cache Management
          </h2>
          <p className="mb-6 text-sm text-gray-600 dark:text-gray-400">
            Clear browser cache and local storage if you're experiencing issues.
          </p>

          <div className="flex items-start justify-between rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Clear Browser Cache
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Clear local browser data and reload the page. This won't affect your imported data.
              </p>
            </div>
            <button
              onClick={handleClearCache}
              className="ml-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300"
            >
              Clear Cache
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-800">
          <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            Database Information
          </h2>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <p>
              <span className="font-medium text-gray-900 dark:text-white">Location:</span>{' '}
              <code className="rounded bg-gray-100 px-2 py-1 dark:bg-gray-700">
                app/data/finance.db
              </code>
            </p>
            <p>
              <span className="font-medium text-gray-900 dark:text-white">Type:</span> SQLite
            </p>
            <p>
              <span className="font-medium text-gray-900 dark:text-white">Git Status:</span> Ignored (not committed to repository)
            </p>
            <p className="mt-4 text-xs">
              💡 <strong>Tip:</strong> Your database is automatically excluded from git commits, so your personal data stays private.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
