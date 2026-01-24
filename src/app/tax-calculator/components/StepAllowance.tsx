'use client';

import { WizardFormData } from '../types';
import { CheckCircle2 } from 'lucide-react';

interface StepAllowanceProps {
  formData: WizardFormData;
  updateFormData: (data: Partial<WizardFormData>) => void;
}

export default function StepAllowance({ formData, updateFormData }: StepAllowanceProps) {
  const currencyLabel = formData.currency === 'USD' ? 'USD' : 'DKK';

  // Calculate automatic allowance as 20% of yearly salary
  const autoAllowance = Math.round((formData.yearlySalary || 0) * 0.20);

  return (
    <div className="space-y-6">
      {/* Auto-calculation notice */}
      <div className="rounded-lg bg-green-50 border border-green-200 p-6 dark:bg-green-950 dark:border-green-800">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-semibold text-green-900 dark:text-green-100 mb-2">
              §7P Allowance Automatically Calculated
            </p>
            <p className="text-sm text-green-800 dark:text-green-200">
              The system automatically calculates your §7P tax allowance as <strong>20% of your yearly salary</strong>.
              This is the standard calculation used by KPMG and Danish tax authorities.
            </p>
          </div>
        </div>
      </div>

      {/* Calculated Allowance Display */}
      <div className="rounded-lg border border-border p-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">Your §7P Allowance</p>
          <p className="text-4xl font-bold text-primary mb-1">
            {autoAllowance.toLocaleString()} {currencyLabel}
          </p>
          <p className="text-sm text-muted-foreground">
            = {formData.yearlySalary?.toLocaleString() || 0} {currencyLabel} × 20%
          </p>
        </div>
      </div>

      {/* Allowance Breakdown */}
      {formData.amountOn7p > 0 && (
        <div className="rounded-lg border border-border p-4">
          <p className="mb-3 text-sm font-medium">§7P Tax Benefit Calculation</p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Income on §7P:</span>
              <span className="font-semibold">
                {(formData.amountOn7p || 0).toLocaleString()} {currencyLabel}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">§7P Allowance (automatic):</span>
              <span className="font-semibold text-green-600 dark:text-green-400">
                {autoAllowance.toLocaleString()} {currencyLabel}
              </span>
            </div>
            <div className="border-t border-border pt-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Taxable §7P Amount:</span>
                <span className="text-lg font-bold">
                  {Math.max(0, (formData.amountOn7p || 0) - autoAllowance).toLocaleString()} {currencyLabel}
                </span>
              </div>
            </div>
            {autoAllowance > 0 && (
              <div className="rounded bg-green-50 p-3 dark:bg-green-950 mt-3">
                <p className="text-sm text-green-800 dark:text-green-200">
                  <strong>✓ Tax Savings:</strong> You'll pay taxes on{' '}
                  <strong>{autoAllowance.toLocaleString()} {currencyLabel}</strong> less income thanks to the §7P allowance.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Information section */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-950">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          About §7P Allowance
        </p>
        <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-200">
          <li>• Automatically calculated as 20% of your yearly base salary</li>
          <li>• Reduces the taxable amount of RSU income reported under §7P</li>
          <li>• Standard calculation used by KPMG and Danish tax authorities</li>
          <li>• Applied before calculating AM-bidrag and income taxes</li>
        </ul>
      </div>

      {/* Note about KPMG statement */}
      <div className="rounded-lg border border-border p-4">
        <p className="text-sm font-medium mb-2">KPMG Tax Statement</p>
        <p className="text-sm text-muted-foreground">
          Your KPMG annual tax statement will show this allowance amount. It may vary slightly based on
          specific deductions, but 20% of salary is the standard calculation for Microsoft employees in Denmark.
        </p>
      </div>
    </div>
  );
}
