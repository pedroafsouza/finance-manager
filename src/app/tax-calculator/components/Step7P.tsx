'use client';

import { WizardFormData } from '../types';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Info } from 'lucide-react';

interface Step7PProps {
  formData: WizardFormData;
  updateFormData: (data: Partial<WizardFormData>) => void;
}

export default function Step7P({ formData, updateFormData }: Step7PProps) {
  const currencyLabel = formData.currency === 'USD' ? '(USD)' : '(DKK)';

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

      {/* Amount on §7P */}
      <div className="space-y-2">
        <Label htmlFor="amountOn7p">
          Amount Reported on §7P {currencyLabel}
        </Label>
        <Input
          id="amountOn7p"
          type="number"
          step="0.01"
          value={formData.amountOn7p || ''}
          onChange={(e) => updateFormData({ amountOn7p: parseFloat(e.target.value) || 0 })}
          placeholder="0.00"
        />
        <p className="text-sm text-muted-foreground">
          RSU income that qualifies for §7P treatment (as reported by KPMG)
        </p>
      </div>

      {/* Amount NOT on §7P */}
      <div className="space-y-2">
        <Label htmlFor="amountNotOn7p">
          Amount NOT Reported on §7P {currencyLabel}
        </Label>
        <Input
          id="amountNotOn7p"
          type="number"
          step="0.01"
          value={formData.amountNotOn7p || ''}
          onChange={(e) => updateFormData({ amountNotOn7p: parseFloat(e.target.value) || 0 })}
          placeholder="0.00"
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
