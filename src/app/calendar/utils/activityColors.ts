import { ActivityColorMap } from '../types';

export const activityColors: ActivityColorMap = {
  'Release': {
    bg: '#3b82f6',
    border: '#2563eb',
    text: '#ffffff'
  },
  'Opening Balance': {
    bg: '#3b82f6',
    border: '#2563eb',
    text: '#ffffff'
  },
  'Dividend (Cash)': {
    bg: '#10b981',
    border: '#059669',
    text: '#ffffff'
  },
  'Sale': {
    bg: '#ef4444',
    border: '#dc2626',
    text: '#ffffff'
  },
  'Sold': {
    bg: '#ef4444',
    border: '#dc2626',
    text: '#ffffff'
  },
  'Withholding': {
    bg: '#f59e0b',
    border: '#d97706',
    text: '#ffffff'
  },
  'Tax Withholding': {
    bg: '#f59e0b',
    border: '#d97706',
    text: '#ffffff'
  },
  'IRS Nonresident Alien Withholding': {
    bg: '#f59e0b',
    border: '#d97706',
    text: '#ffffff'
  },
  'You bought (dividend)': {
    bg: '#8b5cf6',
    border: '#7c3aed',
    text: '#ffffff'
  },
  'Historical Transaction': {
    bg: '#6b7280',
    border: '#4b5563',
    text: '#ffffff'
  },
  'Stock Plan Activity': {
    bg: '#6366f1',
    border: '#4f46e5',
    text: '#ffffff'
  },
  'default': {
    bg: '#6b7280',
    border: '#4b5563',
    text: '#ffffff'
  }
};

export function getActivityColor(activityType: string): { bg: string; border: string; text: string } {
  return activityColors[activityType] || activityColors['default'];
}

// Get the most significant activity type for determining event color
// Priority: Sales > Vesting > Dividends > Withholdings > Other
export function getPrimaryActivityType(activityTypes: string[]): string {
  const priorityOrder = [
    'Sale',
    'Sold',
    'Release',
    'Opening Balance',
    'Dividend (Cash)',
    'Withholding',
    'Tax Withholding',
    'IRS Nonresident Alien Withholding',
    'You bought (dividend)',
    'Historical Transaction',
    'Stock Plan Activity'
  ];

  for (const priority of priorityOrder) {
    if (activityTypes.includes(priority)) {
      return priority;
    }
  }

  return activityTypes[0] || 'default';
}
