import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { ISO4217Currencies } from '@finbuddy/shared';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';

const TIMEZONES = ['Asia/Kolkata', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Europe/Paris', 'Asia/Tokyo', 'Asia/Singapore', 'Australia/Sydney'];

const STARTER_CATEGORIES = [
  { name: 'Food & Dining', icon: '🍔', type: 'expense' },
  { name: 'Transport', icon: '🚗', type: 'expense' },
  { name: 'Shopping', icon: '🛍️', type: 'expense' },
  { name: 'Entertainment', icon: '🎬', type: 'expense' },
  { name: 'Health', icon: '💊', type: 'expense' },
  { name: 'Salary', icon: '💼', type: 'income' },
];

export function Onboarding() {
  const [step, setStep] = useState(1);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(STARTER_CATEGORIES.map((c) => c.name));
  const navigate = useNavigate();
  const { refetchUser } = useAuth();

  const { register, handleSubmit, watch } = useForm({
    defaultValues: { currency: 'INR', timezone: 'Asia/Kolkata' },
  });

  const savePrefs = useMutation({
    mutationFn: (data: { currency?: string; timezone: string }) =>
      api.patch('/api/user/preferences', { timezone: data.timezone }),
  });

  function skip() {
    void navigate('/dashboard');
  }

  async function onStep1(data: { currency: string; timezone: string }) {
    await savePrefs.mutateAsync(data);
    await refetchUser();
    setStep(2);
  }

  function onStep2() {
    setStep(3);
  }

  function onStep3() {
    void navigate('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-indigo-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className={`h-2 rounded-full transition-all ${s === step ? 'w-8 bg-brand-600' : s < step ? 'w-4 bg-brand-400' : 'w-4 bg-slate-300 dark:bg-slate-700'}`} />
          ))}
        </div>

        <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-xl p-8">
          {step === 1 && (
            <form onSubmit={handleSubmit(onStep1)} className="space-y-4">
              <div className="text-center mb-6">
                <span className="text-4xl">🌍</span>
                <h2 className="text-xl font-bold mt-2">Set your preferences</h2>
                <p className="text-sm text-slate-500 mt-1">Choose your currency and timezone</p>
              </div>
              <Select
                label="Currency"
                {...register('currency')}
                options={ISO4217Currencies.map((c) => ({ value: c, label: c }))}
              />
              <Select
                label="Timezone"
                {...register('timezone')}
                options={TIMEZONES.map((t) => ({ value: t, label: t }))}
              />
              <div className="flex gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={skip} className="flex-1">Skip</Button>
                <Button type="submit" className="flex-1" loading={savePrefs.isPending}>Next →</Button>
              </div>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="text-center mb-6">
                <span className="text-4xl">🗂️</span>
                <h2 className="text-xl font-bold mt-2">Pick starter categories</h2>
                <p className="text-sm text-slate-500 mt-1">You can always add more later</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {STARTER_CATEGORIES.map((cat) => {
                  const selected = selectedCategories.includes(cat.name);
                  return (
                    <button
                      key={cat.name}
                      onClick={() => setSelectedCategories((prev) =>
                        selected ? prev.filter((c) => c !== cat.name) : [...prev, cat.name]
                      )}
                      className={`flex items-center gap-2 p-3 rounded-xl border text-sm font-medium transition-colors ${
                        selected
                          ? 'bg-brand-50 dark:bg-brand-950/40 border-brand-300 dark:border-brand-700 text-brand-700 dark:text-brand-300'
                          : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <span>{cat.icon}</span><span>{cat.name}</span>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="ghost" onClick={() => setStep(1)} className="flex-1">← Back</Button>
                <Button onClick={onStep2} className="flex-1">Next →</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6">
              <div>
                <span className="text-5xl">🎉</span>
                <h2 className="text-xl font-bold mt-3">You're all set!</h2>
                <p className="text-sm text-slate-500 mt-1">Add your first transaction to get started</p>
              </div>
              <Button onClick={onStep3} className="w-full" size="lg">Go to Dashboard →</Button>
            </div>
          )}
        </div>

        <button onClick={skip} className="mt-4 w-full text-center text-xs text-slate-400 hover:text-slate-600">
          Skip setup for now
        </button>
      </div>
    </div>
  );
}
