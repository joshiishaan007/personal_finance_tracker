'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Banknote, Wallet, CalendarClock, Pencil, Trash2, RotateCcw, Check } from 'lucide-react';
import { fmt, fmtDate, cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useLoans, useDeleteLoan, useAddLoanPayment, type LoanView } from '@/hooks/useLoans';
import { useCreateTransaction, useDeleteTransaction } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import type { CreateTransaction } from '@/shared';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { StatCard } from '@/components/StatCard';
import { EmptyState } from '@/components/EmptyState';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoanForm } from '@/components/loans/LoanForm';

const KIND_LABEL: Record<LoanView['kind'], string> = {
  home: 'Home', car: 'Car', personal: 'Personal', education: 'Education',
  gold: 'Gold', business: 'Business', 'credit-card': 'Credit card', other: 'Other',
};
const EMI_KEYWORDS = ['loan', 'emi', 'debt', 'bill', 'rent', 'other'];

export function LoansView() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data: loans, isLoading } = useLoans();
  const { data: categories } = useCategories();
  const createTx = useCreateTransaction();
  const deleteTx = useDeleteTransaction();
  const addPayment = useAddLoanPayment();
  const deleteLoan = useDeleteLoan();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<LoanView | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [pendingUndo, setPendingUndo] = useState<LoanView | null>(null);
  const [pendingDelete, setPendingDelete] = useState<LoanView | null>(null);

  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null);
      setFormOpen(true);
      router.replace('/loans');
    }
  }, [searchParams, router]);

  const expenseList = (categories ?? []).filter((c) => c.type === 'expense');
  const emiCat = EMI_KEYWORDS.reduce<(typeof expenseList)[number] | undefined>(
    (found, k) => found ?? expenseList.find((c) => c.name.toLowerCase().includes(k)),
    undefined,
  ) ?? expenseList[0];

  const list = loans ?? [];
  const active = list.filter((l) => l.status === 'active');
  const totalOutstanding = active.reduce((s, l) => s + l.outstanding, 0);
  const monthlyEmi = active.reduce((s, l) => s + (l.paidCount < l.tenureMonths ? l.emiAmount : 0), 0);

  async function payEmi(loan: LoanView) {
    if (!emiCat || payingId) return;
    setPayingId(loan._id);
    try {
      const txId = await createTx.mutateAsync({
        amount: loan.emiAmount,
        type: 'expense',
        categoryId: emiCat._id,
        date: new Date().toISOString(),
        note: `EMI · ${loan.name}`,
        paymentMethod: 'netbanking',
        tags: ['emi'],
        isRecurring: false,
      } as CreateTransaction);
      await addPayment.mutateAsync({ id: loan._id, data: { amount: loan.emiAmount, transactionId: txId } });
    } finally {
      setPayingId(null);
    }
  }

  function undoLast(loan: LoanView) {
    const last = loan.payments[loan.payments.length - 1];
    if (last?.transactionId) deleteTx.mutate(last.transactionId);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5 p-4 lg:p-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Heading level={1} className="text-2xl">Loans</Heading>
          <Text variant="small" className="mt-0.5">Track loans and log EMIs as you pay them</Text>
        </div>
        <Button size="sm" variant="gradient" leftIcon={<Plus size={16} strokeWidth={2.4} />} onClick={() => { setEditing(null); setFormOpen(true); }}>
          New loan
        </Button>
      </div>

      {list.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard label="Outstanding" value={totalOutstanding} format={(n) => fmt(n, currency)} icon={Banknote} tone="danger" />
          <StatCard label="Monthly EMI" value={monthlyEmi} format={(n) => fmt(n, currency)} icon={Wallet} tone="brand" gradient />
        </div>
      )}

      {isLoading ? (
        <SkeletonLoader rows={4} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="No loans yet"
          description="Add a loan to track its EMIs, outstanding and payoff progress."
          action={{ label: 'Add a loan', onClick: () => { setEditing(null); setFormOpen(true); } }}
        />
      ) : (
        <div className="space-y-3">
          {list.map((loan) => {
            const fullyPaid = loan.paidCount >= loan.tenureMonths;
            const paying = payingId === loan._id;
            return (
              <Card key={loan._id} className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Text className="font-semibold text-slate-900 dark:text-slate-50 truncate">{loan.name}</Text>
                      <Badge variant="default" className="text-[10px]">{KIND_LABEL[loan.kind]}</Badge>
                      {loan.status === 'closed' && <Badge variant="success" className="text-[10px]">Closed</Badge>}
                    </div>
                    <Text variant="small" className="text-slate-500">
                      {loan.lender ? `${loan.lender} · ` : ''}EMI {fmt(loan.emiAmount, currency)}
                      {loan.interestRatePct != null ? ` · ${loan.interestRatePct}% p.a.` : ''}
                    </Text>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button variant="ghost" size="sm" className="px-2" aria-label="Edit loan" onClick={() => { setEditing(loan); setFormOpen(true); }}>
                      <Pencil size={15} strokeWidth={2.2} />
                    </Button>
                    <Button variant="ghost" size="sm" className="px-2 hover:text-danger-500" aria-label="Delete loan" onClick={() => setPendingDelete(loan)}>
                      <Trash2 size={15} strokeWidth={2.2} />
                    </Button>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <Text as="span" variant="small" className="tabular-nums">{loan.paidCount}/{loan.tenureMonths} EMIs paid</Text>
                    <Text as="span" variant="small" className="tabular-nums text-slate-500">Outstanding {fmt(loan.outstanding, currency)}</Text>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-ink-700 overflow-hidden">
                    <div className="h-full rounded-full bg-brand-500 transition-all duration-500" style={{ width: `${loan.progressPct}%` }} />
                  </div>
                  {loan.nextDueDate && !fullyPaid && (
                    <Text as="span" variant="small" className="mt-1 inline-flex items-center gap-1 text-slate-400">
                      <CalendarClock size={11} strokeWidth={2.2} /> Next EMI · {fmtDate(loan.nextDueDate)}
                    </Text>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant={fullyPaid ? 'secondary' : 'primary'}
                    disabled={fullyPaid || !emiCat}
                    loading={paying}
                    leftIcon={fullyPaid ? <Check size={14} strokeWidth={2.6} /> : <Plus size={14} strokeWidth={2.6} />}
                    onClick={() => payEmi(loan)}
                  >
                    {fullyPaid ? 'Fully paid' : `Pay EMI · ${fmt(loan.emiAmount, currency)}`}
                  </Button>
                  {loan.paidCount > 0 && (
                    <Button size="sm" variant="ghost" className="text-slate-500 hover:text-warn-500" leftIcon={<RotateCcw size={13} strokeWidth={2.2} />} onClick={() => setPendingUndo(loan)}>
                      Undo last
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <LoanForm open={formOpen} onClose={() => { setFormOpen(false); setEditing(null); }} editLoan={editing} />

      <ConfirmDialog
        open={!!pendingUndo}
        onClose={() => setPendingUndo(null)}
        onConfirm={() => { if (pendingUndo) undoLast(pendingUndo); }}
        title="Undo last EMI?"
        description="The most recent EMI payment and its expense transaction will be removed."
        confirmLabel="Undo"
        variant="warn"
        loading={deleteTx.isPending}
      />

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => deleteLoan.mutate(pendingDelete!._id)}
        title="Delete this loan?"
        description={pendingDelete ? `"${pendingDelete.name}" and its payment history will be removed. Logged EMI expenses stay in your transactions.` : undefined}
        confirmLabel="Delete"
        variant="danger"
        loading={deleteLoan.isPending}
      />
    </div>
  );
}
