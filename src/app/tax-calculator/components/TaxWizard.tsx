'use client';

import { useState } from 'react';
import { WizardFormData } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import StepIncome from './StepIncome';
import Step7P from './Step7P';
import StepAllowance from './StepAllowance';
import StepReview from './StepReview';

interface TaxWizardProps {
  onComplete: (data: WizardFormData) => void;
  onCancel: () => void;
  initialData?: Partial<WizardFormData>;
}

export default function TaxWizard({ onComplete, onCancel, initialData }: TaxWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<WizardFormData>({
    year: initialData?.year || new Date().getFullYear(),
    yearlySalary: initialData?.yearlySalary || 0,
    fradrag: initialData?.fradrag || 49700, // Default personfradrag 2024
    amountOn7p: initialData?.amountOn7p || 0,
    amountNotOn7p: initialData?.amountNotOn7p || 0,
    microsoftAllowance7p: initialData?.microsoftAllowance7p || 0,
    currency: initialData?.currency || 'DKK',
    usdToDkkRate: initialData?.usdToDkkRate || 6.9,
    notes: initialData?.notes || '',
    isUsPerson: initialData?.isUsPerson || false,
    irsTaxPaidUsd: initialData?.irsTaxPaidUsd || 0,
  });

  const steps = [
    {
      title: 'Income & Deductions',
      description: 'Enter your yearly salary and fradrag',
      component: StepIncome,
    },
    {
      title: '§7P RSU Income',
      description: 'Report amounts on and not on §7P',
      component: Step7P,
    },
    {
      title: 'Microsoft Allowance',
      description: 'Set the §7P allowance (KPMG calculated)',
      component: StepAllowance,
    },
    {
      title: 'Review & Calculate',
      description: 'Review and calculate your taxes',
      component: StepReview,
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateFormData = (data: Partial<WizardFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const CurrentStepComponent = steps[currentStep].component;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Progress indicator */}
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex-1 ${index < steps.length - 1 ? 'pr-4' : ''}`}
            >
              <div className="flex items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    index < currentStep
                      ? 'border-primary bg-primary text-primary-foreground'
                      : index === currentStep
                      ? 'border-primary bg-background text-primary'
                      : 'border-muted bg-background text-muted-foreground'
                  }`}
                >
                  {index < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 ${
                      index < currentStep ? 'bg-primary' : 'bg-muted'
                    }`}
                  />
                )}
              </div>
              <div className="mt-2">
                <p
                  className={`text-sm font-medium ${
                    index <= currentStep ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {step.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps[currentStep].title}</CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent>
          <CurrentStepComponent
            formData={formData}
            updateFormData={updateFormData}
          />

          {/* Navigation buttons */}
          <div className="mt-8 flex justify-between">
            <Button
              variant="outline"
              onClick={currentStep === 0 ? onCancel : handleBack}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              {currentStep === 0 ? 'Cancel' : 'Back'}
            </Button>
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Calculate & Save
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
