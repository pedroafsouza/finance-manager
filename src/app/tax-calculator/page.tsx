'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calculator, Trash2, Edit } from 'lucide-react';
import TaxWizard from './components/TaxWizard';
import { TaxCalculation, WizardFormData } from './types';
import { formatDKK, convertUsdToDkk } from '@/lib/tax-calculator-danish';

export default function TaxCalculatorPage() {
  const [calculations, setCalculations] = useState<TaxCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [editingCalculation, setEditingCalculation] = useState<TaxCalculation | null>(null);

  useEffect(() => {
    fetchCalculations();
  }, []);

  const fetchCalculations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/tax-calculations');
      const data = await response.json();
      if (data.success) {
        setCalculations(data.data);
      }
    } catch (error) {
      console.error('Error fetching calculations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCalculation = async (formData: WizardFormData) => {
    try {
      // Convert to DKK if needed
      const valueInDkk = (value: number) => {
        return formData.currency === 'USD' ? convertUsdToDkk(value, formData.usdToDkkRate) : value;
      };

      const payload = {
        year: formData.year,
        yearlySalaryDkk: valueInDkk(formData.yearlySalary),
        fradragDkk: valueInDkk(formData.fradrag),
        amountOn7pDkk: valueInDkk(formData.amountOn7p),
        amountNotOn7pDkk: valueInDkk(formData.amountNotOn7p),
        microsoftAllowance7pDkk: valueInDkk(formData.microsoftAllowance7p),
        preferredCurrency: formData.currency,
        usdToDkkRate: formData.usdToDkkRate,
        notes: formData.notes,
      };

      const response = await fetch('/api/tax-calculations', {
        method: editingCalculation ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCalculation ? { ...payload, id: editingCalculation.id } : payload),
      });

      const data = await response.json();
      if (data.success) {
        await fetchCalculations();
        setShowWizard(false);
        setEditingCalculation(null);
      } else {
        alert(data.error || 'Failed to save calculation');
      }
    } catch (error) {
      console.error('Error saving calculation:', error);
      alert('Failed to save calculation');
    }
  };

  const handleDeleteCalculation = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tax calculation?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tax-calculations?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        await fetchCalculations();
      } else {
        alert(data.error || 'Failed to delete calculation');
      }
    } catch (error) {
      console.error('Error deleting calculation:', error);
      alert('Failed to delete calculation');
    }
  };

  const handleEditCalculation = (calc: TaxCalculation) => {
    setEditingCalculation(calc);
    setShowWizard(true);
  };

  if (showWizard) {
    const initialData = editingCalculation ? {
      year: editingCalculation.year,
      yearlySalary: editingCalculation.yearlySalaryDkk,
      fradrag: editingCalculation.fradragDkk,
      amountOn7p: editingCalculation.amountOn7pDkk,
      amountNotOn7p: editingCalculation.amountNotOn7pDkk,
      microsoftAllowance7p: editingCalculation.microsoftAllowance7pDkk,
      currency: editingCalculation.preferredCurrency,
      usdToDkkRate: editingCalculation.usdToDkkRate,
      notes: editingCalculation.notes || '',
    } : undefined;

    return (
      <div className="min-h-screen bg-background p-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground">
            {editingCalculation ? 'Edit' : 'New'} Tax Calculation
          </h1>
          <p className="mt-2 text-muted-foreground">
            Calculate your Danish taxes with RSU income and §7P benefits
          </p>
        </div>

        <TaxWizard
          onComplete={handleCreateCalculation}
          onCancel={() => {
            setShowWizard(false);
            setEditingCalculation(null);
          }}
          initialData={initialData}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">Tax Calculator</h1>
            <p className="mt-2 text-muted-foreground">
              Calculate your Danish taxes including RSU income and §7P benefits
            </p>
          </div>
          <Button onClick={() => setShowWizard(true)} size="lg">
            <Plus className="mr-2 h-5 w-5" />
            New Calculation
          </Button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center text-muted-foreground">Loading calculations...</div>
        )}

        {/* Empty State */}
        {!loading && calculations.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Calculator className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="mb-2 text-xl font-semibold">No Tax Calculations Yet</h3>
              <p className="mb-6 text-center text-muted-foreground">
                Create your first tax calculation to estimate your Danish taxes including RSU
                income and §7P benefits.
              </p>
              <Button onClick={() => setShowWizard(true)}>
                <Plus className="mr-2 h-5 w-5" />
                Create First Calculation
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Calculations Grid */}
        {!loading && calculations.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {calculations.map((calc) => (
              <Card key={calc.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>Tax Year {calc.year}</CardTitle>
                      <CardDescription>
                        {new Date(calc.createdAt!).toLocaleDateString('da-DK')}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditCalculation(calc)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCalculation(calc.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Income</p>
                      <p className="text-lg font-semibold">
                        {formatDKK(
                          calc.yearlySalaryDkk + calc.amountOn7pDkk + calc.amountNotOn7pDkk
                        )}
                      </p>
                    </div>
                    <div className="rounded-lg bg-primary/10 p-3">
                      <p className="text-sm text-muted-foreground">Total Tax</p>
                      <p className="text-2xl font-bold text-primary">
                        {formatDKK(calc.totalTaxDkk || 0)}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">AM-bidrag</p>
                        <p className="font-semibold">{formatDKK(calc.amBidragDkk || 0)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Municipal</p>
                        <p className="font-semibold">{formatDKK(calc.municipalTaxDkk || 0)}</p>
                      </div>
                    </div>
                    {calc.notes && (
                      <div className="border-t border-border pt-3">
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {calc.notes}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
