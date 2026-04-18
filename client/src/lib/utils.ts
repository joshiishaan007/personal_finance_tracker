import { type Currency, formatAmount, CurrencySymbols } from '@finbuddy/shared';
import { format, parseISO } from 'date-fns';

export function fmt(minorUnits: number, currency: string = 'INR'): string {
  return formatAmount(minorUnits, currency as Currency);
}

export function currencySymbol(currency: string): string {
  return CurrencySymbols[currency as Currency] ?? currency;
}

export function fmtDate(date: string | Date, pattern = 'dd MMM yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern);
}

export function calcSavingsRate(income: number, expense: number): number {
  if (income === 0) return 0;
  return Math.round(((income - expense) / income) * 100);
}

export function progressColor(pct: number): string {
  if (pct >= 90) return 'text-danger-500';
  if (pct >= 70) return 'text-warn-500';
  return 'text-success-500';
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
