'use client';

import { useState, useEffect, useMemo } from 'react';
import { WizardFormData } from '../types';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';

interface Step7PProps {
  formData: WizardFormData;
  updateFormData: (data: Partial<WizardFormData>) => void;
}

interface SuggestedAmounts {
  amountOn7p: number;
  amountNotOn7p: number;
}

export default function Step7P({ formData, updateFormData }: Step7PProps) {
  const [suggestedUsd, setSuggestedUsd] = useState<SuggestedAmounts | null>(null);
  const [hasUserEdited, setHasUserEdited] = useState({
    amountOn7p: false,
    amountNotOn7p: false,
  });

  // Convert suggested amounts from USD to the user's selected currency
  const suggested = useMemo(() => {
    if (!suggestedUsd) return null;
    if (formData.currency === 'USD') {
      return suggestedUsd;
    }
    // Convert to DKK
    return {
      amountOn7p: Math.round(suggestedUsd.amountOn7p * formData.usdToDkkRate),
      amountNotOn7p: Math.round(suggestedUsd.amountNotOn7p * formData.usdToDkkRate),
    };
  }, [suggestedUsd, formData.currency, formData.usdToDkkRate]);

  useEffect(() => {
    // Fetch suggested amounts from imported data (values are in USD)
    const fetchSuggested = async () => {
      try {
        const response = await fetch('/api/grants-7p-summary');
        const data = await response.json();
        if (data.success && (data.data.amountOn7p > 0 || data.data.amountNotOn7p > 0)) {
          setSuggestedUsd(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch 7P suggestions:', error);
      }
    };
    fetchSuggested();
  }, []);

  const handleAmountOn7pChange = (value: number) => {
    setHasUserEdited(prev => ({ ...prev, amountOn7p: true }));
    updateFormData({ amountOn7p: value });
  };

  const handleAmountNotOn7pChange = (value: number) => {
    setHasUserEdited(prev => ({ ...prev, amountNotOn7p: true }));
    updateFormData({ amountNotOn7p: value });
  };

  const useSuggested = (field: 'amountOn7p' | 'amountNotOn7p') => {
    if (suggested) {
      updateFormData({ [field]: suggested[field] });
      setHasUserEdited(prev => ({ ...prev, [field]: true }));
    }
  };

  // Get placeholder text based on suggested values
  const getPlaceholder = (field: 'amountOn7p' | 'amountNotOn7p') => {
    if (suggested && suggested[field] > 0 && !hasUserEdited[field] && formData[field] === 0) {
      return `Suggested: ${suggested[field].toLocaleString()}`;
    }
    return '0.00';
  };

  return (
    <div className="space-y-6">
      {/* Info box about §7P */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
        <div className="flex gap-3">
          <Info className="h-5 w-5 flex-shrink-0 text-blue-600 dark:text-blue-400" />
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-blue-900 dark:text-blue-100">
              About Ligningslovens §7P
            </p>
            <p className="text-blue-800 dark:text-blue-200">
              §7P is a Danish tax rule that provides reduced taxation on employee shares and RSUs.
              Income reported under §7P typically receives a tax reduction based on an allowance calculated by KPMG.
            </p>
            <p className="text-blue-800 dark:text-blue-200">
              Your KPMG tax statement will show which RSU income qualifies for §7P treatment.
            </p>
          </div>
        </div>
      </div>

      {/* Suggestion notice */}
      {suggested && (suggested.amountOn7p > 0 || suggested.amountNotOn7p > 0) && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
          <div className="flex gap-3">
            <Info className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-400" />
            <div className="text-sm">
              <p className="font-semibold text-green-900 dark:text-green-100">
                Values detected from imported data
              </p>
              <p className="text-green-800 dark:text-green-200">
                Based on your imported shares, we&apos;ve calculated suggested values below. 
                Click &quot;Use suggested&quot; to apply them, or enter your own values.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Amount on §7P */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="amountOn7p">
            Amount Reported on §7P
          </Label>
          {suggested && suggested.amountOn7p > 0 && (
            <button
              type="button"
              onClick={() => useSuggested('amountOn7p')}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Use suggested: {formData.currency} {suggested.amountOn7p.toLocaleString()}
            </button>
          )}
        </div>
        <CurrencyInput
          id="amountOn7p"
          value={formData.amountOn7p}
          onChange={handleAmountOn7pChange}
          currency={formData.currency}
          placeholder={getPlaceholder('amountOn7p')}
        />
        <p className="text-sm text-muted-foreground">
          RSU income that qualifies for §7P treatment (as reported by KPMG)
        </p>
      </div>

      {/* Amount NOT on §7P */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="amountNotOn7p">
            Amount NOT Reported on §7P
          </Label>
          {suggested && suggested.amountNotOn7p > 0 && (
            <button
              type="button"
              onClick={() => useSuggested('amountNotOn7p')}
              className="text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Use suggested: {formData.currency} {suggested.amountNotOn7p.toLocaleString()}
            </button>
          )}
        </div>
        <CurrencyInput
          id="amountNotOn7p"
          value={formData.amountNotOn7p}
          onChange={handleAmountNotOn7pChange}
          currency={formData.currency}
          placeholder={getPlaceholder('amountNotOn7p')}
        />
        <p className="text-sm text-muted-foreground">
          RSU income taxed as regular salary income (not under §7P)
        </p>
      </div>

      {/* Total RSU Income Summary */}
      <div className="rounded-lg bg-muted p-4">
        <div className="space-y-2">
          <p className="text-sm font-medium">RSU Income Summary</p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">On §7P:</p>
              <p className="font-semibold">
                {formData.currency} {(formData.amountOn7p || 0).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">Not on §7P:</p>
              <p className="font-semibold">
                {formData.currency} {(formData.amountNotOn7p || 0).toLocaleString()}
              </p>
            </div>
            <div className="col-span-2 border-t border-border pt-2">
              <p className="text-muted-foreground">Total RSU Income:</p>
              <p className="text-lg font-bold">
                {formData.currency} {((formData.amountOn7p || 0) + (formData.amountNotOn7p || 0)).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Where to find this information */}
      <div className="rounded-lg border border-border p-4">
        <p className="mb-2 text-sm font-medium">Where to find this information:</p>
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>Check your annual KPMG tax statement (Årsopgørelse)</li>
          <li>Look for "Ligningslovens §7P" section</li>
          <li>Microsoft typically provides this breakdown in your compensation summary</li>
        </ul>
      </div>
    </div>
  );
}
