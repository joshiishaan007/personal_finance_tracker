'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { fmt, fmtDate, cn } from '@/lib/utils';
import type { InvestmentView, InvestmentKind } from '@/shared';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Text } from '@/components/ui/Text';

const KIND_LABEL: Record<InvestmentKind, string> = {
  fd: 'Fixed Deposit', rd: 'Recurring Deposit',
  sip: 'SIP', ppf: 'PPF', equity: 'Equity',
};

const COMPOUNDING_LABEL: Record<string, string> = {
  monthly: 'Monthly', quarterly: 'Quarterly',
  halfyearly: 'Half-yearly', yearly: 'Yearly',
};

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86_400_000);
}

function maturityLabel(dateStr: string): string {
  const d = daysUntil(dateStr);
  if (d < 0) return `matured ${Math.abs(d)}d ago`;
  if (d === 0) return 'matures today';
  if (d < 30) return `in ${d}d`;
  if (d < 365) return `in ${Math.round(d / 30)}mo`;
  return `in ${(d / 365).toFixed(1)}y`;
}

interface Props {
  inv: InvestmentView | null;
  currency: string;
  onClose: () => void;
  onEdit: (inv: InvestmentView) => void;
  onDelete: (id: string) => void;
}

export function InvestmentDetailModal({ inv, currency, onClose, onEdit, onDelete }: Props) {
  if (!inv) return null;

  const effectiveInvested =
    inv.kind === 'fd' || inv.kind === 'equity' ? inv.totalContribution : inv.investedAmount;
  const returnPct =
    effectiveInvested > 0 ? ((inv.expectedReturn / effectiveInvested) * 100).toFixed(1) : null;
  const gainTone = inv.expectedReturn >= 0 ? 'success' : 'danger';

  return (
    <Modal open={!!inv} onClose={onClose} title={inv.name} className="max-w-sm">
      {/* Icon + type + status */}
      <div className="flex items-center gap-3 mb-4">
        <span
          className="inline-flex w-12 h-12 rounded-2xl items-center justify-center text-2xl shrink-0"
          style={{ backgroundColor: `${inv.color}22` }}
          aria-hidden
        >
          {inv.icon}
        </span>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="brand">{KIND_LABEL[inv.kind]}</Badge>
          <Badge variant={inv.status === 'active' ? 'success' : inv.status === 'matured' ? 'warn' : 'default'}>
            {inv.status.charAt(0).toUpperCase() + inv.status.slice(1)}
          </Badge>
        </div>
      </div>

      {/* Financial summary — 3 tiles */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <SummaryTile label="Invested" value={fmt(effectiveInvested, currency)} />
        <SummaryTile label="Projected" value={fmt(inv.projectedValue, currency)} />
        <SummaryTile
          label="Return"
          value={`${inv.expectedReturn >= 0 ? '+' : ''}${fmt(inv.expectedReturn, currency)}`}
          sub={returnPct ? `${inv.expectedReturn >= 0 ? '+' : ''}${returnPct}%` : undefined}
          tone={gainTone}
        />
      </div>

      {/* Detail rows */}
      <div className="space-y-2.5 border-t border-slate-100 dark:border-slate-800 pt-4">
        <DetailRow label="Start date" value={fmtDate(inv.startDate)} />
        {inv.maturityDate && (
          <DetailRow
            label="Maturity date"
            value={`${fmtDate(inv.maturityDate)}`}
            sub={maturityLabel(inv.maturityDate)}
          />
        )}
        {(inv.tenureMonths != null || inv.tenureDays != null) && (
          <DetailRow
            label="Tenure"
            value={[
              inv.tenureMonths ? `${inv.tenureMonths} months` : null,
              inv.tenureDays ? `${inv.tenureDays} days` : null,
            ]
              .filter(Boolean)
              .join(' ')}
          />
        )}
        {inv.ratePct != null && (
          <DetailRow label="Rate" value={`${inv.ratePct}% p.a.`} />
        )}
        {inv.compounding && (
          <DetailRow label="Compounding" value={COMPOUNDING_LABEL[inv.compounding] ?? inv.compounding} />
        )}
        {inv.monthlyAmount != null && inv.monthlyAmount > 0 && (
          <DetailRow label="Monthly" value={fmt(inv.monthlyAmount, currency)} />
        )}
        {inv.principal != null && inv.principal > 0 && (
          <DetailRow label="Principal" value={fmt(inv.principal, currency)} />
        )}
        {inv.currentValue != null && inv.currentValue > 0 && (
          <DetailRow label="Current value" value={fmt(inv.currentValue, currency)} />
        )}
        {inv.note && <DetailRow label="Note" value={inv.note} />}
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
        <Button
          variant="secondary"
          size="sm"
          className="flex-1"
          leftIcon={<Pencil size={15} />}
          onClick={() => { onEdit(inv); onClose(); }}
        >
          Edit
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="flex-1 text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-950/40"
          leftIcon={<Trash2 size={15} />}
          onClick={() => { onDelete(inv._id); onClose(); }}
        >
          Delete
        </Button>
      </div>
    </Modal>
  );
}

function SummaryTile({
  label, value, sub, tone,
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'success' | 'danger';
}) {
  return (
    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2.5 text-center">
      <Text as="span" variant="small" className="block mb-0.5 text-slate-500">{label}</Text>
      <Text
        as="span"
        className={cn(
          'text-xs font-bold tabular-nums block',
          tone === 'success' ? 'text-success-600 dark:text-success-400' :
          tone === 'danger'  ? 'text-danger-600 dark:text-danger-400' :
          'text-slate-900 dark:text-slate-100',
        )}
      >
        {value}
      </Text>
      {sub && (
        <Text
          as="span"
          variant="small"
          className={cn(
            tone === 'success' ? 'text-success-500' :
            tone === 'danger'  ? 'text-danger-500' :
            'text-slate-400',
          )}
        >
          {sub}
        </Text>
      )}
    </div>
  );
}

function DetailRow({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <Text as="span" variant="small" className="shrink-0 text-slate-500">{label}</Text>
      <div className="text-right">
        <Text as="span" variant="small" className="text-slate-900 dark:text-slate-200 font-medium">{value}</Text>
        {sub && (
          <Text as="span" variant="small" className="block text-slate-400">{sub}</Text>
        )}
      </div>
    </div>
  );
}
