'use client';

import { useEffect, useRef } from 'react';
import { WizardFormData } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';

interface StepAllowanceProps {
  formData: WizardFormData;
  updateFormData: (data: Partial<WizardFormData>) => void;
}

export default function StepAllowance({ formData, updateFormData }: StepAllowanceProps) {
  const currencyLabel = formData.currency === 'USD' ? '(USD)' : '(DKK)';
  const hasSetDefaultRef = useRef(false);

  // Calculate suggested allowance as 20% of yearly salary
  const suggestedAllowance = Math.round((formData.yearlySalary || 0) * 0.20);

  // Automatically set the allowance to 20% of salary when component loads
  useEffect(() => {
    if (!hasSetDefaultRef.current && formData.yearlySalary > 0 && formData.microsoftAllowance7p === 0) {
      updateFormData({ microsoftAllowance7p: suggestedAllowance });
      hasSetDefaultRef.current = true;
    }
  }, [formData.yearlySalary, formData.microsoftAllowance7p, suggestedAllowance, updateFormData]);

  const applySuggestedAllowance = () => {
    updateFormData({ microsoftAllowance7p: suggestedAllowance });
  };

  return (
    <div className="space-y-6">
      {/* Info about Microsoft/KPMG Allowance */}
      <div className="rounded-lg bg-muted p-4">
        <p className="mb-2 text-sm font-semibold">About the §7P Allowance</p>
        <p className="text-sm text-muted-foreground">
          KPMG calculates a tax allowance for income reported under §7P. This allowance reduces
          the taxable amount, providing tax savings. The exact allowance is calculated by KPMG
          and should be on your tax statement.
        </p>
      </div>

      {/* Microsoft Allowance Input */}
      <div className="space-y-2">
        <Label htmlFor="microsoftAllowance7p">
          §7P Tax Allowance {currencyLabel}
        </Label>
        <div className="flex gap-2">
          <Input
            id="microsoftAllowance7p"
            type="number"
            step="0.01"
            value={formData.microsoftAllowance7p || ''}
            onChange={(e) => updateFormData({ microsoftAllowance7p: parseFloat(e.target.value) || 0 })}
            placeholder="0.00"
            className="flex-1"
          />
          <Button
            type="button"
            variant="outline"
            onClick={applySuggestedAllowance}
            disabled={!formData.yearlySalary}
          >
            <Calculator className="mr-2 h-4 w-4" />
            Estimate
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Enter the exact allowance from your KPMG statement, or click "Estimate" for an approximation (20% of salary)
        </p>
      </div>

      {/* Allowance Breakdown */}
      {formData.amountOn7p > 0 && (
        <div className="rounded-lg border border-border p-4">
          <p className="mb-3 text-sm font-medium">§7P Tax Benefit Calculation</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Income on §7P:</span>
              <span className="font-semibold">
                {formData.currency} {(formData.amountOn7p || 0).toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">§7P Allowance:</span>
              <span className="font-semibold">
                {formData.currency} {(formData.microsoftAllowance7p || 0).toLocaleString()}
              </span>
            </div>
            <div className="border-t border-border pt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxable §7P Amount:</span>
                <span className="text-lg font-bold">
                  {formData.currency}{' '}
                  {Math.max(0, (formData.amountOn7p || 0) - (formData.microsoftAllowance7p || 0)).toLocaleString()}
                </span>
              </div>
            </div>
            {formData.microsoftAllowance7p > 0 && (
              <div className="rounded bg-green-50 p-2 dark:bg-green-950">
                <p className="text-xs text-green-800 dark:text-green-200">
                  Tax benefit: You'll pay taxes on{' '}
                  {formData.currency}{' '}
                  {((formData.microsoftAllowance7p || 0)).toLocaleString()} less income
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Suggested Allowance Info */}
      {formData.yearlySalary > 0 && suggestedAllowance !== formData.microsoftAllowance7p && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Estimated allowance:</strong> {formData.currency} {suggestedAllowance.toLocaleString()}{' '}
            (20% of yearly salary)
          </p>
          <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">
            This is just an estimate. Always use the exact value from your KPMG tax statement for accurate calculations.
          </p>
        </div>
      )}

      {/* Where to find this information */}
      <div className="rounded-lg border border-border p-4">
        <p className="mb-2 text-sm font-medium">Where to find your exact allowance:</p>
        <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
          <li>Your annual KPMG tax calculation document</li>
          <li>Look for "§7P fradrag" or "§7P allowance"</li>
          <li>Contact KPMG if you're unsure about the amount</li>
        </ul>
      </div>
    </div>
  );
}
