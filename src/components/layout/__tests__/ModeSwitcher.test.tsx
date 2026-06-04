import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

const switchMode = vi.fn();
vi.mock('@/contexts/ModeContext', () => ({
  useMode: () => ({ mode: 'finance', switchMode }),
}));

import { ModeSwitcher } from '../ModeSwitcher';

describe('ModeSwitcher', () => {
  beforeEach(() => switchMode.mockReset());

  it('marks the active mode and switches on click', () => {
    render(<ModeSwitcher />);

    const finance = screen.getByRole('tab', { name: /finance/i });
    const goals = screen.getByRole('tab', { name: /goals/i });
    expect(finance).toHaveAttribute('aria-selected', 'true');
    expect(goals).toHaveAttribute('aria-selected', 'false');

    fireEvent.click(goals);
    expect(switchMode).toHaveBeenCalledWith('goals');
  });
});
