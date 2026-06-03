import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const mutate = vi.fn();

vi.mock('@/hooks/useQuickAdd', () => ({
  useQuickParse: () => ({ mutate, isPending: false }),
}));
vi.mock('@/hooks/useCategories', () => ({
  useCategories: () => ({ data: [] }),
}));
// Stub the modal form so we only assert QuickAddBar's wiring (open + prefill).
vi.mock('@/components/transaction/TransactionForm', () => ({
  TransactionForm: ({ open, prefill }: { open: boolean; prefill?: { amount?: number } | null }) =>
    open ? <div data-testid="tx-form" data-amount={prefill?.amount ?? ''} /> : null,
}));

import { QuickAddBar } from '../QuickAddBar';

describe('QuickAddBar', () => {
  beforeEach(() => { mutate.mockReset(); });

  it('disables the Add button until text is entered', () => {
    render(<QuickAddBar />);
    const button = screen.getByRole('button', { name: /add/i });
    expect(button).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/quick add/i), { target: { value: 'coffee 200' } });
    expect(button).not.toBeDisabled();
  });

  it('parses the trimmed text and opens a pre-filled form on success', () => {
    mutate.mockImplementation((_text: string, opts: { onSuccess: (d: unknown) => void }) => {
      opts.onSuccess({ amount: 200, type: 'expense', categoryId: 'cat_food', paymentMethod: 'upi', note: 'coffee' });
    });

    render(<QuickAddBar />);
    fireEvent.change(screen.getByLabelText(/quick add/i), { target: { value: '  coffee 200 upi  ' } });
    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    expect(mutate).toHaveBeenCalledWith('coffee 200 upi', expect.any(Object));
    expect(screen.getByTestId('tx-form')).toHaveAttribute('data-amount', '200');
  });

  it('still opens a (blank) form on parse failure so manual entry works', () => {
    mutate.mockImplementation((_text: string, opts: { onError: (e: unknown) => void }) => {
      opts.onError(new Error('parse failed'));
    });

    render(<QuickAddBar />);
    fireEvent.change(screen.getByLabelText(/quick add/i), { target: { value: 'gibberish' } });
    fireEvent.click(screen.getByRole('button', { name: /add/i }));

    expect(screen.getByTestId('tx-form')).toHaveAttribute('data-amount', '');
    expect(screen.getByText(/couldn't read that/i)).toBeInTheDocument();
  });
});
