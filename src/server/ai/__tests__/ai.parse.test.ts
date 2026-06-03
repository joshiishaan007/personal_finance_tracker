// @vitest-environment node
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mutable Gemini response controlled per-test (vi.hoisted runs before the mocks).
const state = vi.hoisted(() => ({ response: '' }));

vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class {
    getGenerativeModel() {
      return { generateContent: async () => ({ response: { text: () => state.response } }) };
    }
  },
}));
vi.mock('@/server/env', () => ({ getEnv: () => ({ GEMINI_API_KEY: 'test-key' }) }));
vi.mock('@/server/logger', () => ({ logger: { warn: vi.fn(), info: vi.fn() } }));
vi.mock('@/server/category/category.repository', () => ({
  categoryRepository: {
    list: async () => [
      { _id: 'cat_food', name: 'Food & Dining', type: 'expense' },
      { _id: 'cat_salary', name: 'Salary', type: 'income' },
    ],
  },
}));

import { aiService } from '../ai.service';

describe('aiService.parseTransaction', () => {
  beforeEach(() => { state.response = ''; });

  it('returns a validated draft when Gemini picks a real, type-matched category', async () => {
    state.response = JSON.stringify({
      amount: 200, type: 'expense', categoryId: 'cat_food', paymentMethod: 'upi', note: 'coffee',
    });
    const r = await aiService.parseTransaction('u1', 'coffee 200 upi');
    expect(r.state).toBe('ok');
    if (r.state === 'ok') {
      expect(r.data).toMatchObject({ amount: 200, type: 'expense', categoryId: 'cat_food', paymentMethod: 'upi' });
    }
  });

  it('fails when Gemini returns a category id that does not exist', async () => {
    state.response = JSON.stringify({
      amount: 200, type: 'expense', categoryId: 'cat_made_up', paymentMethod: 'cash',
    });
    const r = await aiService.parseTransaction('u1', 'mystery 200');
    expect(r).toEqual({ state: 'error', reason: 'bad_request' });
  });

  it('fails when the category type does not match the transaction type', async () => {
    state.response = JSON.stringify({
      amount: 200, type: 'income', categoryId: 'cat_food', paymentMethod: 'cash',
    });
    const r = await aiService.parseTransaction('u1', 'weird 200');
    expect(r).toEqual({ state: 'error', reason: 'bad_request' });
  });

  it('fails on malformed / non-JSON model output', async () => {
    state.response = 'sorry, I cannot help with that';
    const r = await aiService.parseTransaction('u1', '???');
    expect(r).toEqual({ state: 'error', reason: 'bad_request' });
  });

  it('fails when a required field is missing', async () => {
    state.response = JSON.stringify({ type: 'expense', categoryId: 'cat_food', paymentMethod: 'cash' });
    const r = await aiService.parseTransaction('u1', 'no amount');
    expect(r).toEqual({ state: 'error', reason: 'bad_request' });
  });
});
