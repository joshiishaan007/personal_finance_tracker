import { describe, it, expect } from 'vitest';
import { parseQuickAdd } from '../quickParse';

const CATS = [
  { _id: 'food', name: 'Food & Dining', type: 'expense' },
  { _id: 'transport', name: 'Transport', type: 'expense' },
  { _id: 'salary', name: 'Salary', type: 'income' },
  { _id: 'shopping', name: 'Shopping', type: 'expense' },
];

describe('parseQuickAdd', () => {
  it('parses "coffee 200 upi" into a full expense draft', () => {
    expect(parseQuickAdd('coffee 200 upi', CATS)).toEqual({
      amount: 200, type: 'expense', categoryId: 'food', paymentMethod: 'upi', note: 'coffee',
    });
  });

  it('expands the k suffix and defaults payment method to cash', () => {
    const r = parseQuickAdd('groceries 1.5k', CATS);
    expect(r).toMatchObject({ amount: 1500, categoryId: 'food', paymentMethod: 'cash', type: 'expense' });
  });

  it('detects income from keywords and matches an income category', () => {
    const r = parseQuickAdd('salary 50000 received', CATS);
    expect(r).toMatchObject({ amount: 50000, type: 'income', categoryId: 'salary' });
  });

  it('maps payment synonyms (gpay → upi, credit → card)', () => {
    expect(parseQuickAdd('uber 300 gpay', CATS)?.paymentMethod).toBe('upi');
    expect(parseQuickAdd('uber 300 credit', CATS)?.paymentMethod).toBe('card');
  });

  it('matches a category by its own name', () => {
    expect(parseQuickAdd('shopping 999 card', CATS)?.categoryId).toBe('shopping');
  });

  it('ignores a leading currency symbol', () => {
    expect(parseQuickAdd('lunch ₹250', CATS)?.amount).toBe(250);
  });

  it('returns null when there is no amount', () => {
    expect(parseQuickAdd('coffee upi', CATS)).toBeNull();
  });

  it('returns null when no category can be matched (defer to Gemini)', () => {
    expect(parseQuickAdd('xyzzy 200', CATS)).toBeNull();
  });

  it('returns null on empty input', () => {
    expect(parseQuickAdd('   ', CATS)).toBeNull();
  });
});
