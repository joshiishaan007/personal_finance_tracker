'use client';

import { HandCoins } from 'lucide-react';
import { DebtTracker, type DebtTrackerConfig } from './DebtTracker';

const CONFIG: DebtTrackerConfig = {
  direction:         'i_owe_them',
  tone:              'warn',
  title:             'You owe others',
  icon:              HandCoins,
  emptyText:         'All paid up!',
  settleTxType:      'expense',
  showSettled:       true,
  markLabel:         'Mark done',
  markQuestion:      'Mark as done?',
  markAllLabel:      'Mark all done',
  markAllQuestion:   'Mark all done?',
  modalTitle:        (name) => `You owe ${name}`,
  settleDescription: (amount, name) => `This will record an expense of ${amount} repaid to ${name} dated today.`,
  deleteDescription: (amount, name) => `Your debt to ${name} of ${amount} will be permanently removed.`,
};

export function YouOweOthers() {
  return <DebtTracker config={CONFIG} />;
}
