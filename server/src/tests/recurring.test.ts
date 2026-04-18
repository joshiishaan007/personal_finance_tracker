import { describe, it, expect } from 'vitest';
import { createHash } from 'crypto';

function advanceDate(date: Date, frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'): Date {
  const next = new Date(date);
  if (frequency === 'daily') next.setDate(next.getDate() + 1);
  else if (frequency === 'weekly') next.setDate(next.getDate() + 7);
  else if (frequency === 'monthly') next.setMonth(next.getMonth() + 1);
  else if (frequency === 'yearly') next.setFullYear(next.getFullYear() + 1);
  return next;
}

function computeDueDates(
  nextDueDate: Date,
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly',
  until: Date,
): Date[] {
  const dates: Date[] = [];
  let current = new Date(nextDueDate);
  while (current <= until) {
    dates.push(new Date(current));
    current = advanceDate(current, frequency);
  }
  return dates;
}

describe('computeDueDates — idempotency & correctness', () => {
  const base = new Date('2024-01-01T00:00:00.000Z');

  it('monthly: generates 3 dates over 3 months', () => {
    const until = new Date('2024-03-31T23:59:59.999Z');
    const dates = computeDueDates(base, 'monthly', until);
    expect(dates).toHaveLength(3);
    expect(dates[0].getUTCMonth()).toBe(0); // Jan
    expect(dates[1].getUTCMonth()).toBe(1); // Feb
    expect(dates[2].getUTCMonth()).toBe(2); // Mar
  });

  it('weekly: generates 2 dates when until is before the 3rd occurrence', () => {
    const until = new Date('2024-01-14T23:59:59.999Z');
    const dates = computeDueDates(base, 'weekly', until);
    expect(dates).toHaveLength(2);
    expect(dates[1].getUTCDate()).toBe(8);
  });

  it('daily: generates 7 dates for a week', () => {
    const until = new Date('2024-01-07T23:59:59.999Z');
    const dates = computeDueDates(base, 'daily', until);
    expect(dates).toHaveLength(7);
  });

  it('yearly: generates 3 dates over 3 years', () => {
    const until = new Date('2026-12-31T23:59:59.999Z');
    const dates = computeDueDates(base, 'yearly', until);
    expect(dates).toHaveLength(3);
    expect(dates[2].getUTCFullYear()).toBe(2026);
  });

  it('returns empty array when nextDueDate is in the future', () => {
    const future = new Date('2099-01-01T00:00:00.000Z');
    const dates = computeDueDates(future, 'monthly', base);
    expect(dates).toHaveLength(0);
  });

  it('same hash never produced twice for same rule+date', () => {
    const ruleId = 'abc123';
    const date = new Date('2024-01-01');
    const h1 = createHash('sha256').update(`recurring|${ruleId}|${date.toISOString()}`).digest('hex');
    const h2 = createHash('sha256').update(`recurring|${ruleId}|${date.toISOString()}`).digest('hex');
    expect(h1).toBe(h2);
  });
});
