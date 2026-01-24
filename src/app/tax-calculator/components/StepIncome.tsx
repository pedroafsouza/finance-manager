'use client';

import { WizardFormData } from '../types';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface StepIncomeProps {
  formData: WizardFormData;
  updateFormData: (data: Partial<WizardFormData>) => void;
}

export default function StepIncome({ formData, updateFormData }: StepIncomeProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div className="space-y-6">
      {/* Year Selection */}
      <div className="space-y-2">
        <Label htmlFor="year">Tax Year</Label>
        <Select
          value={formData.year.toString()}
          onValueChange={(value) => updateFormData({ year: parseInt(value) })}
        >
          <SelectTrigger id="year">
            <SelectValue placeholder="Select year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Select the tax year for this calculation
        </p>
      </div>

      {/* Currency Selection */}
      <div className="space-y-2">
        <Label htmlFor="currency">Preferred Currency</Label>
        <Select
          value={formData.currency}
          onValueChange={(value: 'DKK' | 'USD') => updateFormData({ currency: value })}
        >
          <SelectTrigger id="currency">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="DKK">DKK (Danish Krone)</SelectItem>
            <SelectItem value="USD">USD (US Dollar)</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">
          Choose your preferred currency for input. All calculations will be in DKK.
        </p>
      </div>

      {/* USD to DKK Rate (only if USD selected) */}
      {formData.currency === 'USD' && (
        <div className="space-y-2">
          <Label htmlFor="usdToDkkRate">USD to DKK Exchange Rate</Label>
          <Input
            id="usdToDkkRate"
            type="number"
            step="0.01"
            value={formData.usdToDkkRate}
            onChange={(e) => updateFormData({ usdToDkkRate: parseFloat(e.target.value) })}
            placeholder="6.90"
          />
          <p className="text-sm text-muted-foreground">
            Current exchange rate (e.g., 6.90 means 1 USD = 6.90 DKK)
          </p>
        </div>
      )}

      {/* Yearly Salary */}
      <div className="space-y-2">
        <Label htmlFor="yearlySalary">
          Yearly Salary
        </Label>
        <CurrencyInput
          id="yearlySalary"
          value={formData.yearlySalary}
          onChange={(value) => updateFormData({ yearlySalary: value })}
          currency={formData.currency}
          placeholder={formData.currency === 'USD' ? '100,000.00' : '690,000.00'}
        />
        <p className="text-sm text-muted-foreground">
          Your annual base salary before taxes
        </p>
      </div>

      {/* Fradrag (Deductions) */}
      <div className="space-y-2">
        <Label htmlFor="fradrag">
          Fradrag (Deductions)
        </Label>
        <CurrencyInput
          id="fradrag"
          value={formData.fradrag}
          onChange={(value) => updateFormData({ fradrag: value })}
          currency={formData.currency}
          placeholder={formData.currency === 'USD' ? '7,200.00' : '49,700.00'}
        />
        <p className="text-sm text-muted-foreground">
          Personal allowance (personfradrag) and other deductions. Default is 49,700 DKK for 2024.
        </p>
      </div>

      {/* US Person Status */}
      <div className="space-y-4 rounded-lg border border-border p-4">
        <div className="flex items-start gap-3">
          <input
            id="isUsPerson"
            type="checkbox"
            checked={formData.isUsPerson}
            onChange={(e) => updateFormData({ isUsPerson: e.target.checked })}
            className="mt-1 h-4 w-4"
          />
          <div className="flex-1">
            <Label htmlFor="isUsPerson" className="cursor-pointer font-medium">
              I am a US Person (US Citizen, Green Card holder, or US tax resident)
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Check this if you are subject to US global taxation
            </p>
          </div>
        </div>

        {formData.isUsPerson && (
          <>
            {/* Warning for US Persons */}
            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                ⚠️ Important for US Persons
              </p>
              <ul className="space-y-1 text-sm text-yellow-800 dark:text-yellow-200">
                <li>• You are subject to US Global Taxation on your worldwide income</li>
                <li>• Danish foreign tax credit (Box 496) may be limited by actual US tax paid</li>
                <li>• Enter the actual tax you paid to the IRS below for accurate credit calculation</li>
              </ul>
            </div>

            {/* IRS Tax Paid */}
            <div className="space-y-2">
              <Label htmlFor="irsTaxPaidUsd">
                IRS Tax Paid on Foreign Income
              </Label>
              <CurrencyInput
                id="irsTaxPaidUsd"
                value={formData.irsTaxPaidUsd}
                onChange={(value) => updateFormData({ irsTaxPaidUsd: value })}
                currency="USD"
                placeholder="0.00"
              />
              <p className="text-sm text-muted-foreground">
                Enter the actual tax paid to the IRS on your dividend income (from your US tax return).
                This is used to calculate Box 496 credit accurately.
              </p>
            </div>
          </>
        )}
      </div>

      {/* Info box */}
      <div className="rounded-lg bg-muted p-4">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> If you enter values in USD, they will be automatically converted to DKK using the exchange rate you provided.
        </p>
      </div>
    </div>
  );
}
