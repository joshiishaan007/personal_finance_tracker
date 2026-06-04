'use client';

import { CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { fmtDate, cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import type { Task } from '@/hooks/useTasks';

export function TaskItem({ task, onToggle, onDelete }: { task: Task; onToggle: () => void; onDelete: () => void }) {
  const overdue = !task.done && task.dueDate && new Date(task.dueDate) < new Date();
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2.5 dark:border-white/[0.06] dark:bg-ink-900/60">
      <Button
        variant="ghost"
        size="sm"
        className="min-h-0 p-1"
        onClick={onToggle}
        aria-label={task.done ? 'Mark not done' : 'Mark done'}
      >
        {task.done
          ? <CheckCircle2 size={20} className="text-success-500" />
          : <Circle size={20} className="text-slate-400" />}
      </Button>
      <div className="min-w-0 flex-1">
        <Text className={cn('truncate text-sm', task.done && 'text-slate-400 line-through')}>{task.title}</Text>
        {task.dueDate && (
          <Text variant="small" className={cn(overdue ? 'text-danger-500' : '')}>Due {fmtDate(task.dueDate)}</Text>
        )}
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="min-h-0 p-1 hover:text-danger-500 sm:opacity-0 sm:group-hover:opacity-100"
        onClick={onDelete}
        aria-label="Delete task"
      >
        <Trash2 size={15} />
      </Button>
    </div>
  );
}
