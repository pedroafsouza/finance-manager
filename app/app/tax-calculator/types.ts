export interface TaxCalculation {
  id?: number;
  year: number;
  yearlySalaryDkk: number;
  fradragDkk: number;
  amountOn7pDkk: number;
  amountNotOn7pDkk: number;
  microsoftAllowance7pDkk: number;
  preferredCurrency: 'DKK' | 'USD';
  usdToDkkRate: number;
  calculatedTaxDkk?: number;
  amBidragDkk?: number;
  bottomTaxDkk?: number;
  topTaxDkk?: number;
  municipalTaxDkk?: number;
  totalTaxDkk?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WizardFormData {
  year: number;
  yearlySalary: number;
  fradrag: number;
  amountOn7p: number;
  amountNotOn7p: number;
  microsoftAllowance7p: number;
  currency: 'DKK' | 'USD';
  usdToDkkRate: number;
  notes: string;
}
