'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2 } from 'lucide-react';
import { useNotificationsStore } from '@/lib/stores/notifications-store';
import { toast } from 'sonner';
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

  const playErrorSound = () => {
    try {
      // Create a simple error beep sound using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 400; // Error tone frequency
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const playSuccessSound = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Success tone frequency
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);

      // Play a second higher note for success
      setTimeout(() => {
        const osc2 = audioContext.createOscillator();
        const gain2 = audioContext.createGain();
        osc2.connect(gain2);
        gain2.connect(audioContext.destination);
        osc2.frequency.value = 1000;
        osc2.type = 'sine';
        gain2.gain.setValueAtTime(0.2, audioContext.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
        osc2.start(audioContext.currentTime);
        osc2.stop(audioContext.currentTime + 0.2);
      }, 100);
    } catch (error) {
      console.error('Error playing sound:', error);
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

        // Show success toast
        toast.success('Analysis Complete!', {
          description: 'Your portfolio analysis is ready. Check the notifications bell.',
          duration: 5000,
        });

        // Play success sound
        playSuccessSound();

        // Refresh notifications
        await fetchNotifications();

        // Clear message after 5 seconds
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage(`✗ ${data.error}`);

        // Show error toast with more details
        toast.error(`Analysis Failed`, {
          description: data.error,
          duration: 7000,
          action: data.errorType === 'auth' || data.errorType === 'credits' ? {
            label: 'Go to Settings',
            onClick: () => window.location.href = '/settings',
          } : undefined,
        });

        // Play error sound
        playErrorSound();
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      setMessage(`✗ Error: ${errorMessage}`);

      // Show error toast
      toast.error('Connection Error', {
        description: 'Failed to connect to the server. Please try again.',
        duration: 7000,
      });

      // Play error sound
      playErrorSound();
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
