export const ISO4217Currencies = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'SGD', 'AED', 'CHF'] as const;
export type Currency = typeof ISO4217Currencies[number];

export const CurrencySymbols: Record<Currency, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£', JPY: '¥',
  AUD: 'A$', CAD: 'C$', SGD: 'S$', AED: 'د.إ', CHF: 'Fr',
};

export type TransactionType = 'income' | 'expense' | 'transfer' | 'investment';
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'netbanking' | 'wallet' | 'cheque' | 'other';
export type GoalStatus = 'active' | 'achieved' | 'paused';
export type BudgetPeriod = 'monthly' | 'yearly';
export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';
export type UserRole = 'user' | 'admin';

/** Convert display value to minor units (paise/cents). Never use floats for money. */
export function toMinorUnits(display: number, currency: Currency): number {
  const multiplier = currency === 'JPY' ? 1 : 100;
  return Math.round(display * multiplier);
}

/** Format minor-unit integer to locale display string. */
export function formatAmount(minorUnits: number, currency: Currency, locale?: string): string {
  const divisor = currency === 'JPY' ? 1 : 100;
  const amount = minorUnits / divisor;
  return new Intl.NumberFormat(locale ?? 'en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(amount);
}
