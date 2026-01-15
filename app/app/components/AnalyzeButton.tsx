'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { useNotificationsStore } from '@/lib/stores/notifications-store';
import LLMQuickSetup from './LLMQuickSetup';

export default function AnalyzeButton() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showSetup, setShowSetup] = useState(false);
  const [hasApiKeys, setHasApiKeys] = useState<boolean | null>(null);
  const { fetchNotifications } = useNotificationsStore();

  useEffect(() => {
    checkApiKeys();
  }, []);

  const checkApiKeys = async () => {
    try {
      const response = await fetch('/api/llm/settings');
      const data = await response.json();

      if (data.success && data.data) {
        setHasApiKeys(data.data.has_anthropic_key || data.data.has_gemini_key);
      } else {
        setHasApiKeys(false);
      }
    } catch (error) {
      console.error('Error checking API keys:', error);
      setHasApiKeys(false);
    }
  };

  const handleAnalyze = async () => {
    // Check if API keys are configured first
    if (hasApiKeys === false) {
      setShowSetup(true);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/llm/analyze', {
        method: 'POST',
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✓ Analysis complete! Check notifications.');
        // Refresh notifications
        await fetchNotifications();

        // Clear message after 5 seconds
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage(`✗ ${data.error}`);
      }
    } catch (error) {
      setMessage(`✗ Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupSuccess = () => {
    setHasApiKeys(true);
    setShowSetup(false);
    setMessage('✓ API keys configured! You can now analyze your portfolio.');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <>
      <div>
        <Button
          onClick={handleAnalyze}
          disabled={loading || hasApiKeys === null}
          className="flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Analyze Portfolio
            </>
          )}
        </Button>

        {message && (
          <p
            className={`mt-2 text-sm ${
              message.startsWith('✓') ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
            }`}
          >
            {message}
          </p>
        )}
      </div>

      {/* Setup Panel */}
      {showSetup && (
        <LLMQuickSetup
          onClose={() => setShowSetup(false)}
          onSuccess={handleSetupSuccess}
        />
      )}
    </>
  );
}
