import { loanRepository as repo } from './loan.repository';
import { Ok, Err, type Result } from '../http/result';
import type { CreateLoan, UpdateLoan, AddLoanPayment, LoanView } from '@/shared';

function addMonths(d: Date, n: number): Date {
  const r = new Date(d);
  r.setMonth(r.getMonth() + n);
  return r;
}

function toView(l: {
  _id: unknown; name: string; lender?: string; kind: LoanView['kind']; principal: number;
  interestRatePct?: number; emiAmount: number; tenureMonths: number; startDate: Date;
  status: LoanView['status']; note?: string;
  payments: { _id: unknown; date: Date; amount: number; transactionId?: string }[];
}): LoanView {
  const paidCount = l.payments.length;
  const paidAmount = l.payments.reduce((s, p) => s + p.amount, 0);
  const totalPayable = l.emiAmount * l.tenureMonths;
  const outstanding = Math.max((l.tenureMonths - paidCount) * l.emiAmount, 0);
  return {
    _id: String(l._id),
    name: l.name,
    lender: l.lender,
    kind: l.kind,
    principal: l.principal,
    interestRatePct: l.interestRatePct,
    emiAmount: l.emiAmount,
    tenureMonths: l.tenureMonths,
    startDate: new Date(l.startDate).toISOString(),
    status: l.status,
    note: l.note,
    payments: l.payments.map((p) => ({
      _id: String(p._id), date: new Date(p.date).toISOString(), amount: p.amount, transactionId: p.transactionId,
    })),
    paidCount,
    paidAmount,
    totalPayable,
    outstanding,
    progressPct: l.tenureMonths > 0 ? Math.min(100, Math.round((paidCount / l.tenureMonths) * 100)) : 0,
    nextDueDate: paidCount < l.tenureMonths ? addMonths(new Date(l.startDate), paidCount).toISOString() : undefined,
  };
}

export const loanService = {
  async list(userId: string): Promise<LoanView[]> {
    const loans = await repo.list(userId);
    return loans.map(toView);
  },

  create: (userId: string, data: CreateLoan) =>
    repo.create(userId, { ...data, startDate: new Date(data.startDate) }),

  async update(userId: string, id: string, data: UpdateLoan): Promise<Result<unknown, 'not_found'>> {
    const set: Record<string, unknown> = { ...data };
    if (data.startDate) set.startDate = new Date(data.startDate);
    const loan = await repo.update(userId, id, set);
    return loan ? Ok(loan) : Err('not_found');
  },

  async remove(userId: string, id: string): Promise<Result<{ deleted: true }, 'not_found'>> {
    const loan = await repo.remove(userId, id);
    return loan ? Ok({ deleted: true }) : Err('not_found');
  },

  async addPayment(userId: string, id: string, data: AddLoanPayment): Promise<Result<LoanView, 'not_found'>> {
    const loan = await repo.addPayment(userId, id, {
      date: data.date ? new Date(data.date) : new Date(),
      amount: data.amount,
      transactionId: data.transactionId,
    });
    return loan ? Ok(toView(loan)) : Err('not_found');
  },

  // Revert a payment whose settlement transaction was deleted.
  revertByTransaction: (userId: string, transactionId: string) => repo.unlinkPayment(userId, transactionId),
};
