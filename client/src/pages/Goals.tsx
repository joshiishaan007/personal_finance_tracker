import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../lib/api';
import { fmt, fmtDate } from '../lib/utils';
import { toMinorUnits } from '@finbuddy/shared';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { ProgressRing } from '../components/ProgressRing';
import { ConfettiBurst } from '../components/ConfettiBurst';
import { EmptyState } from '../components/EmptyState';
import { Badge } from '../components/ui/Badge';

interface Goal {
  _id: string;
  title: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: string;
  icon: string;
  color: string;
  status: 'active' | 'achieved' | 'paused';
  milestonesHit: number[];
  createdAt: string;
}

const FormSchema = z.object({
  title: z.string().min(1).max(100),
  targetAmount: z.coerce.number().positive(),
  savedAmount: z.coerce.number().min(0).default(0),
  deadline: z.string().optional(),
  icon: z.string().default('🎯'),
  color: z.string().default('#6366F1'),
});

type FormValues = z.infer<typeof FormSchema>;

export function Goals() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [confetti, setConfetti] = useState(false);
  const currency = user?.currency ?? 'INR';

  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals'],
    queryFn: () => api.get<{ data: Goal[] }>('/api/goals').then((r) => r.data.data),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
  });

  const save = useMutation({
    mutationFn: (values: FormValues) => {
      const payload = {
        ...values,
        targetAmount: toMinorUnits(values.targetAmount, currency as 'INR'),
        savedAmount: toMinorUnits(values.savedAmount ?? 0, currency as 'INR'),
        deadline: values.deadline ? new Date(values.deadline).toISOString() : undefined,
      };
      if (editGoal) return api.patch(`/api/goals/${editGoal._id}`, payload);
      return api.post('/api/goals', payload);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['goals'] });
      reset();
      setModalOpen(false);
      setEditGoal(null);
    },
  });

  const deleteGoal = useMutation({
    mutationFn: (id: string) => api.delete(`/api/goals/${id}`),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['goals'] }),
  });

  const markAchieved = useMutation({
    mutationFn: (id: string) => api.patch(`/api/goals/${id}`, { status: 'achieved' }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['goals'] });
      setConfetti(true);
      setTimeout(() => setConfetti(false), 100);
    },
  });

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

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <ConfettiBurst trigger={confetti} />
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Goals</h1>
        <Button onClick={() => { setEditGoal(null); reset(); setModalOpen(true); }} size="sm">+ New Goal</Button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">{[1, 2, 3].map((i) => <div key={i} className="skeleton h-40 rounded-xl" />)}</div>
      ) : (goals ?? []).length === 0 ? (
        <EmptyState icon="🎯" title="No goals yet" description="Set a savings goal and watch your progress!" action={{ label: '+ New Goal', onClick: () => setModalOpen(true) }} />
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {(goals ?? []).map((goal) => {
            const pct = Math.min((goal.savedAmount / goal.targetAmount) * 100, 100);
            const proj = projectDate(goal);
            const milestones = [25, 50, 75, 100];

            return (
              <Card key={goal._id} className="group relative">
                {goal.status !== 'active' && (
                  <Badge variant={goal.status === 'achieved' ? 'success' : 'default'} className="absolute top-3 right-3">
                    {goal.status === 'achieved' ? '✅ Achieved' : '⏸ Paused'}
                  </Badge>
                )}
                <div className="flex items-start gap-4">
                  <ProgressRing pct={pct} size={72} color={goal.color} label={`${goal.title}: ${Math.round(pct)}%`} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{goal.icon} {goal.title}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {fmt(goal.savedAmount, currency)} of {fmt(goal.targetAmount, currency)}
                    </p>
                    {goal.deadline && (
                      <p className="text-xs text-slate-400 mt-0.5">Due: {fmtDate(goal.deadline)}</p>
                    )}
                    {proj && pct < 100 && (
                      <p className="text-xs text-brand-500 mt-0.5">At current rate: {proj}</p>
                    )}
                  </div>
                </div>

                {/* Milestone indicators */}
                <div className="flex gap-1 mt-3">
                  {milestones.map((m) => (
                    <div
                      key={m}
                      className={`flex-1 h-1.5 rounded-full ${goal.milestonesHit.includes(m) || pct >= m ? 'bg-success-500' : 'bg-slate-200 dark:bg-slate-800'}`}
                      title={`${m}% milestone`}
                    />
                  ))}
                </div>

                <div className="flex gap-2 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="sm" variant="secondary" onClick={() => openEdit(goal)}>Edit</Button>
                  {goal.status === 'active' && pct >= 100 && (
                    <Button size="sm" variant="primary" onClick={() => markAchieved.mutate(goal._id)}>🎉 Mark Achieved</Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => { if (confirm('Delete goal?')) deleteGoal.mutate(goal._id); }}>Delete</Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditGoal(null); }} title={editGoal ? 'Edit Goal' : 'New Goal'}>
        <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-4">
          <div className="flex gap-3">
            <Input label="Icon" {...register('icon')} className="w-20" />
            <div className="flex-1"><Input label="Goal Name" error={errors.title?.message} {...register('title')} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Target Amount" type="number" step="0.01" error={errors.targetAmount?.message} {...register('targetAmount')} />
            <Input label="Already Saved" type="number" step="0.01" {...register('savedAmount')} />
          </div>
          <Input label="Deadline (optional)" type="date" {...register('deadline')} />
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Color</label>
            <input type="color" {...register('color')} className="h-8 w-12 rounded cursor-pointer border border-slate-300" />
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => { setModalOpen(false); setEditGoal(null); }} className="flex-1">Cancel</Button>
            <Button type="submit" loading={save.isPending} className="flex-1">{editGoal ? 'Save Changes' : 'Create Goal'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
