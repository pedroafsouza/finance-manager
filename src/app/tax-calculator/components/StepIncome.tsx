'use client';

import { WizardFormData } from '../types';
import { Input } from '@/components/ui/input';
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
          Yearly Salary {formData.currency === 'USD' ? '(USD)' : '(DKK)'}
        </Label>
        <Input
          id="yearlySalary"
          type="number"
          step="0.01"
          value={formData.yearlySalary || ''}
          onChange={(e) => updateFormData({ yearlySalary: parseFloat(e.target.value) || 0 })}
          placeholder={formData.currency === 'USD' ? '100,000' : '690,000'}
        />
        <p className="text-sm text-muted-foreground">
          Your annual base salary before taxes
        </p>
      </div>

      {/* Fradrag (Deductions) */}
      <div className="space-y-2">
        <Label htmlFor="fradrag">
          Fradrag (Deductions) {formData.currency === 'USD' ? '(USD)' : '(DKK)'}
        </Label>
        <Input
          id="fradrag"
          type="number"
          step="0.01"
          value={formData.fradrag || ''}
          onChange={(e) => updateFormData({ fradrag: parseFloat(e.target.value) || 0 })}
          placeholder={formData.currency === 'USD' ? '7,200' : '49,700'}
        />
        <p className="text-sm text-muted-foreground">
          Personal allowance (personfradrag) and other deductions. Default is 49,700 DKK for 2024.
        </p>
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
