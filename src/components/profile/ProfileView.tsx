'use client';

import { useState } from 'react';
import {
  Trophy, Medal, Award, Sprout, Download, FileSpreadsheet,
  CalendarDays, ShieldAlert, Trash2, AlertTriangle, type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ENDPOINTS } from '@/lib/endpoints';
import { fmtDate } from '@/lib/utils';
import { useDeleteAccount, useExportJson } from '@/hooks/useUser';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { IconBadge } from '@/components/ui/IconBadge';

function getMilestoneBadge(createdAt: string): { icon: LucideIcon; label: string } {
  const days = (Date.now() - new Date(createdAt).getTime()) / 86400000;
  if (days >= 365 * 5) return { icon: Trophy, label: '5-Year Member' };
  if (days >= 365) return { icon: Medal, label: '1-Year Member' };
  if (days >= 180) return { icon: Award, label: '6-Month Member' };
  if (days >= 30) return { icon: Award, label: '1-Month Member' };
  return { icon: Sprout, label: 'New Member' };
}

export function ProfileView() {
  const { user, logout } = useAuth();
  const [deleteModal, setDeleteModal] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');

  const exportData = useExportJson();
  const deleteAccount = useDeleteAccount();

  function onDelete() {
    deleteAccount.mutate(confirmEmail, { onSuccess: () => void logout() });
  }

  if (!user) return null;

  const badge = getMilestoneBadge(user.createdAt);
  const BadgeIcon = badge.icon;

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
      <Heading level={1}>Profile</Heading>

      {/* Identity card with aurora header */}
      <Card variant="glass" padding="none" className="overflow-hidden shadow-card-lg">
        <div className="relative h-24 bg-aurora bg-[length:200%_200%] animate-gradient-shift">
          <div className="absolute inset-0 bg-glow-radial opacity-60" aria-hidden />
        </div>
        <div className="px-6 pb-6 -mt-12 text-center">
          {user.avatar ? (
            // Plain img: external Google avatar URL needs referrerPolicy and no next/image loader/domain config.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full mx-auto mb-3 ring-4 ring-white dark:ring-ink-900 shadow-card object-cover" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-24 h-24 rounded-full bg-aurora text-white flex items-center justify-center mx-auto mb-3 ring-4 ring-white dark:ring-ink-900 shadow-card text-4xl font-display font-bold">
              {user.name[0]}
            </div>
          )}
          <Heading level={2} className="text-xl">{user.name}</Heading>
          <Text variant="muted">{user.email}</Text>
          <div className="flex flex-wrap justify-center gap-2 mt-3">
            <Badge variant="brand" className="gap-1">
              <BadgeIcon size={13} strokeWidth={2.4} />{badge.label}
            </Badge>
            <Badge variant="default">{user.currency}</Badge>
          </div>
          <div className="flex items-center justify-center gap-1.5 mt-3 text-slate-500 dark:text-slate-400">
            <CalendarDays size={14} strokeWidth={2.2} />
            <Text variant="small">Member since {fmtDate(user.createdAt)}</Text>
          </div>
        </div>
      </Card>

      {/* Data & privacy */}
      <Card>
        <div className="flex items-center gap-3 mb-4">
          <IconBadge icon={Download} tone="aqua" />
          <Heading level={3}>Data &amp; Privacy</Heading>
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <Text className="font-medium">Export all data</Text>
              <Text variant="small">Download a complete JSON backup</Text>
            </div>
            <Button variant="secondary" size="sm" loading={exportData.isPending} onClick={() => exportData.mutate()} leftIcon={<Download size={15} strokeWidth={2.2} />}>
              Export JSON
            </Button>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div>
              <Text className="font-medium">Export transactions</Text>
              <Text variant="small">Download CSV for spreadsheets</Text>
            </div>
            {/* Full-page download of a server-streamed CSV — a real anchor, not the client router. */}
            <a
              href={ENDPOINTS.export.transactionsCsv}
              download
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold bg-slate-100 dark:bg-ink-800 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-ink-700 active:scale-[0.97] transition-all duration-200"
            >
              <FileSpreadsheet size={15} strokeWidth={2.2} />
              Export CSV
            </a>
          </div>
        </div>
      </Card>

      {/* Danger zone */}
      <Card className="border-danger-200 dark:border-danger-500/30 bg-danger-50/40 dark:bg-danger-500/[0.06]">
        <div className="flex items-center gap-3 mb-4">
          <IconBadge icon={ShieldAlert} tone="danger" />
          <Heading level={3} className="text-danger-600 dark:text-danger-400">Danger Zone</Heading>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <Text className="font-medium">Delete account</Text>
            <Text variant="small">Permanently deletes all your data. Cannot be undone.</Text>
          </div>
          <Button variant="danger" size="sm" onClick={() => setDeleteModal(true)} leftIcon={<Trash2 size={15} strokeWidth={2.2} />}>Delete</Button>
        </div>
      </Card>

      <Modal
        open={deleteModal}
        onClose={() => setDeleteModal(false)}
        title="Delete Account"
        placement="center"
        footer={
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setDeleteModal(false)} className="flex-1">Cancel</Button>
            <Button
              variant="danger"
              onClick={onDelete}
              disabled={confirmEmail !== user.email}
              loading={deleteAccount.isPending}
              className="flex-1"
            >
              Permanently Delete
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start gap-2.5 p-3 bg-danger-50 dark:bg-danger-500/10 rounded-xl text-danger-700 dark:text-danger-300">
            <AlertTriangle size={18} strokeWidth={2.2} className="shrink-0 mt-0.5" />
            <Text as="span" className="text-sm text-danger-700 dark:text-danger-300">This will permanently delete your account and all data. This cannot be undone.</Text>
          </div>
          <Text>Type your email address to confirm:</Text>
          <Input
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder={user.email}
          />
        </div>
      </Modal>
    </div>
  );
}
