import { describe, it, expect } from 'vitest';
import { toMinorUnits } from '../types/common';

describe('toMinorUnits', () => {
  it('converts major units to integer minor units (2-decimal currency)', () => {
    expect(toMinorUnits(10.5, 'INR')).toBe(1050);
    expect(toMinorUnits(0.01, 'USD')).toBe(1);
  });

  it('rounds to the nearest minor unit', () => {
    expect(toMinorUnits(10.005, 'INR')).toBe(1001);
  });

  it('treats JPY as a zero-decimal currency', () => {
    expect(toMinorUnits(1000, 'JPY')).toBe(1000);
  });
});
