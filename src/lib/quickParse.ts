import type { ParsedDraft } from '@/shared';

// Local, zero-API parser for the quick-add bar. Handles the common
// "<note> <amount> <method>" shorthand entirely in the browser so the vast
// majority of entries never call Gemini (free, instant, works offline).
// Returns null when it isn't confident (no amount, or no category match) — the
// caller then falls back to Gemini (online) or a blank form (offline).

interface CatLike {
  _id: string;
  name: string;
  type: string;
}

const METHOD_KEYWORDS: Record<string, ParsedDraft['paymentMethod']> = {
  upi: 'upi', gpay: 'upi', googlepay: 'upi', phonepe: 'upi', paytm: 'upi', bhim: 'upi',
  card: 'card', credit: 'card', debit: 'card', visa: 'card', mastercard: 'card',
  cash: 'cash',
  netbanking: 'netbanking', neft: 'netbanking', imps: 'netbanking', rtgs: 'netbanking', bank: 'netbanking',
  wallet: 'wallet',
  cheque: 'cheque', check: 'cheque',
};

const INCOME_WORDS = new Set([
  'salary', 'received', 'refund', 'income', 'credited', 'bonus', 'interest', 'dividend', 'cashback',
]);

// Maps a spoken keyword to a fragment of the user's category names (default
// categories are "Food & Dining", "Transport", etc.).
const CATEGORY_KEYWORDS: Array<{ words: string[]; match: string }> = [
  { words: ['coffee', 'tea', 'lunch', 'dinner', 'breakfast', 'food', 'restaurant', 'snack', 'pizza', 'swiggy', 'zomato', 'grocery', 'groceries'], match: 'food' },
  { words: ['uber', 'ola', 'metro', 'bus', 'train', 'fuel', 'petrol', 'diesel', 'cab', 'taxi', 'auto', 'transport'], match: 'transport' },
  { words: ['movie', 'netflix', 'game', 'spotify', 'entertainment'], match: 'entertainment' },
  { words: ['rent'], match: 'rent' },
  { words: ['electricity', 'water', 'gas', 'bill', 'internet', 'wifi', 'recharge', 'utility', 'utilities'], match: 'utilities' },
  { words: ['medicine', 'doctor', 'hospital', 'pharmacy', 'medical', 'health'], match: 'health' },
  { words: ['shopping', 'amazon', 'flipkart', 'clothes', 'myntra'], match: 'shopping' },
  { words: ['salary', 'paycheck'], match: 'salary' },
];

function findCategory(tokens: string[], type: string, categories: CatLike[]): string | null {
  const ofType = categories.filter((c) => c.type === type);
  if (ofType.length === 0) return null;

  // 1) direct: a category's own name word appears in the input.
  for (const c of ofType) {
    const nameWords = c.name.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 2);
    if (nameWords.some((w) => tokens.includes(w))) return c._id;
  }

  // 2) keyword map → match against category names.
  for (const { words, match } of CATEGORY_KEYWORDS) {
    if (tokens.some((t) => words.includes(t))) {
      const hit = ofType.find((c) => c.name.toLowerCase().includes(match));
      if (hit) return hit._id;
    }
  }

  return null;
}

export function parseQuickAdd(text: string, categories: CatLike[]): ParsedDraft | null {
  const lower = text.trim().toLowerCase();
  if (!lower) return null;

  const amountMatch = lower.match(/\b(\d+(?:\.\d+)?)(k)?\b/);
  if (!amountMatch) return null;
  let amount = parseFloat(amountMatch[1]!);
  if (amountMatch[2]) amount *= 1000; // "1.5k" → 1500
  if (!(amount > 0)) return null;

  const tokens = lower.split(/\s+/);

  const methodToken = tokens.find((t) => t in METHOD_KEYWORDS);
  const paymentMethod = methodToken ? METHOD_KEYWORDS[methodToken]! : 'cash';

  const type: ParsedDraft['type'] = tokens.some((t) => INCOME_WORDS.has(t)) ? 'income' : 'expense';

  const categoryId = findCategory(tokens, type, categories);
  if (!categoryId) return null;

  // Drop the method token and any amount-like token (incl. a currency prefix
  // such as "₹250" or a "1.5k" suffix) from the human-readable note.
  const note = tokens
    .filter((t) => t !== methodToken && !/^[₹$€£¥]?\d+(?:\.\d+)?k?$/.test(t))
    .join(' ')
    .trim();

  return { amount, type, categoryId, paymentMethod, note: note || undefined };
}
