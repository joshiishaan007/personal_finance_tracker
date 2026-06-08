'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toMinorUnits, type Currency } from '@/shared';
import type { CreateInvestment, InvestmentView, InvestmentKind } from '@/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateInvestment, useUpdateInvestment } from '@/hooks/useInvestments';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Text } from '@/components/ui/Text';
import { Modal } from '@/components/ui/Modal';
import { IconPicker } from '@/components/ui/IconPicker';
import { DatePicker } from '@/components/ui/DatePicker';

// Deterministic accent per investment kind so cards look visually distinct
// without asking the user to pick a color.
const KIND_COLORS: Record<string, string> = {
  fd: '#0EA5E9',
  rd: '#10B981',
  sip: '#8B5CF6',
  equity: '#F59E0B',
  ppf: '#14B8A6',
};

const FormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(80),
  kind: z.enum(['fd', 'rd', 'sip', 'equity', 'ppf']),
  icon: z.string().max(10),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  startDate: z.string().min(1, 'Start date is required'),
  status: z.enum(['active', 'matured', 'closed']),
  ratePct: z.coerce.number().min(0).max(100).optional(),
  // Duration split into Y/M/D — converted to tenureMonths + tenureDays on submit.
  tenureYears: z.coerce.number().int().min(0).max(100).optional(),
  tenureMonthsPart: z.coerce.number().int().min(0).max(11).optional(),
  tenureDays: z.coerce.number().int().min(0).max(30).optional(),
  compounding: z.enum(['monthly', 'quarterly', 'halfyearly', 'yearly']).optional(),
  principal: z.coerce.number().min(0).optional(),
  monthlyAmount: z.coerce.number().min(0).optional(),
  currentValue: z.coerce.number().min(0).optional(),
  note: z.string().max(300).optional(),
});

type FormValues = z.infer<typeof FormSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  editInvestment?: InvestmentView | null;
}

const KIND_OPTIONS = [
  { value: 'fd',     label: 'Fixed Deposit'    },
  { value: 'rd',     label: 'Recurring Deposit'},
  { value: 'sip',    label: 'SIP / Mutual Fund'},
  { value: 'ppf',    label: 'PPF'              },
  { value: 'equity', label: 'Equity / Stocks'  },
];

const COMPOUNDING_OPTIONS = [
  { value: 'monthly',    label: 'Monthly'    },
  { value: 'quarterly',  label: 'Quarterly'  },
  { value: 'halfyearly', label: 'Half-yearly'},
  { value: 'yearly',     label: 'Yearly'     },
];

const STATUS_OPTIONS = [
  { value: 'active',   label: 'Active'  },
  { value: 'matured',  label: 'Matured' },
  { value: 'closed',   label: 'Closed'  },
];

// Which money/parameter fields each kind asks for.
const showsPrincipal    = (k: InvestmentKind) => k === 'fd' || k === 'equity';
const showsMonthly      = (k: InvestmentKind) => k === 'rd' || k === 'sip' || k === 'ppf';
const showsCompounding  = (k: InvestmentKind) => k === 'fd';
const showsCurrentValue = (k: InvestmentKind) => k === 'equity';
// Days improve compound-interest accuracy; only meaningful for FD.
const showsDays         = (k: InvestmentKind) => k === 'fd';

export function InvestmentForm({ open, onClose, editInvestment }: Props) {
  const { user } = useAuth();
  const currency = (user?.currency ?? 'INR') as Currency;

  const createInv = useCreateInvestment();
  const updateInv = useUpdateInvestment(editInvestment?._id ?? '');
  const isPending = editInvestment ? updateInv.isPending : createInv.isPending;

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      kind: 'fd',
      icon: '💹',
      color: '#6366F1',
      status: 'active',
      compounding: 'quarterly',
      startDate: new Date().toISOString().split('T')[0],
    },
  });

  const kind = watch('kind');

  useEffect(() => {
    if (editInvestment) {
      const tm = editInvestment.tenureMonths ?? 0;
      reset({
        name:             editInvestment.name,
        kind:             editInvestment.kind,
        icon:             editInvestment.icon,
        color:            editInvestment.color,
        startDate:        editInvestment.startDate.split('T')[0],
        status:           editInvestment.status,
        ratePct:          editInvestment.ratePct,
        // Decompose stored tenureMonths back into years + remainder months + days.
        tenureYears:      tm ? Math.floor(tm / 12) : undefined,
        tenureMonthsPart: tm ? tm % 12 : undefined,
        tenureDays:       editInvestment.tenureDays,
        compounding:      editInvestment.compounding,
        principal:        editInvestment.principal     != null ? editInvestment.principal     / 100 : undefined,
        monthlyAmount:    editInvestment.monthlyAmount != null ? editInvestment.monthlyAmount / 100 : undefined,
        currentValue:     editInvestment.currentValue  != null ? editInvestment.currentValue  / 100 : undefined,
        note:             editInvestment.note ?? '',
      });
    } else {
      reset({
        kind: 'fd',
        icon: '💹',
        color: KIND_COLORS['fd'],
        status: 'active',
        compounding: 'quarterly',
        startDate: new Date().toISOString().split('T')[0],
      });
    }
  }, [editInvestment, reset, open]);

  // Keep color in sync with kind for new investments so cards look distinct.
  useEffect(() => {
    if (!editInvestment) setValue('color', KIND_COLORS[kind] ?? '#6366F1');
  }, [kind, editInvestment, setValue]);

  function onSubmit(values: FormValues) {
    const k = values.kind;
    // Recompose Y/M/D into the stored fields.
    const years  = values.tenureYears      ?? 0;
    const months = values.tenureMonthsPart ?? 0;
    const days   = values.tenureDays       ?? 0;
    const tenureMonths = years * 12 + months || undefined;
    const tenureDays   = days > 0 ? days : undefined;

    const payload: CreateInvestment = {
      name:          values.name,
      kind:          k,
      icon:          values.icon || '💹',
      color:         values.color,
      startDate:     new Date(values.startDate).toISOString(),
      status:        values.status,
      ratePct:       values.ratePct,
      tenureMonths,
      tenureDays,
      compounding:   showsCompounding(k) ? values.compounding : undefined,
      principal:     showsPrincipal(k)    && values.principal     != null ? toMinorUnits(values.principal,     currency) : undefined,
      monthlyAmount: showsMonthly(k)      && values.monthlyAmount != null ? toMinorUnits(values.monthlyAmount, currency) : undefined,
      currentValue:  showsCurrentValue(k) && values.currentValue  != null ? toMinorUnits(values.currentValue,  currency) : undefined,
      note:          values.note || undefined,
    };

    if (editInvestment) {
      updateInv.mutate(payload, { onSuccess: onClose });
    } else {
      createInv.mutate(payload, { onSuccess: onClose });
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editInvestment ? 'Edit Investment' : 'New Investment'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Name" placeholder="HDFC FD" error={errors.name?.message} {...register('name')} />
          <Select label="Type" options={KIND_OPTIONS} {...register('kind')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {showsPrincipal(kind) && (
            <Input
              label={kind === 'equity' ? 'Amount invested' : 'Principal'}
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.principal?.message}
              {...register('principal')}
            />
          )}
          {showsMonthly(kind) && (
            <Input
              label="Monthly amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.monthlyAmount?.message}
              {...register('monthlyAmount')}
            />
          )}
          {showsCurrentValue(kind) && (
            <Input
              label="Current value (optional)"
              type="number"
              step="0.01"
              placeholder="0.00"
              error={errors.currentValue?.message}
              {...register('currentValue')}
            />
          )}
          <Input
            label={kind === 'equity' ? 'Expected annual % (optional)' : 'Rate %'}
            type="number"
            step="0.01"
            placeholder="0"
            error={errors.ratePct?.message}
            {...register('ratePct')}
          />
        </div>

        {/* Duration — Years / Months / Days */}
        <div>
          <Text as="span" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
            Duration
          </Text>
          <div className={`grid gap-2 ${showsDays(kind) ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <Input
              label="Years"
              type="number"
              min="0"
              max="100"
              placeholder="0"
              {...register('tenureYears')}
            />
            <Input
              label="Months"
              type="number"
              min="0"
              max="11"
              placeholder="0"
              {...register('tenureMonthsPart')}
            />
            {showsDays(kind) && (
              <Input
                label="Days"
                type="number"
                min="0"
                max="30"
                placeholder="0"
                {...register('tenureDays')}
              />
            )}
          </div>
          {showsDays(kind) && (
            <Text variant="small" className="mt-1 text-slate-400">
              e.g. 1 yr 2 mo 14 days — extra days improve maturity interest accuracy
            </Text>
          )}
        </div>

        {showsCompounding(kind) && (
          <Select label="Compounding" options={COMPOUNDING_OPTIONS} {...register('compounding')} />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DatePicker label="Start date" value={watch('startDate')} onChange={(v) => setValue('startDate', v)} error={errors.startDate?.message} />
          <Select label="Status" options={STATUS_OPTIONS} {...register('status')} />
        </div>

        <Controller
          control={control}
          name="icon"
          render={({ field }) => (
            <IconPicker label="Icon" value={field.value} onChange={field.onChange} />
          )}
        />

        <Textarea label="Note (optional)" placeholder="Notes…" rows={2} {...register('note')} />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" variant="gradient" loading={isPending} className="flex-1">
            {editInvestment ? 'Save Changes' : 'Add Investment'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
