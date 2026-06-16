'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toMinorUnits, type Currency, type CreateLoan } from '@/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useCreateLoan, useUpdateLoan, type LoanView } from '@/hooks/useLoans';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { DatePicker } from '@/components/ui/DatePicker';

const KIND_OPTIONS = [
  { value: 'home', label: 'Home' },
  { value: 'car', label: 'Car / Vehicle' },
  { value: 'personal', label: 'Personal' },
  { value: 'education', label: 'Education' },
  { value: 'gold', label: 'Gold' },
  { value: 'business', label: 'Business' },
  { value: 'credit-card', label: 'Credit card' },
  { value: 'other', label: 'Other' },
];
const STATUS_OPTIONS = [{ value: 'active', label: 'Active' }, { value: 'closed', label: 'Closed' }];

const FormSchema = z.object({
  name: z.string().min(1, 'Name your loan'),
  lender: z.string().optional(),
  kind: z.enum(['home', 'car', 'personal', 'education', 'gold', 'business', 'credit-card', 'other']),
  principal: z.string().min(1, 'Enter the loan amount'),
  interestRatePct: z.string().optional(),
  emiAmount: z.string().min(1, 'Enter the EMI'),
  tenureMonths: z.string().min(1, 'Enter the tenure'),
  startDate: z.string(),
  note: z.string().optional(),
  status: z.enum(['active', 'closed']).optional(),
});
type FormValues = z.infer<typeof FormSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  editLoan?: LoanView | null;
}

export function LoanForm({ open, onClose, editLoan }: Props) {
  const { user } = useAuth();
  const currency = (user?.currency ?? 'INR') as Currency;
  const create = useCreateLoan();
  const update = useUpdateLoan(editLoan?._id ?? '');
  const isPending = editLoan ? update.isPending : create.isPending;

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { kind: 'personal', startDate: new Date().toISOString().split('T')[0], status: 'active' },
  });

  useEffect(() => {
    if (editLoan) {
      reset({
        name: editLoan.name,
        lender: editLoan.lender ?? '',
        kind: editLoan.kind,
        principal: String(editLoan.principal / 100),
        interestRatePct: editLoan.interestRatePct?.toString() ?? '',
        emiAmount: String(editLoan.emiAmount / 100),
        tenureMonths: String(editLoan.tenureMonths),
        startDate: editLoan.startDate.split('T')[0],
        note: editLoan.note ?? '',
        status: editLoan.status,
      });
    } else {
      reset({ kind: 'personal', startDate: new Date().toISOString().split('T')[0], status: 'active', name: '', lender: '' });
    }
  }, [editLoan, reset, open]);

  function onSubmit(v: FormValues) {
    const shared = {
      name: v.name,
      lender: v.lender || undefined,
      kind: v.kind,
      principal: toMinorUnits(Number(v.principal), currency),
      interestRatePct: v.interestRatePct ? Number(v.interestRatePct) : undefined,
      emiAmount: toMinorUnits(Number(v.emiAmount), currency),
      tenureMonths: Number(v.tenureMonths),
      startDate: new Date(v.startDate).toISOString(),
      note: v.note || undefined,
    };
    if (editLoan) {
      update.mutate({ ...shared, status: v.status ?? 'active' }, { onSuccess: onClose });
    } else {
      create.mutate({ ...shared, status: 'active' } as CreateLoan, { onSuccess: onClose });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editLoan ? 'Edit loan' : 'New loan'}
      footer={
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" form="loan-form" variant="gradient" loading={isPending} className="flex-1">
            {editLoan ? 'Save changes' : 'Add loan'}
          </Button>
        </div>
      }
    >
      <form id="loan-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Loan name" placeholder="e.g. Home loan" error={errors.name?.message} {...register('name')} />
          <Input label="Lender (optional)" placeholder="e.g. HDFC" {...register('lender')} />
        </div>

        <Select label="Type" options={KIND_OPTIONS} {...register('kind')} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Loan amount" type="number" step="0.01" min="0" placeholder="0.00" error={errors.principal?.message} {...register('principal')} />
          <Input label="Interest % p.a. (optional)" type="number" step="0.01" min="0" placeholder="e.g. 8.5" {...register('interestRatePct')} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Monthly EMI" type="number" step="0.01" min="0" placeholder="0.00" error={errors.emiAmount?.message} {...register('emiAmount')} />
          <Input label="Tenure (months)" type="number" step="1" min="1" placeholder="e.g. 60" error={errors.tenureMonths?.message} {...register('tenureMonths')} />
        </div>

        <div className={`grid gap-3 ${editLoan ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
          <DatePicker label="Start date" value={watch('startDate')} onChange={(val) => setValue('startDate', val)} error={errors.startDate?.message} />
          {editLoan && <Select label="Status" options={STATUS_OPTIONS} {...register('status')} />}
        </div>

        <Textarea label="Note (optional)" rows={2} placeholder="Account number, remarks…" {...register('note')} />
      </form>
    </Modal>
  );
}
