'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Wallet, TrendingUp, LineChart, Trash2, Pencil } from 'lucide-react';
import { fmt, fmtDate, cn } from '@/lib/utils';
import type { InvestmentView, InvestmentKind } from '@/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useInvestments, useDeleteInvestment } from '@/hooks/useInvestments';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { StatCard } from '@/components/StatCard';
import { EmptyState } from '@/components/EmptyState';
import { InvestmentForm } from './InvestmentForm';
import { InvestmentDetailModal } from './InvestmentDetailModal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

const KIND_LABEL: Record<InvestmentKind, string> = {
  fd: 'Fixed Deposit',
  rd: 'Recurring Deposit',
  sip: 'SIP',
  ppf: 'PPF',
  equity: 'Equity',
};

function effectiveInvested(inv: InvestmentView): number {
  return inv.kind === 'fd' || inv.kind === 'equity' ? inv.totalContribution : inv.investedAmount;
}

// Returns [left label, left value, right label, right value] for the card footer strip.
function cardContext(
  inv: InvestmentView,
  currency: string,
): [string, string, string, string] {
  const rate = inv.ratePct != null ? `${inv.ratePct}% p.a.` : '—';
  const maturity = inv.maturityDate ? fmtDate(inv.maturityDate) : 'No maturity';
  const monthly = inv.monthlyAmount != null ? fmt(inv.monthlyAmount, currency) : '—';

  switch (inv.kind) {
    case 'fd':
      return ['Rate', rate, 'Matures', maturity];
    case 'rd':
      return ['Monthly', monthly, 'Matures', maturity];
    case 'sip':
      return ['Monthly', monthly, inv.maturityDate ? 'Until' : 'Status', inv.maturityDate ? maturity : 'Ongoing'];
    case 'ppf':
      return ['Monthly', monthly, 'Matures', maturity];
    case 'equity':
      return ['Rate', rate, 'Current', inv.currentValue != null ? fmt(inv.currentValue, currency) : 'Market-linked'];
  }
}

export function InvestmentsView() {
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';
  const router = useRouter();
  const searchParams = useSearchParams();
  const [modalOpen,  setModalOpen]  = useState(false);
  const [editing,    setEditing]    = useState<InvestmentView | null>(null);
  const [detailInv,  setDetailInv]  = useState<InvestmentView | null>(null);
  const [deleteId,   setDeleteId]   = useState<string | null>(null);

  // The context-aware FAB links here with ?new=1 — open the add form, then strip
  // the param so a refresh (or back nav) doesn't reopen it.
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null);
      setModalOpen(true);
      router.replace('/investments');
    }
  }, [searchParams, router]);

  const { data: investments, isLoading } = useInvestments();
  const deleteInv = useDeleteInvestment();

  const list = investments ?? [];
  const totalInvested  = list.reduce((s, i) => s + effectiveInvested(i), 0);
  const totalProjected = list.reduce((s, i) => s + i.projectedValue, 0);
  const totalReturn    = list.reduce((s, i) => s + i.expectedReturn, 0);

  function openCreate() { setEditing(null); setModalOpen(true); }
  function openEdit(inv: InvestmentView) { setEditing(inv); setModalOpen(true); }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Heading level={2}>Investments</Heading>
        <Button onClick={openCreate} size="sm" leftIcon={<Plus size={16} strokeWidth={2.4} />}>
          Add investment
        </Button>
      </div>

      {list.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Invested"  value={totalInvested}  format={(n) => fmt(n, currency)} icon={Wallet}    tone="brand" gradient />
          <StatCard label="Projected Value" value={totalProjected} format={(n) => fmt(n, currency)} icon={LineChart} tone="aqua" />
          <StatCard label="Expected Return" value={totalReturn}    format={(n) => fmt(n, currency)} icon={TrendingUp} tone={totalReturn >= 0 ? 'success' : 'danger'} />
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={LineChart}
          title="No investments yet"
          description="Track FDs, SIPs, PPF and equity in one place"
          action={{ label: 'Add investment', onClick: openCreate }}
        />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {list.map((inv) => {
            const gainTone = inv.expectedReturn >= 0 ? 'success' : 'danger';
            const invested = effectiveInvested(inv);
            const [leftLabel, leftVal, rightLabel, rightVal] = cardContext(inv, currency);

            return (
              <Card
                key={inv._id}
                variant="glass"
                interactive
                className="group cursor-pointer"
                onClick={() => setDetailInv(inv)}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span
                      className="inline-flex w-10 h-10 rounded-xl items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: `${inv.color}22` }}
                      aria-hidden
                    >
                      {inv.icon}
                    </span>
                    <div className="min-w-0">
                      <Text as="span" className="font-semibold truncate block text-slate-900 dark:text-slate-100">{inv.name}</Text>
                      <Badge variant="brand" className="mt-0.5">{KIND_LABEL[inv.kind]}</Badge>
                    </div>
                  </div>
                  {/* Buttons stop propagation so they don't open the detail modal */}
                  <div
                    className="flex items-center gap-1 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(inv)}
                      className="text-slate-400 hover:text-brand-500 p-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      aria-label="Edit investment"
                    >
                      <Pencil size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteId(inv._id)}
                      className="text-slate-400 hover:text-danger-500 p-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      aria-label="Delete investment"
                    >
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </div>

                {/* Financial summary */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex items-baseline justify-between">
                    <Text as="span" variant="small">Invested</Text>
                    <Text as="span" className="font-bold tabular-nums text-slate-900 dark:text-slate-50">
                      {fmt(invested, currency)}
                    </Text>
                  </div>
                  <div className="flex items-baseline justify-between gap-2">
                    <Text as="span" variant="small">Projected</Text>
                    <div className="flex items-baseline gap-2 min-w-0">
                      <Text as="span" className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                        {fmt(inv.projectedValue, currency)}
                      </Text>
                      <Text
                        as="span"
                        variant="small"
                        className={cn(
                          'font-semibold tabular-nums shrink-0',
                          gainTone === 'success' ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400',
                        )}
                      >
                        {inv.expectedReturn >= 0 ? '+' : ''}{fmt(inv.expectedReturn, currency)}
                      </Text>
                    </div>
                  </div>
                </div>

                {/* Contextual footer strip */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div>
                    <Text as="span" variant="small" className="block text-slate-400">{leftLabel}</Text>
                    <Text as="span" variant="small" className="font-medium tabular-nums text-slate-700 dark:text-slate-300">{leftVal}</Text>
                  </div>
                  <div className="text-right">
                    <Text as="span" variant="small" className="block text-slate-400">{rightLabel}</Text>
                    <Text as="span" variant="small" className="font-medium text-slate-700 dark:text-slate-300">{rightVal}</Text>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <InvestmentDetailModal
        inv={detailInv}
        currency={currency}
        onClose={() => setDetailInv(null)}
        onEdit={(inv) => { setDetailInv(null); openEdit(inv); }}
        onDelete={(id) => { setDetailInv(null); setDeleteId(id); }}
      />

      <InvestmentForm open={modalOpen} onClose={() => setModalOpen(false)} editInvestment={editing} />

      <ConfirmDialog
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteInv.mutate(deleteId!)}
        title="Delete investment?"
        description="This investment record will be permanently removed."
        loading={deleteInv.isPending}
      />
    </div>
  );
}
