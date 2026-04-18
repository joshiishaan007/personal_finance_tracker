import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { api } from '../lib/api';
import { toMinorUnits } from '@finbuddy/shared';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';

const FormSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['income', 'expense', 'transfer', 'investment']),
  categoryId: z.string().min(1, 'Select a category'),
  date: z.string(),
  note: z.string().max(500).optional(),
  paymentMethod: z.enum(['cash', 'card', 'upi', 'netbanking', 'wallet', 'cheque', 'other']),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

interface Category { _id: string; name: string; icon: string; type: string; }
interface Transaction {
  _id: string; amount: number; type: string; categoryId: string;
  date: string; note?: string; paymentMethod: string; tags: string[];
}

interface Props {
  open: boolean;
  onClose: () => void;
  editTx?: Transaction | null;
  categories: Category[];
}

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'upi', label: 'UPI' },
  { value: 'netbanking', label: 'Net Banking' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'other', label: 'Other' },
];

export function TransactionForm({ open, onClose, editTx, categories }: Props) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const currency = user?.currency ?? 'INR';

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash',
    },
  });

  const selectedType = watch('type');
  const filteredCategories = categories.filter((c) => c.type === selectedType);

  useEffect(() => {
    if (editTx) {
      reset({
        amount: editTx.amount / 100,
        type: editTx.type as FormValues['type'],
        categoryId: editTx.categoryId,
        date: editTx.date.split('T')[0],
        note: editTx.note ?? '',
        paymentMethod: editTx.paymentMethod as FormValues['paymentMethod'],
        tags: editTx.tags.join(', '),
      });
    } else {
      reset({ type: 'expense', date: new Date().toISOString().split('T')[0], paymentMethod: 'cash' });
    }
  }, [editTx, reset, open]);

  const save = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        ...values,
        amount: toMinorUnits(values.amount, currency as 'INR'),
        date: new Date(values.date).toISOString(),
        tags: values.tags ? values.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      };
      if (editTx) {
        return api.patch(`/api/transactions/${editTx._id}`, payload);
      }
      return api.post('/api/transactions', payload);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['transactions'] });
      void qc.invalidateQueries({ queryKey: ['analytics'] });
      onClose();
    },
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editTx ? 'Edit Transaction' : 'New Transaction'}
    >
      <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            error={errors.amount?.message}
            {...register('amount')}
          />
          <Select
            label="Type"
            options={[
              { value: 'expense', label: 'Expense' },
              { value: 'income', label: 'Income' },
              { value: 'transfer', label: 'Transfer' },
              { value: 'investment', label: 'Investment' },
            ]}
            {...register('type')}
          />
        </div>

        <Select
          label="Category"
          error={errors.categoryId?.message}
          options={[
            { value: '', label: 'Select category…' },
            ...filteredCategories.map((c) => ({ value: c._id, label: `${c.icon} ${c.name}` })),
          ]}
          {...register('categoryId')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Date"
            type="date"
            error={errors.date?.message}
            {...register('date')}
          />
          <Select
            label="Payment Method"
            options={PAYMENT_METHODS}
            {...register('paymentMethod')}
          />
        </div>

        <Input
          label="Note (optional)"
          placeholder="What was this for?"
          {...register('note')}
        />
        <Input
          label="Tags (comma-separated)"
          placeholder="food, family, work…"
          {...register('tags')}
        />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" loading={save.isPending} className="flex-1">
            {editTx ? 'Save Changes' : 'Add Transaction'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
