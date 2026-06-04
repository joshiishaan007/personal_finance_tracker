import { createHash } from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiRepository as repo } from './ai.repository';
import { categoryRepository } from '../category/category.repository';
import { userRepository } from '../user/user.repository';
import { getEnv } from '../env';
import { logger } from '../logger';
import { Ok, Err, type Result } from '../http/result';
import { ParsedDraftSchema, type Insight, type ParsedDraft, CurrencySymbols, type Currency } from '@/shared';

interface AggregatedContext {
  monthKey: string;
  last3MonthsByCategory: Record<string, number>;
  savingsRate: number;
  incomeTotal: number;
  expenseTotal: number;
  recurringRatio: number;
  activeGoals: Array<{ title: string; progressPct: number; deadline?: string }>;
}

async function buildContext(userId: string): Promise<AggregatedContext> {
  const now = new Date();
  const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);

  const [txAgg, goals] = await Promise.all([
    repo.aggregateSince(userId, threeMonthsAgo),
    repo.activeGoals(userId),
  ]);

  const income = txAgg
    .filter((t) => t._id.type === 'income')
    .reduce((s, t) => s + (t.total as number), 0);
  const expense = txAgg
    .filter((t) => t._id.type === 'expense')
    .reduce((s, t) => s + (t.total as number), 0);
  const recurringExpense = txAgg
    .filter((t) => t._id.type === 'expense' && t._id.isRecurring)
    .reduce((s, t) => s + (t.total as number), 0);

  const categoryMap: Record<string, number> = {};
  for (const t of txAgg.filter((t) => t._id.type === 'expense')) {
    const key = String(t._id.categoryId);
    categoryMap[key] = (categoryMap[key] ?? 0) + (t.total as number);
  }

  return {
    monthKey: `${now.getFullYear()}-${now.getMonth() + 1}`,
    last3MonthsByCategory: categoryMap,
    savingsRate: income > 0 ? Math.round(((income - expense) / income) * 100) : 0,
    incomeTotal: income,
    expenseTotal: expense,
    recurringRatio: income > 0 ? Math.round((recurringExpense / income) * 100) : 0,
    activeGoals: goals.map((g) => ({
      title: g.title,
      progressPct: Math.min(Math.round((g.savedAmount / g.targetAmount) * 100), 100),
      deadline: g.deadline?.toISOString(),
    })),
  };
}

// Build a prompt-friendly context with amounts in major units (rupees/dollars)
// so the model works with human-readable numbers instead of paise/cents.
function toMajorCtx(ctx: AggregatedContext) {
  return {
    monthKey: ctx.monthKey,
    last3MonthsByCategory: Object.fromEntries(
      Object.entries(ctx.last3MonthsByCategory).map(([k, v]) => [k, Math.round(v / 100)]),
    ),
    savingsRate: ctx.savingsRate,
    incomeTotal: Math.round(ctx.incomeTotal / 100),
    expenseTotal: Math.round(ctx.expenseTotal / 100),
    recurringRatio: ctx.recurringRatio,
    activeGoals: ctx.activeGoals,
  };
}

const buildPrompt = (ctx: AggregatedContext, currency: string) => {
  const sym = currency in CurrencySymbols ? CurrencySymbols[currency as Currency] : currency;
  const majorCtx = toMajorCtx(ctx);
  return `
You are a personal finance advisor. Based on the user's financial summary, provide 1-3 concise, personalized insights.
Each insight MUST cite the exact numbers that triggered it.

Financial summary (amounts in ${currency} major units — e.g. ${sym}500 means five hundred ${currency}):
${JSON.stringify(majorCtx, null, 2)}

Respond ONLY with a valid JSON array. Each element must have:
- type: "spending_anomaly" | "savings_opportunity" | "cashflow_warning" | "goal_projection" | "encouragement"
- title: string (max 60 chars)
- body: string (1-2 sentences with specific numbers, prefix amounts with ${sym})
- why: string (formula/numbers that triggered this — shown in tooltip)
- dataPoints: object of key→number pairs (major units)

Example: [{"type":"savings_opportunity","title":"Room to save on Food","body":"You spent ${sym}8400 on Food vs your 3-month average of ${sym}6200.","why":"Current: ${sym}8400. 3mo avg: ${sym}6200. Deviation: +35%","dataPoints":{"currentSpend":8400,"avgSpend":6200}}]
`;
};

// Robustly extract the FIRST complete JSON value (array or object) from LLM
// output that may contain markdown fences, preamble, thinking text, or
// explanatory text after the JSON. Uses bracket counting — not a greedy regex —
// so trailing content can never bleed into the parsed value.
function extractJson(raw: string): unknown | null {
  // Strip markdown code fences (```json ... ``` or ``` ... ```)
  const text = raw.replace(/^```(?:json|javascript)?\s*/im, '').replace(/\s*```\s*$/m, '').trim();

  // Fast path: the whole cleaned text is valid JSON (ideal model output).
  try { return JSON.parse(text); } catch { /* fall through */ }

  // Find the first [ or { and use bracket counting to locate its exact close,
  // ignoring any characters that follow (preamble / explanatory text).
  let startIdx = -1;
  let openChar = '';
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '[' || text[i] === '{') { startIdx = i; openChar = text[i]; break; }
  }
  if (startIdx === -1) return null;

  const closeChar = openChar === '[' ? ']' : '}';
  let depth = 0;
  let inString = false;
  let escape = false;

  for (let i = startIdx; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (inString) {
      if (ch === '\\') escape = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') { inString = true; continue; }
    if (ch === openChar) depth++;
    else if (ch === closeChar && --depth === 0) {
      try { return JSON.parse(text.slice(startIdx, i + 1)); } catch { return null; }
    }
  }
  return null;
}

// External-IO boundary: the ONLY try/catch in this feature, wrapping just the
// third-party Gemini SDK call. Returns the first JSON value or null on any
// failure so callers branch on a value instead of catching. Never logs the key.
async function callGemini(prompt: string): Promise<unknown | null> {
  try {
    const env = getEnv();
    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    // 55s SDK timeout — fires before the 60s maxDuration ceiling so the
    // function returns null cleanly instead of being killed mid-stream.
    const model = genAI.getGenerativeModel({ model: env.GEMINI_MODEL }, { timeout: 55_000 });
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const parsed = extractJson(text);
    if (parsed === null) logger.warn({ text }, 'Gemini response had no parseable JSON');
    return parsed;
  } catch (err) {
    // 429 (free-tier quota exhausted / model has no free allowance) is expected
    // and transient — log it concisely instead of dumping the full error+stack.
    const status = (err as { status?: number } | null)?.status;
    if (status === 429) logger.info({ model: getEnv().GEMINI_MODEL }, 'Gemini quota hit (429) — using fallback');
    else if (status === 404) logger.error({ model: getEnv().GEMINI_MODEL }, 'Gemini model not found — check GEMINI_MODEL in .env.local');
    else logger.warn({ err }, 'Gemini call failed');
    return null;
  }
}

async function generateInsights(prompt: string): Promise<Result<Insight[], 'quota'>> {
  const parsed = await callGemini(prompt);
  if (!Array.isArray(parsed)) return Err('quota');
  return Ok(parsed as Insight[]);
}

const buildParsePrompt = (text: string, cats: Array<{ id: string; name: string; type: string }>) => `
You convert a user's shorthand expense/income note into ONE structured transaction.
Categories (pick the categoryId whose name+type best fits — never invent an id):
${JSON.stringify(cats)}

User note: "${text}"

Respond ONLY with a single JSON object, no prose:
{"amount": number (in major units e.g. rupees, positive), "type": "income"|"expense"|"transfer"|"investment", "categoryId": "<one id from the list, matching the chosen type>", "paymentMethod": "cash"|"card"|"upi"|"netbanking"|"wallet"|"cheque"|"other", "note": "<short cleaned description>"}
If no payment method is mentioned, use "cash". Default type is "expense".
`;

export const aiService = {
  // Read-only: returns the latest stored insight (or null). NEVER calls Gemini —
  // so loading the dashboard never spends quota. Generation is explicit (below).
  async getCached(userId: string) {
    return (await repo.findLatest(userId)) ?? null;
  },

  // Explicit generation (user clicks "Generate"). Returns a cached hit if the data
  // is unchanged; otherwise calls Gemini once. Quota/parse failure → Err('quota')
  // so the client can show a clear message instead of silently retrying.
  async generate(userId: string): Promise<Result<unknown, 'quota'>> {
    const [ctx, user] = await Promise.all([buildContext(userId), userRepository.findById(userId)]);
    const currency = (user?.currency as Currency | undefined) ?? 'INR';
    if (ctx.incomeTotal === 0 && ctx.expenseTotal === 0) return Ok(null);

    const contextHash = createHash('sha256')
      .update(ctx.monthKey + JSON.stringify(ctx.last3MonthsByCategory) + ctx.savingsRate)
      .digest('hex');

    const cached = await repo.findCached(userId, contextHash);
    if (cached) return Ok(cached);

    const gen = await generateInsights(buildPrompt(ctx, currency));
    if (gen.state === 'error') return Err('quota');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    const saved = await repo.replace(userId, { contextHash, insights: gen.data, expiresAt, schemaVersion: 1 });
    logger.info({ userId, count: gen.data.length }, 'AI insights saved');
    return Ok(saved);
  },

  async dismiss(userId: string) {
    await repo.dismissActive(userId);
    return { dismissed: true };
  },

  async parseTransaction(userId: string, text: string): Promise<Result<ParsedDraft, 'bad_request'>> {
    const categories = await categoryRepository.list(userId);
    const catList = categories.map((c) => ({ id: String(c._id), name: c.name, type: c.type }));

    const parsed = await callGemini(buildParsePrompt(text, catList));
    const draft = ParsedDraftSchema.safeParse(parsed);
    if (!draft.success) {
      logger.info({ userId }, 'Quick-add parse failed validation');
      return Err('bad_request');
    }

    // Gemini must pick a real category whose type matches the chosen tx type —
    // reject hallucinated ids so the client never pre-fills a phantom category.
    const match = catList.find((c) => c.id === draft.data.categoryId && c.type === draft.data.type);
    if (!match) {
      logger.info({ userId }, 'Quick-add parse returned unknown/mismatched category');
      return Err('bad_request');
    }

    return Ok(draft.data);
  },
};
