'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Target, Trophy, CheckCircle2, PauseCircle, CalendarClock, TrendingUp } from 'lucide-react';
import { fmt, fmtDate, cn } from '@/lib/utils';
import { toMinorUnits } from '@/shared';
import { useAuth } from '@/contexts/AuthContext';
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, type Goal } from '@/hooks/useGoals';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ColorInput } from '@/components/ui/ColorInput';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Label } from '@/components/ui/Label';
import { IconBadge } from '@/components/ui/IconBadge';
import { ProgressRing } from '@/components/ProgressRing';
import { ConfettiBurst } from '@/components/ConfettiBurst';
import { EmptyState } from '@/components/EmptyState';

const FormSchema = z.object({
  title: z.string().min(1).max(100),
  targetAmount: z.coerce.number().positive(),
  savedAmount: z.coerce.number().min(0).default(0),
  deadline: z.string().optional(),
  icon: z.string().default('🎯'),
  color: z.string().default('#6366F1'),
});

type FormValues = z.infer<typeof FormSchema>;

// Treat the seed default brand hex as "no custom color" so the ring uses the
// Aurora gradient; a user-picked color renders as a solid ring stroke.
const DEFAULT_COLOR = '#6366F1';

export function GoalsView() {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [confetti, setConfetti] = useState(false);
  const currency = user?.currency ?? 'INR';

  const { data: goals, isLoading } = useGoals();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
  });

  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  function onSubmit(values: FormValues) {
    const payload = {
      ...values,
      targetAmount: toMinorUnits(values.targetAmount, currency as 'INR'),
      savedAmount: toMinorUnits(values.savedAmount ?? 0, currency as 'INR'),
      deadline: values.deadline ? new Date(values.deadline).toISOString() : undefined,
    };
    const onSuccess = () => {
      reset();
      setModalOpen(false);
      setEditGoal(null);
    };
    if (editGoal) {
      updateGoal.mutate({ id: editGoal._id, data: payload }, { onSuccess });
    } else {
      createGoal.mutate({ ...payload, status: 'active' }, { onSuccess });
    }
  }

  const markAchieved = useUpdateGoal();
  function onMarkAchieved(id: string) {
    markAchieved.mutate(
      { id, data: { status: 'achieved' } },
      {
        onSuccess: () => {
          setConfetti(true);
          setTimeout(() => setConfetti(false), 100);
        },
      },
    );
  }

  function openEdit(goal: Goal) {
    setEditGoal(goal);
    reset({
      title: goal.title,
      targetAmount: goal.targetAmount / 100,
      savedAmount: goal.savedAmount / 100,
      deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
      icon: goal.icon,
      color: goal.color,
    });
    setModalOpen(true);
  }

  function projectDate(goal: Goal): string | null {
    if (!goal.savedAmount || !goal.createdAt) return null;
    const daysSinceStart = (Date.now() - new Date(goal.createdAt).getTime()) / 86400000;
    const ratePerDay = goal.savedAmount / Math.max(daysSinceStart, 1);
    const remaining = goal.targetAmount - goal.savedAmount;
    if (ratePerDay <= 0) return null;
    const daysLeft = remaining / ratePerDay;
    const projDate = new Date(Date.now() + daysLeft * 86400000);
    return fmtDate(projDate);
  }

  const saving = createGoal.isPending || updateGoal.isPending;
  const list = goals ?? [];

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <ConfettiBurst trigger={confetti} />
      <div className="flex items-center justify-between gap-3">
        <Heading level={2}>Goals</Heading>
        <Button onClick={() => { setEditGoal(null); reset(); setModalOpen(true); }} size="sm" leftIcon={<Plus size={16} strokeWidth={2.4} />}>
          New Goal
        </Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-48 rounded-2xl" />)}</div>
      ) : list.length === 0 ? (
        <EmptyState icon={Target} title="No goals yet" description="Set a savings goal and watch your progress!" action={{ label: 'New Goal', onClick: () => setModalOpen(true) }} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {list.map((goal) => {
            const pct = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
            const proj = projectDate(goal);
            const milestones = [25, 50, 75, 100];
            const custom = goal.color && goal.color.toLowerCase() !== DEFAULT_COLOR.toLowerCase();

            return (
              <Card key={goal._id} variant="glass" interactive className="group relative">
                {goal.status !== 'active' && (
                  <Badge variant={goal.status === 'achieved' ? 'success' : 'default'} className="absolute top-3 right-3 gap-1">
                    {goal.status === 'achieved'
                      ? <><CheckCircle2 size={12} strokeWidth={2.4} /> Achieved</>
                      : <><PauseCircle size={12} strokeWidth={2.4} /> Paused</>}
                  </Badge>
                )}
                <div className="flex items-start gap-4">
                  <ProgressRing pct={pct} size={84} strokeWidth={7} {...(custom ? { color: goal.color } : {})} label={`${goal.title}: ${Math.round(pct)}%`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <IconBadge icon={Target} tone="brand" size="sm" />
                      <Text as="span" aria-hidden>{goal.icon}</Text>
                    </div>
                    <Heading level={4} className="truncate">{goal.title}</Heading>
                    <Text as="span" className="mt-1 block font-bold tabular-nums text-slate-900 dark:text-slate-50">{fmt(goal.savedAmount, currency)}</Text>
                    <Text as="span" variant="small" className="tabular-nums">of {fmt(goal.targetAmount, currency)}</Text>
                    {goal.deadline && (
                      <Text as="span" variant="small" className="mt-1 flex items-center gap-1">
                        <CalendarClock size={12} /> Due {fmtDate(goal.deadline)}
                      </Text>
                    )}
                    {proj && pct < 100 && (
                      <Text as="span" variant="small" className="mt-0.5 flex items-center gap-1 text-brand-500 dark:text-brand-400">
                        <TrendingUp size={12} /> At current rate: {proj}
                      </Text>
                    )}
                  </div>
                </div>

                <div className="flex gap-1 mt-4">
                  {milestones.map((m) => (
                    <div
                      key={m}
                      className={cn(
                        'flex-1 h-1.5 rounded-full transition-colors',
                        goal.milestonesHit.includes(m) || pct >= m ? 'bg-gradient-to-r from-success-400 to-success-500' : 'bg-slate-200 dark:bg-ink-800',
                      )}
                      title={`${m}% milestone`}
                    />
                  ))}
                </div>

                <div className="flex gap-2 mt-3 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(goal)}>Edit</Button>
                  {goal.status === 'active' && pct >= 100 && (
                    <Button size="sm" variant="gradient" leftIcon={<Trophy size={14} strokeWidth={2.4} />} onClick={() => onMarkAchieved(goal._id)}>Mark Achieved</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm('Delete goal?')) deleteGoal.mutate(goal._id); }}>Delete</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditGoal(null); }} title={editGoal ? 'Edit Goal' : 'New Goal'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex gap-3">
            <Input label="Icon" {...register('icon')} className="w-20" />
            <div className="flex-1"><Input label="Goal Name" error={errors.title?.message} {...register('title')} /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Target Amount" type="number" step="0.01" error={errors.targetAmount?.message} {...register('targetAmount')} />
            <Input label="Already Saved" type="number" step="0.01" {...register('savedAmount')} />
          </div>
          <Input label="Deadline (optional)" type="date" {...register('deadline')} />
          <div className="flex items-center gap-2">
            <Label>Color</Label>
            <ColorInput {...register('color')} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setModalOpen(false); setEditGoal(null); }} className="flex-1">Cancel</Button>
            <Button type="submit" loading={saving} className="flex-1">{editGoal ? 'Save Changes' : 'Create Goal'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
