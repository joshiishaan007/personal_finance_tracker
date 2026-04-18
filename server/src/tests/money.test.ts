import { describe, it, expect } from 'vitest';
import { formatAmount, toMinorUnits } from '@finbuddy/shared';

describe('toMinorUnits', () => {
  it('converts INR display to paise', () => expect(toMinorUnits(100.5, 'INR')).toBe(10050));
  it('converts USD display to cents', () => expect(toMinorUnits(9.99, 'USD')).toBe(999));
  it('converts JPY (no subunit)', () => expect(toMinorUnits(1000, 'JPY')).toBe(1000));
  it('handles zero', () => expect(toMinorUnits(0, 'INR')).toBe(0));
  it('rounds floating-point correctly (0.1+0.2)', () => expect(toMinorUnits(0.1 + 0.2, 'INR')).toBe(30));
  it('rounds negative display amounts', () => expect(toMinorUnits(-5.5, 'INR')).toBe(-550));
  it('converts large amounts', () => expect(toMinorUnits(1000000, 'INR')).toBe(100000000));
});

describe('formatAmount', () => {
  it('formats INR paise correctly', () => {
    const result = formatAmount(10050, 'INR', 'en-IN');
    expect(result).toContain('100');
    expect(result).toContain('50');
  });
  it('formats USD cents correctly', () => {
    const result = formatAmount(999, 'USD', 'en-US');
    expect(result).toContain('9.99');
  });
  it('formats JPY without decimal', () => {
    const result = formatAmount(1000, 'JPY', 'ja-JP');
    expect(result).toContain('1');
    expect(result).not.toContain('.');
  });
  it('formats zero', () => {
    const result = formatAmount(0, 'INR', 'en-IN');
    expect(result).toContain('0');
  });
});
