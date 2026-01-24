'use client';

import * as React from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

export interface CurrencyInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
  currency?: string;
}

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, currency, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('');

    // Format number with commas
    const formatNumber = (num: number | string): string => {
      if (num === '' || num === null || num === undefined) return '';

      const numStr = num.toString().replace(/,/g, '');
      const parts = numStr.split('.');
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
      const decimalPart = parts[1] ? `.${parts[1]}` : '';

      return integerPart + decimalPart;
    };

    // Update display value when prop value changes
    React.useEffect(() => {
      if (value === 0) {
        setDisplayValue('');
      } else {
        setDisplayValue(formatNumber(value));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;

      // Remove all non-numeric characters except dots and minus
      const numericValue = inputValue.replace(/[^\d.-]/g, '');

      // Update display with formatting
      setDisplayValue(formatNumber(numericValue));

      // Parse and send numeric value
      const parsed = parseFloat(numericValue);
      onChange(isNaN(parsed) ? 0 : parsed);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Reformat on blur to ensure proper formatting
      if (value) {
        setDisplayValue(formatNumber(value.toFixed(2)));
      }
      props.onBlur?.(e);
    };

    return (
      <div className="relative">
        {currency && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
            {currency}
          </span>
        )}
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn(currency && 'pl-16', className)}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export { CurrencyInput };
