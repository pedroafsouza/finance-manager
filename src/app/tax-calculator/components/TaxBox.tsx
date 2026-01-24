import { ReactNode } from 'react';

interface TaxBoxProps {
  icon: string;
  rubrik: string;
  title: string;
  value: string | ReactNode;
  subtitle?: string | ReactNode;
  className?: string;
}

/**
 * Reusable component for displaying Danish tax return boxes (Rubrik)
 */
export default function TaxBox({
  icon,
  rubrik,
  title,
  value,
  subtitle,
  className = '',
}: TaxBoxProps) {
  return (
    <div className={`rounded-lg border border-border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          <div>
            <p className="text-xs text-muted-foreground uppercase">{rubrik}</p>
            <p className="text-sm font-medium">{title}</p>
          </div>
        </div>
      </div>
      {typeof value === 'string' ? (
        <p className="text-2xl font-bold">{value}</p>
      ) : (
        value
      )}
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
    </div>
  );
}
