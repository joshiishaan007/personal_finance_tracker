'use client';

import { Users } from 'lucide-react';
import { DebtTracker, type DebtTrackerConfig } from './DebtTracker';

const CONFIG: DebtTrackerConfig = {
  direction:         'they_owe_me',
  tone:              'brand',
  title:             'People owe you',
  icon:              Users,
  emptyText:         'All settled up!',
  settleTxType:      'income',
  markLabel:         'Mark settled',
  markQuestion:      'Mark as settled?',
  markAllLabel:      'Settle all',
  markAllQuestion:   'Settle all entries?',
  modalTitle:        (name) => `${name} owes you`,
  settleDescription: (amount, name) => `This will record a reimbursement income of ${amount} from ${name}.`,
  deleteDescription: (amount, name) => `${name}'s debt of ${amount} will be permanently removed.`,
};

export function PeopleOweYou() {
  return <DebtTracker config={CONFIG} />;
}
