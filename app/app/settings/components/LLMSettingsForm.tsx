'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Sparkles } from 'lucide-react';

export default function LLMSettingsForm() {
  const [anthropicKey, setAnthropicKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [preferredLlm, setPreferredLlm] = useState<'claude' | 'gemini'>('claude');
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [hasAnthropicKey, setHasAnthropicKey] = useState(false);
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/llm/settings');
      const data = await response.json();

      if (data.success && data.data) {
        setPreferredLlm(data.data.preferred_llm);
        setHasAnthropicKey(data.data.has_anthropic_key);
        setHasGeminiKey(data.data.has_gemini_key);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async () => {
    if (!anthropicKey && !geminiKey && !hasAnthropicKey && !hasGeminiKey) {
      setMessage('✗ Please enter at least one API key');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/llm/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          anthropicApiKey: anthropicKey || undefined,
          geminiApiKey: geminiKey || undefined,
          preferredLlm,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage('✓ Settings saved successfully');
        setAnthropicKey('');
        setGeminiKey('');
        await fetchSettings();
      } else {
        setMessage(`✗ ${data.error}`);
      }
    } catch (error) {
      setMessage(`✗ Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Remove all API keys? You will need to re-enter them to use AI analysis.')) {
      return;
    }

    setLoading(true);
    try {
      await fetch('/api/llm/settings', { method: 'DELETE' });
      setMessage('✓ API keys removed');
      setHasAnthropicKey(false);
      setHasGeminiKey(false);
    } catch (error) {
      setMessage(`✗ Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Message */}
      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.startsWith('✓')
              ? 'bg-green-50 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-50 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {message}
        </div>
      )}

      {/* Preferred LLM */}
      <div>
        <Label>Preferred AI Provider</Label>
        <Select value={preferredLlm} onValueChange={(v) => setPreferredLlm(v as 'claude' | 'gemini')}>
          <SelectTrigger className="mt-2">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="claude">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Claude (Anthropic)</span>
              </div>
            </SelectItem>
            <SelectItem value="gemini">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span>Gemini (Google)</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
        <p className="mt-1 text-xs text-muted-foreground">
          Choose which AI to use when both are configured
        </p>
      </div>

      {/* Anthropic API Key */}
      <div>
        <Label htmlFor="anthropic-key">
          Anthropic API Key {hasAnthropicKey && '(Configured ✓)'}
        </Label>
        <div className="relative mt-2">
          <Input
            id="anthropic-key"
            type={showAnthropicKey ? 'text' : 'password'}
            value={anthropicKey}
            onChange={(e) => setAnthropicKey(e.target.value)}
            placeholder={hasAnthropicKey ? '••••••••••••••••' : 'sk-ant-...'}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowAnthropicKey(!showAnthropicKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showAnthropicKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Get your API key from{' '}
          <a
            href="https://console.anthropic.com/settings/keys"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            console.anthropic.com
          </a>
        </p>
      </div>

      {/* Gemini API Key */}
      <div>
        <Label htmlFor="gemini-key">
          Gemini API Key {hasGeminiKey && '(Configured ✓)'}
        </Label>
        <div className="relative mt-2">
          <Input
            id="gemini-key"
            type={showGeminiKey ? 'text' : 'password'}
            value={geminiKey}
            onChange={(e) => setGeminiKey(e.target.value)}
            placeholder={hasGeminiKey ? '••••••••••••••••' : 'AIza...'}
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowGeminiKey(!showGeminiKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
          >
            {showGeminiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Get your API key from{' '}
          <a
            href="https://makersuite.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            makersuite.google.com
          </a>
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-4">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : 'Save Settings'}
        </Button>
        {(hasAnthropicKey || hasGeminiKey) && (
          <Button onClick={handleRemove} variant="outline" disabled={loading}>
            Remove Keys
          </Button>
        )}
      </div>

      {/* Storage Notice */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>🔒 Storage:</strong> Your API keys are stored in plain text in a separate database file for easy management. They are never logged or transmitted to third parties.
        </p>
      </div>
    </div>
  );
}
