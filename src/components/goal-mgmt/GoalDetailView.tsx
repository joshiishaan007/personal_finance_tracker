'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Pencil, Trash2, Plus, ListChecks, CalendarDays, TrendingUp } from 'lucide-react';
import { useLifeGoal, useDeleteLifeGoal, useGoalsToday, lifeGoalProgress } from '@/hooks/useLifeGoals';
import { useContributions, useAddContribution, useDeleteContribution } from '@/hooks/useContributions';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useTasks';
import { LifeGoalForm } from '@/components/goal-mgmt/LifeGoalForm';
import { GoalCalendar } from '@/components/goal-mgmt/GoalCalendar';
import { GoalProgressChart } from '@/components/goal-mgmt/GoalProgressChart';
import { GoalStatsRow } from '@/components/goal-mgmt/GoalStatsRow';
import { TaskItem } from '@/components/goal-mgmt/TaskItem';
import { ConfettiBurst } from '@/components/ConfettiBurst';
import { Card } from '@/components/ui/Card';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { TimePicker } from '@/components/ui/TimePicker';
import { Link } from '@/components/ui/Link';
import { Badge } from '@/components/ui/Badge';
import { ProgressRing } from '@/components/ProgressRing';
import { EmptyState } from '@/components/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { SkeletonLoader } from '@/components/SkeletonLoader';
import { fmtDate, cn } from '@/lib/utils';

function todayStr() {
  return new Date().toISOString().split('T')[0]!;
}

export function GoalDetailView({ goalId }: { goalId: string }) {
  const router = useRouter();
  const { data: goal, isLoading } = useLifeGoal(goalId);
  const { data: contributions = [] } = useContributions(goalId);
  const addContribution = useAddContribution(goalId);
  const delContribution = useDeleteContribution(goalId);
  const { data: tasks } = useTasks({ goalId });
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const deleteGoal = useDeleteLifeGoal();
  const { data: goalsToday } = useGoalsToday();

  const [editOpen,           setEditOpen]           = useState(false);
  const [confirmDelete,      setConfirmDelete]      = useState(false);
  const [deleteContribId,    setDeleteContribId]    = useState<string | null>(null);
  const [deleteTaskId,       setDeleteTaskId]       = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'calendar' | 'chart'>('calendar');

  // Log progress form state
  const [logValue, setLogValue] = useState('');
  const [logNote, setLogNote] = useState('');
  const [logDate, setLogDate] = useState(todayStr);
  const [taskTitle, setTaskTitle]   = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskDueTime, setTaskDueTime] = useState('');
  const [celebrate, setCelebrate] = useState(false);

  // Derived: total contributions for a goal — used to detect 100% hit
  const currentTotal = useMemo(
    () => contributions.reduce((s, c) => s + c.value, 0),
    [contributions],
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl p-4 lg:p-6">
        <SkeletonLoader rows={8} />
      </div>
    );
  }
  if (!goal) {
    return (
      <div className="mx-auto max-w-3xl p-4 lg:p-6">
        <EmptyState
          title="Goal not found"
          action={{ label: 'Back to Goals', onClick: () => router.push('/goals') }}
        />
      </div>
    );
  }

  const pct = lifeGoalProgress(goal);

  function logProgress() {
    if (!goal || addContribution.isPending) return;
    const v = logValue.trim() ? Number(logValue) : 1;
    const dateIso = new Date(logDate + 'T12:00:00').toISOString();
    addContribution.mutate(
      { goalId, value: v, note: logNote.trim() || undefined, date: dateIso },
      {
        onSuccess: () => {
          setLogValue('');
          setLogNote('');
          setLogDate(todayStr());
          const newTotal = currentTotal + v;
          if (goal.targetValue && newTotal >= goal.targetValue) {
            setCelebrate(true);
            setTimeout(() => setCelebrate(false), 2500);
          }
        },
      },
    );
  }

  function buildDueIso(date: string, time: string): string | undefined {
    if (!date) return undefined;
    const d = new Date(date);
    const [h, m] = (time || '23:59').split(':').map(Number);
    d.setHours(h!, m!, 0, 0);
    return d.toISOString();
  }

  function addTask() {
    const t = taskTitle.trim();
    if (!t || createTask.isPending) return;
    createTask.mutate(
      { title: t, done: false, priority: 'med', goalId, dueDate: buildDueIso(taskDueDate, taskDueTime) },
      { onSuccess: () => { setTaskTitle(''); setTaskDueDate(''); setTaskDueTime(''); } },
    );
  }

  function removeGoal() {
    deleteGoal.mutate(goalId, { onSuccess: () => router.push('/goals') });
  }

  const hasMeasurableData = !!goal.targetValue && contributions.length >= 2;

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 lg:p-6">
      <Link href="/goals" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 no-underline transition-colors">
        <ArrowLeft size={14} strokeWidth={2.4} /> Goals
      </Link>

      {/* ── Header ───────────────────────────────────────── */}
      <Card variant="gradient" className="relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="shrink-0">
            <ProgressRing pct={pct} size={72} color={goal.color} strokeWidth={6} />
          </div>
          <div className="min-w-0 flex-1">
            <Heading level={3} className="truncate leading-tight">
              {goal.icon} {goal.title}
            </Heading>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              <Badge variant="brand">{goal.area}</Badge>
              {goal.status !== 'active' && (
                <Badge variant={goal.status === 'achieved' ? 'success' : goal.status === 'paused' ? 'warn' : 'default'}>
                  {goal.status}
                </Badge>
              )}
              {goal.targetValue ? (
                <Text as="span" variant="small" className="tabular-nums font-medium">
                  {goal.currentValue} / {goal.targetValue} {goal.unit ?? ''}
                </Text>
              ) : null}
              {goal.targetDate && (
                <Text as="span" variant="small" className="text-slate-500">
                  by {fmtDate(goal.targetDate)}
                </Text>
              )}
            </div>
            {goal.description && (
              <Text variant="small" className="mt-2 text-slate-500 dark:text-slate-400 line-clamp-2">
                {goal.description}
              </Text>
            )}
          </div>
          <div className="flex flex-col gap-1 shrink-0">
            <Button variant="ghost" size="sm" className="min-h-0 p-2" onClick={() => setEditOpen(true)} aria-label="Edit goal">
              <Pencil size={15} strokeWidth={2.2} />
            </Button>
            <Button variant="ghost" size="sm" className="min-h-0 p-2 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-950/40" onClick={() => setConfirmDelete(true)} aria-label="Delete goal">
              <Trash2 size={15} strokeWidth={2.2} />
            </Button>
          </div>
        </div>
      </Card>

      {/* ── Stats row ────────────────────────────────────── */}
      <GoalStatsRow contributions={contributions} goal={goal} />

      {/* ── Visual section: Calendar + Chart ─────────────── */}
      <Card>
        {/* Tab switcher */}
        <div className="flex items-center gap-1 mb-4 p-0.5 bg-slate-100/80 dark:bg-ink-800/70 rounded-xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
              activeTab === 'calendar'
                ? 'bg-white dark:bg-ink-700 text-slate-800 dark:text-slate-100 shadow-sm'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
            ].join(' ')}
          >
            <CalendarDays size={14} strokeWidth={2.2} />
            Calendar
          </button>
          {hasMeasurableData && (
            <button
              type="button"
              onClick={() => setActiveTab('chart')}
              className={[
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all',
                activeTab === 'chart'
                  ? 'bg-white dark:bg-ink-700 text-slate-800 dark:text-slate-100 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300',
              ].join(' ')}
            >
              <TrendingUp size={14} strokeWidth={2.2} />
              Chart
            </button>
          )}
        </div>

        {activeTab === 'calendar' ? (
          <GoalCalendar contributions={contributions} color={goal.color} unit={goal.unit} />
        ) : (
          <GoalProgressChart contributions={contributions} goal={goal} />
        )}
      </Card>

      {/* ── Log progress ─────────────────────────────────── */}
      <Card>
        <div className="mb-3 flex items-center justify-between gap-2">
          <Heading level={5}>Log progress</Heading>
          {goal.dailyTarget ? (
            <Text as="span" variant="small" className="tabular-nums">
              Today:{' '}
              <Text
                as="span"
                className={cn(
                  'font-semibold',
                  (goalsToday?.[goalId]?.todayValue ?? 0) >= goal.dailyTarget
                    ? 'text-success-600 dark:text-success-500'
                    : 'text-slate-600 dark:text-slate-300',
                )}
              >
                {goalsToday?.[goalId]?.todayValue ?? 0}/{goal.dailyTarget} {goal.unit ?? ''}
              </Text>
            </Text>
          ) : null}
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); logProgress(); }}
          className="space-y-2"
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="number"
              step="any"
              min="0"
              value={logValue}
              onChange={(e) => setLogValue(e.target.value)}
              placeholder={goal.unit ? `+ ${goal.unit}` : '+1'}
              className="sm:w-28"
              aria-label="Progress amount"
            />
            <div className="flex-1">
              <Input
                value={logNote}
                onChange={(e) => setLogNote(e.target.value)}
                placeholder="Note (optional)"
                aria-label="Progress note"
              />
            </div>
            <div className="sm:w-44">
              <DatePicker
                value={logDate}
                onChange={setLogDate}
                max={todayStr()}
                placeholder="Date"
              />
            </div>
          </div>
          <Button
            type="submit"
            variant="gradient"
            loading={addContribution.isPending}
            leftIcon={<Plus size={15} strokeWidth={2.4} />}
            className="w-full sm:w-auto"
          >
            Log progress
          </Button>
        </form>

        {/* Contribution history */}
        <div className="mt-4 space-y-1">
          {contributions.length === 0 ? (
            <Text variant="small" className="text-slate-400">No progress logged yet — add your first entry above.</Text>
          ) : (
            contributions.map((c) => (
              <div
                key={c._id}
                className="group flex items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-ink-800/50 transition-colors"
              >
                <Text as="span" className="text-sm font-bold tabular-nums text-brand-600 dark:text-brand-300 w-12 shrink-0">
                  +{c.value}{goal.unit ? ` ${goal.unit}` : ''}
                </Text>
                <div className="min-w-0 flex-1">
                  <Text className="truncate text-sm">{c.note ?? 'Progress logged'}</Text>
                  <Text variant="small">{fmtDate(c.date)}</Text>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="min-h-0 p-1 hover:text-danger-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setDeleteContribId(c._id)}
                  aria-label="Delete entry"
                >
                  <Trash2 size={13} />
                </Button>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* ── Tasks ────────────────────────────────────────── */}
      <Card>
        <Heading level={5} className="mb-3">Tasks</Heading>
        <form onSubmit={(e) => { e.preventDefault(); addTask(); }} className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Input
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Add a task for this goal…"
                aria-label="New task"
              />
            </div>
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              loading={createTask.isPending}
              disabled={!taskTitle.trim()}
              leftIcon={<Plus size={14} strokeWidth={2.4} />}
            >
              Add
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <DatePicker
                value={taskDueDate}
                onChange={(v) => { setTaskDueDate(v); if (!v) setTaskDueTime(''); }}
                placeholder="Due date (optional)"
              />
            </div>
            <div className="w-32 shrink-0">
              <TimePicker
                value={taskDueTime}
                onChange={setTaskDueTime}
                disabled={!taskDueDate}
              />
            </div>
          </div>
        </form>
        <div className="mt-3 space-y-2">
          {(tasks ?? []).length === 0 ? (
            <Text variant="small" className="flex items-center gap-1.5 text-slate-400">
              <ListChecks size={14} /> No tasks linked yet.
            </Text>
          ) : (
            (tasks ?? []).map((task) => (
              <TaskItem
                key={task._id}
                task={task}
                onToggle={() => updateTask.mutate({ id: task._id, data: { done: !task.done } })}
                onDelete={() => setDeleteTaskId(task._id)}
              />
            ))
          )}
        </div>
      </Card>

      <LifeGoalForm open={editOpen} onClose={() => setEditOpen(false)} editGoal={goal} />
      <ConfettiBurst trigger={celebrate} />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={removeGoal}
        title="Delete this goal?"
        description="All progress logs and tasks for this goal will be permanently deleted. This cannot be undone."
        loading={deleteGoal.isPending}
      />
      <ConfirmDialog
        open={!!deleteContribId}
        onClose={() => setDeleteContribId(null)}
        onConfirm={() => delContribution.mutate(deleteContribId!)}
        title="Delete progress entry?"
        description="This log entry will be removed from your progress history."
        loading={delContribution.isPending}
      />
      <ConfirmDialog
        open={!!deleteTaskId}
        onClose={() => setDeleteTaskId(null)}
        onConfirm={() => deleteTask.mutate(deleteTaskId!)}
        title="Delete task?"
        description="This task will be permanently removed."
        loading={deleteTask.isPending}
      />
    </div>
  );
}
