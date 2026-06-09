'use client';

import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warn';
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading,
}: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      placement="center"
      footer={
        <div className="flex w-full gap-3">
          <Button type="button" variant="secondary" onClick={onClose} className="flex-1">
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            onClick={() => { onConfirm(); onClose(); }}
            loading={loading}
            className="flex-1"
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-4 py-2 text-center">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full',
            variant === 'danger'
              ? 'bg-danger-50 dark:bg-danger-900/30'
              : 'bg-warn-50 dark:bg-warn-900/30',
          )}
        >
          <AlertTriangle
            size={22}
            strokeWidth={2}
            className={variant === 'danger' ? 'text-danger-500' : 'text-warn-500'}
          />
        </div>
        <div className="space-y-1">
          <Text className="font-semibold text-slate-900 dark:text-slate-100">{title}</Text>
          {description && (
            <Text variant="small" className="text-slate-500">{description}</Text>
          )}
        </div>
      </div>
    </Modal>
  );
}
