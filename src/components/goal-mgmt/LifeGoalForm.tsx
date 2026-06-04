'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateLifeGoal, useUpdateLifeGoal, type LifeGoal } from '@/hooks/useLifeGoals';
import { LifeGoalAreaEnum, LifeGoalStatusEnum, type CreateLifeGoal } from '@/shared';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { IconPicker } from '@/components/ui/IconPicker';

const AREA_OPTIONS = ['personal', 'health', 'career', 'learning', 'finance', 'relationships', 'other'].map((a) => ({
  value: a,
  label: a.charAt(0).toUpperCase() + a.slice(1),
}));
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'achieved', label: 'Achieved' },
  { value: 'archived', label: 'Archived' },
];

const FormSchema = z.object({
  title: z.string().min(1, 'Give your goal a title'),
  area: LifeGoalAreaEnum,
  icon: z.string().optional(),
  description: z.string().optional(),
  targetValue: z.string().optional(),
  unit: z.string().optional(),
  manualProgress: z.string().optional(),
  targetDate: z.string().optional(),
  status: LifeGoalStatusEnum.optional(),
});
type FormValues = z.infer<typeof FormSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  editGoal?: LifeGoal | null;
}

export function LifeGoalForm({ open, onClose, editGoal }: Props) {
  const create = useCreateLifeGoal();
  const update = useUpdateLifeGoal(editGoal?._id ?? '');
  const isPending = editGoal ? update.isPending : create.isPending;

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { area: 'personal', icon: '', status: 'active' },
  });

  useEffect(() => {
    if (editGoal) {
      reset({
        title: editGoal.title,
        area: editGoal.area,
        icon: editGoal.icon,
        description: editGoal.description ?? '',
        targetValue: editGoal.targetValue?.toString() ?? '',
        unit: editGoal.unit ?? '',
        manualProgress: editGoal.manualProgress?.toString() ?? '',
        targetDate: editGoal.targetDate ? editGoal.targetDate.split('T')[0] : '',
        status: editGoal.status,
      });
    } else {
      reset({ area: 'personal', icon: '', status: 'active', title: '', description: '' });
    }
  }, [editGoal, reset, open]);

  const hasTarget = !!watch('targetValue');

  function onSubmit(v: FormValues) {
    const targetDate = v.targetDate ? new Date(v.targetDate).toISOString() : undefined;
    if (editGoal) {
      update.mutate(
        {
          title: v.title,
          area: v.area,
          icon: v.icon || '',
          description: v.description || undefined,
          targetValue: v.targetValue ? Number(v.targetValue) : undefined,
          unit: v.unit || undefined,
          manualProgress: !v.targetValue && v.manualProgress ? Number(v.manualProgress) : undefined,
          targetDate,
          status: v.status ?? 'active',
        },
        { onSuccess: onClose },
      );
    } else {
      const payload: CreateLifeGoal = {
        title: v.title,
        area: v.area,
        icon: v.icon || '',
        color: '#14B8A6',
        description: v.description || undefined,
        status: 'active',
        targetValue: v.targetValue ? Number(v.targetValue) : undefined,
        unit: v.unit || undefined,
        manualProgress: !v.targetValue && v.manualProgress ? Number(v.manualProgress) : undefined,
        targetDate,
        currentValue: 0,
      };
      create.mutate(payload, { onSuccess: onClose });
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editGoal ? 'Edit Goal' : 'New Goal'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-[7rem_1fr] gap-3">
          <IconPicker label="Icon" value={watch('icon') ?? '🎯'} onChange={(v) => setValue('icon', v)} />
          <Input label="Title" placeholder="e.g. Read 12 books" error={errors.title?.message} {...register('title')} />
        </div>

        <Select label="Area" options={AREA_OPTIONS} {...register('area')} />

        <Textarea label="Description (optional)" rows={2} placeholder="Why does this matter?" {...register('description')} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Target (optional)" type="number" step="any" placeholder="e.g. 12" {...register('targetValue')} />
          <Input label="Unit (optional)" placeholder="books, km, sessions…" {...register('unit')} />
        </div>

        {!hasTarget && (
          <Input
            label="Progress % (optional)"
            type="number"
            min={0}
            max={100}
            placeholder="0–100 for goals without a number target"
            {...register('manualProgress')}
          />
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Target date (optional)" type="date" {...register('targetDate')} />
          {editGoal && <Select label="Status" options={STATUS_OPTIONS} {...register('status')} />}
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
          <Button type="submit" variant="gradient" loading={isPending} className="flex-1">
            {editGoal ? 'Save' : 'Create Goal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
