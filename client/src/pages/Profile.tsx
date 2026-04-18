import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { fmtDate } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';

function getMilestoneBadge(createdAt: string): string {
  const days = (Date.now() - new Date(createdAt).getTime()) / 86400000;
  if (days >= 365 * 5) return '🏆 5-Year Member';
  if (days >= 365) return '🥇 1-Year Member';
  if (days >= 180) return '🥈 6-Month Member';
  if (days >= 30) return '🥉 1-Month Member';
  return '🌱 New Member';
}

export function Profile() {
  const { user, logout } = useAuth();
  const [deleteModal, setDeleteModal] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState('');

  const exportData = useMutation({
    mutationFn: () => api.get('/api/export/json', { responseType: 'blob' }),
    onSuccess: (response) => {
      const url = URL.createObjectURL(response.data as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `finbuddy-export-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    },
  });

  const deleteAccount = useMutation({
    mutationFn: () => api.delete('/api/user/account', { data: { confirmEmail } }),
    onSuccess: () => { void logout(); },
  });

  if (!user) return null;

  const badge = getMilestoneBadge(user.createdAt);

  return (
    <div className="p-4 lg:p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Card className="text-center py-8">
        {user.avatar ? (
          <img src={user.avatar} alt={user.name} className="w-20 h-20 rounded-full mx-auto mb-4" referrerPolicy="no-referrer" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-brand-100 dark:bg-brand-900 flex items-center justify-center mx-auto mb-4 text-3xl">
            {user.name[0]}
          </div>
        )}
        <h2 className="text-xl font-bold">{user.name}</h2>
        <p className="text-slate-500 text-sm">{user.email}</p>
        <div className="flex justify-center gap-2 mt-3">
          <Badge variant="brand">{badge}</Badge>
          <Badge variant="default">{user.currency}</Badge>
        </div>
        <p className="text-xs text-slate-400 mt-2">Member since {fmtDate(user.createdAt)}</p>
      </Card>

      <Card>
        <h3 className="font-semibold mb-4">Data & Privacy</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Export all data</p>
              <p className="text-xs text-slate-400">Download a complete JSON backup</p>
            </div>
            <Button variant="secondary" size="sm" loading={exportData.isPending} onClick={() => exportData.mutate()}>
              📥 Export JSON
            </Button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Export transactions</p>
              <p className="text-xs text-slate-400">Download CSV for spreadsheets</p>
            </div>
            <a
              href="/api/export/transactions/csv"
              download
              className="px-3 py-1.5 text-sm font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              📊 Export CSV
            </a>
          </div>
        </div>
      </Card>

      <Card className="border-danger-200 dark:border-danger-900">
        <h3 className="font-semibold text-danger-600 dark:text-danger-400 mb-4">Danger Zone</h3>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Delete account</p>
            <p className="text-xs text-slate-400">Permanently deletes all your data. Cannot be undone.</p>
          </div>
          <Button variant="danger" size="sm" onClick={() => setDeleteModal(true)}>Delete Account</Button>
        </div>
      </Card>

      <Modal open={deleteModal} onClose={() => setDeleteModal(false)} title="Delete Account">
        <div className="space-y-4">
          <div className="p-3 bg-danger-50 dark:bg-danger-950/30 rounded-lg text-sm text-danger-700 dark:text-danger-400">
            ⚠️ This will permanently delete your account and all data. This cannot be undone.
          </div>
          <p className="text-sm">Type your email address to confirm:</p>
          <Input
            value={confirmEmail}
            onChange={(e) => setConfirmEmail(e.target.value)}
            placeholder={user.email}
          />
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setDeleteModal(false)} className="flex-1">Cancel</Button>
            <Button
              variant="danger"
              onClick={() => deleteAccount.mutate()}
              disabled={confirmEmail !== user.email}
              loading={deleteAccount.isPending}
              className="flex-1"
            >
              Permanently Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
