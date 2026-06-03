'use client';

import { useState } from 'react';
import { Sparkles, CornerDownLeft } from 'lucide-react';
import { useQuickParse } from '@/hooks/useQuickAdd';
import { useCategories } from '@/hooks/useCategories';
import { parseQuickAdd } from '@/lib/quickParse';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { TransactionForm } from '@/components/transaction/TransactionForm';

type Prefill = {
  amount: number;
  type: 'income' | 'expense' | 'transfer' | 'investment';
  categoryId: string;
  paymentMethod: 'cash' | 'card' | 'upi' | 'netbanking' | 'wallet' | 'cheque' | 'other';
  note?: string;
};

export function QuickAddBar() {
  const [text, setText] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [prefill, setPrefill] = useState<Partial<Prefill> | null>(null);
  const [hint, setHint] = useState<string | null>(null);

  const parse = useQuickParse();
  const { data: categories, isLoading: catsLoading } = useCategories();

  function submit() {
    const trimmed = text.trim();
    if (!trimmed || parse.isPending) return;
    // The local matcher needs the category list; if it's still loading, wait
    // rather than mis-route to Gemini (the Add button is disabled in this state —
    // this guards the Enter key). Once loaded, parsing is instant + offline.
    if (catsLoading) return;
    setHint(null);

    // Local-first: most entries parse in-browser with no network call.
    const local = parseQuickAdd(trimmed, categories ?? []);
    if (local) {
      setPrefill(local);
      setFormOpen(true);
      setText('');
      return;
    }

    // Local parser unsure. Use Gemini only when online; offline, open a blank
    // form pre-noted with the raw text so the entry is never lost.
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setPrefill({ note: trimmed });
      setHint("You're offline — finish this one manually.");
      setFormOpen(true);
      setText('');
      return;
    }

    parse.mutate(trimmed, {
      onSuccess: (draft) => {
        setPrefill(draft);
        setFormOpen(true);
        setText('');
      },
      // Gemini couldn't read it either — open a blank form so the user can still
      // add it manually without friction.
      onError: () => {
        setHint("Couldn't read that — fill it in manually.");
        setPrefill(null);
        setFormOpen(true);
        setText('');
      },
    });
  }

  function closeForm() {
    setFormOpen(false);
    setPrefill(null);
  }

  return (
    <>
      <Card variant="glass" padding="sm">
        <form
          onSubmit={(e) => { e.preventDefault(); submit(); }}
          className="flex items-center gap-2"
        >
          <Sparkles size={18} strokeWidth={2.2} className="shrink-0 text-brand-500" />
          <div className="flex-1">
            <Input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Quick add — try “coffee 200 upi”"
              aria-label="Quick add a transaction in plain language"
            />
          </div>
          <Button
            type="submit"
            size="sm"
            variant="gradient"
            loading={parse.isPending || catsLoading}
            disabled={!text.trim() || catsLoading}
            leftIcon={<CornerDownLeft size={15} strokeWidth={2.4} />}
            className="shrink-0"
          >
            Add
          </Button>
        </form>
        {hint && <Text variant="small" className="mt-2 text-warn-600 dark:text-warn-400">{hint}</Text>}
      </Card>

      <TransactionForm
        open={formOpen}
        onClose={closeForm}
        categories={categories ?? []}
        prefill={prefill}
      />
    </>
  );
}
