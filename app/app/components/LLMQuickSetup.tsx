'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { X, Eye, EyeOff, Sparkles, ExternalLink } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function LLMQuickSetup({ onClose, onSuccess }: Props) {
  const [anthropicKey, setAnthropicKey] = useState('');
  const [geminiKey, setGeminiKey] = useState('');
  const [preferredLlm, setPreferredLlm] = useState<'claude' | 'gemini'>('claude');
  const [showAnthropicKey, setShowAnthropicKey] = useState(false);
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSave = async () => {
    if (!anthropicKey && !geminiKey) {
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
        setTimeout(() => {
          onSuccess();
        }, 1000);
      } else {
        setMessage(`✗ ${data.error}`);
      }
    } catch (error) {
      setMessage(`✗ Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Side Panel */}
      <div className="fixed right-0 top-16 z-[45] h-[calc(100vh-4rem)] w-full max-w-md overflow-y-auto bg-background shadow-2xl transform transition-transform duration-300">
        <Card className="h-full rounded-none border-0">
          <CardHeader className="border-b bg-background sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  AI Setup Required
                </CardTitle>
                <CardDescription className="mt-2">
                  Configure your API keys to enable AI portfolio analysis
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
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

            {/* Info Box */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>💡 Quick Start:</strong> Add at least one API key to get AI-powered portfolio insights. You can get your keys from the links below.
              </p>
            </div>

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
              <div className="flex items-center justify-between">
                <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                <a
                  href="https://console.anthropic.com/settings/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  Get Key <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="relative mt-2">
                <Input
                  id="anthropic-key"
                  type={showAnthropicKey ? 'text' : 'password'}
                  value={anthropicKey}
                  onChange={(e) => setAnthropicKey(e.target.value)}
                  placeholder="sk-ant-..."
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
                Advanced reasoning and analysis
              </p>
            </div>

            {/* Gemini API Key */}
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="gemini-key">Gemini API Key</Label>
                <a
                  href="https://makersuite.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-blue-600 hover:underline dark:text-blue-400"
                >
                  Get Key <ExternalLink className="h-3 w-3" />
                </a>
              </div>
              <div className="relative mt-2">
                <Input
                  id="gemini-key"
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIza..."
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
                Fast and efficient analysis
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <Button onClick={handleSave} disabled={loading} className="flex-1">
                {loading ? 'Saving...' : 'Save & Continue'}
              </Button>
              <Button onClick={onClose} variant="outline">
                Skip
              </Button>
            </div>

            {/* Security Notice */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
              <p className="text-xs text-blue-800 dark:text-blue-300">
                <strong>🔒 Secure:</strong> Your API keys are encrypted using AES-256-GCM before being stored.
              </p>
            </div>

            {/* Full Settings Link */}
            <div className="text-center">
              <a
                href="/settings"
                className="text-sm text-muted-foreground hover:underline"
              >
                Go to full settings page →
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
