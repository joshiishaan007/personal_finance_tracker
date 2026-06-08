'use client';

import { CheckCircle2, Circle, Trash2, Clock } from 'lucide-react';
import { fmtDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import type { Task } from '@/hooks/useTasks';

const PRIORITY_DOT: Record<string, string> = {
  high: 'bg-danger-500',
  med:  'bg-warn-400',
  low:  'bg-success-500',
};

const PRIORITY_TITLE: Record<string, string> = {
  high: 'High priority',
  med:  'Medium priority',
  low:  'Low priority',
};

// End-of-day sentinel (23:59) means no specific time was chosen — show date only.
function formatDue(dueDate: string): { label: string; hasTime: boolean } {
  const d = new Date(dueDate);
  const isEod = d.getHours() === 23 && d.getMinutes() >= 59;
  const dateLabel = fmtDate(dueDate);
  if (isEod) return { label: `Due ${dateLabel}`, hasTime: false };
  const timeLabel = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return { label: `Due ${dateLabel}`, hasTime: true, ...{ timeLabel } } as { label: string; hasTime: boolean };
}

export function TaskItem({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const overdue = !task.done && task.dueDate && new Date(task.dueDate) < new Date();
  const due = task.dueDate ? formatDue(task.dueDate) : null;
  const timeLabel = task.dueDate && !(() => {
    const d = new Date(task.dueDate!);
    return d.getHours() === 23 && d.getMinutes() >= 59;
  })()
    ? new Date(task.dueDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="group flex items-center gap-2.5 rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2.5 dark:border-white/[0.06] dark:bg-ink-900/60">
      <Button
        variant="ghost"
        size="sm"
        className="min-h-0 p-1 shrink-0"
        onClick={onToggle}
        aria-label={task.done ? 'Mark not done' : 'Mark done'}
      >
        {task.done
          ? <CheckCircle2 size={20} className="text-success-500" />
          : <Circle size={20} className="text-slate-400" />}
      </Button>

      {/* Priority dot */}
      <div
        className={cn('w-2 h-2 rounded-full shrink-0', PRIORITY_DOT[task.priority] ?? 'bg-warn-400')}
        title={PRIORITY_TITLE[task.priority]}
      />

      <div className="min-w-0 flex-1">
        <Text className={cn('truncate text-sm', task.done && 'text-slate-400 line-through')}>
          {task.title}
        </Text>
        {due && (
          <div className={cn('flex items-center gap-1 mt-0.5', overdue ? 'text-danger-500' : 'text-slate-400')}>
            <Text variant="small" className="leading-none">{due.label}</Text>
            {timeLabel && (
              <>
                <Clock size={10} strokeWidth={2} className="shrink-0" />
                <Text variant="small" className="leading-none tabular-nums">{timeLabel}</Text>
              </>
            )}
          </div>
        )}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="min-h-0 p-1 hover:text-danger-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onDelete}
        aria-label="Delete task"
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );
}
