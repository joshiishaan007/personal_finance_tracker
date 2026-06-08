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
import { Text } from '@/components/ui/Text';
import { IconPicker } from '@/components/ui/IconPicker';
import { DatePicker } from '@/components/ui/DatePicker';
import { ColorPicker } from '@/components/ui/ColorPicker';
import { cn } from '@/lib/utils';

const AREAS: { value: string; emoji: string; label: string }[] = [
  { value: 'personal',      emoji: '✨', label: 'Personal'  },
  { value: 'health',        emoji: '❤️', label: 'Health'    },
  { value: 'career',        emoji: '💼', label: 'Career'    },
  { value: 'learning',      emoji: '📚', label: 'Learning'  },
  { value: 'finance',       emoji: '💰', label: 'Finance'   },
  { value: 'relationships', emoji: '🤝', label: 'Relations' },
  { value: 'other',         emoji: '🎯', label: 'Other'     },
];

const STATUS_OPTIONS = [
  { value: 'active',   label: 'Active'   },
  { value: 'paused',   label: 'Paused'   },
  { value: 'achieved', label: 'Achieved' },
  { value: 'archived', label: 'Archived' },
];

const FormSchema = z.object({
  title:          z.string().min(1, 'Give your goal a title'),
  area:           LifeGoalAreaEnum,
  icon:           z.string().optional(),
  color:          z.string().default('#14B8A6'),
  description:    z.string().optional(),
  targetValue:    z.string().optional(),
  unit:           z.string().optional(),
  manualProgress: z.string().optional(),
  targetDate:     z.string().optional(),
  status:         LifeGoalStatusEnum.optional(),
});
type FormValues = z.infer<typeof FormSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  editGoal?: LifeGoal | null;
}

function SectionLabel({ children }: { children: string }) {
  return (
    <Text as="span" className="block text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-2.5">
      {children}
    </Text>
  );
}

function Divider() {
  return <div className="h-px bg-slate-100 dark:bg-white/[0.05]" />;
}

export function LifeGoalForm({ open, onClose, editGoal }: Props) {
  const create = useCreateLifeGoal();
  const update = useUpdateLifeGoal(editGoal?._id ?? '');
  const isPending = editGoal ? update.isPending : create.isPending;

  const {
    register, handleSubmit, reset, watch, setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { area: 'personal', icon: '🎯', color: '#14B8A6', status: 'active' },
  });

  useEffect(() => {
    if (editGoal) {
      reset({
        title:          editGoal.title,
        area:           editGoal.area,
        icon:           editGoal.icon,
        color:          editGoal.color ?? '#14B8A6',
        description:    editGoal.description ?? '',
        targetValue:    editGoal.targetValue?.toString() ?? '',
        unit:           editGoal.unit ?? '',
        manualProgress: editGoal.manualProgress?.toString() ?? '',
        targetDate:     editGoal.targetDate ? editGoal.targetDate.split('T')[0] : '',
        status:         editGoal.status,
      });
    } else {
      reset({ area: 'personal', icon: '🎯', color: '#14B8A6', status: 'active', title: '', description: '' });
    }
  }, [editGoal, reset, open]);

  const currentColor = watch('color') ?? '#14B8A6';
  const currentArea  = watch('area');
  const hasTarget    = !!watch('targetValue');

  function onSubmit(v: FormValues) {
    const targetDate = v.targetDate ? new Date(v.targetDate).toISOString() : undefined;
    const shared = {
      title:          v.title,
      area:           v.area,
      icon:           v.icon || '🎯',
      color:          v.color || '#14B8A6',
      description:    v.description || undefined,
      targetValue:    v.targetValue ? Number(v.targetValue) : undefined,
      unit:           v.unit || undefined,
      manualProgress: !v.targetValue && v.manualProgress ? Number(v.manualProgress) : undefined,
      targetDate,
    };
    if (editGoal) {
      update.mutate({ ...shared, status: v.status ?? 'active' }, { onSuccess: onClose });
    } else {
      const payload: CreateLifeGoal = { ...shared, status: 'active', currentValue: 0 };
      create.mutate(payload, { onSuccess: onClose });
    }
  }

  return (
    <Modal open={open} onClose={onClose} title={editGoal ? 'Edit goal' : 'New goal'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* ── Identity ───────────────────────────────── */}
        <div className="space-y-4">
          {/* Icon + title — items-end aligns inputs despite different label heights */}
          <div className="grid grid-cols-[5rem_1fr] gap-3 items-end">
            <IconPicker label="Icon" value={watch('icon') ?? '🎯'} onChange={(v) => setValue('icon', v)} />
            <Input
              label="Goal title"
              placeholder="e.g. Read 12 books this year"
              error={errors.title?.message}
              {...register('title')}
            />
          </div>

          <ColorPicker
            label="Colour"
            value={currentColor}
            onChange={(v) => setValue('color', v)}
          />
        </div>

        <Divider />

        {/* ── Area ───────────────────────────────────── */}
        <div>
          <SectionLabel>Area</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {AREAS.map((a) => {
              const active = currentArea === a.value;
              return (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setValue('area', a.value as FormValues['area'])}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all select-none',
                    active
                      ? 'text-white shadow-sm scale-[1.02]'
                      : 'bg-slate-50 dark:bg-ink-800/60 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-white/10 hover:border-brand-300 dark:hover:border-brand-700 hover:text-brand-600 dark:hover:text-brand-300',
                  )}
                  style={active ? { backgroundColor: currentColor, border: `1px solid ${currentColor}` } : undefined}
                  aria-pressed={active}
                >
                  <span className="text-base leading-none">{a.emoji}</span>
                  <span>{a.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <Divider />

        {/* ── Details ────────────────────────────────── */}
        <div className="space-y-3">
          <SectionLabel>Details</SectionLabel>

          <Textarea
            label="Why does this matter? (optional)"
            rows={2}
            placeholder="A bit of context keeps you motivated on tough days…"
            {...register('description')}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Target (optional)"
              type="number"
              step="any"
              min="0"
              placeholder="e.g. 12"
              {...register('targetValue')}
            />
            <Input
              label="Unit (optional)"
              placeholder="books, km…"
              {...register('unit')}
            />
          </div>

          {!hasTarget && (
            <Input
              label="Manual progress % (optional)"
              type="number"
              min={0}
              max={100}
              placeholder="0–100 for goals without a numeric target"
              {...register('manualProgress')}
            />
          )}

          <div className={cn('grid gap-3', editGoal ? 'grid-cols-2' : 'grid-cols-1')}>
            <DatePicker
              label="Target date (optional)"
              value={watch('targetDate')}
              onChange={(v) => setValue('targetDate', v)}
            />
            {editGoal && <Select label="Status" options={STATUS_OPTIONS} {...register('status')} />}
          </div>
        </div>

        {/* ── Actions ────────────────────────────────── */}
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button
            type="submit"
            variant="gradient"
            loading={isPending}
            className="flex-1"
            style={!isPending ? { background: `linear-gradient(135deg, ${currentColor} 0%, ${currentColor}cc 100%)` } : undefined}
          >
            {editGoal ? 'Save changes' : 'Create goal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
