import { createHash } from "crypto";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { TransactionModel } from "../models/transaction.model";
import { GoalModel } from "../models/goal.model";
import { AIInsightModel } from "../models/aiInsight.model";
import { logger } from "../config/logger";
import { Types } from "mongoose";

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
    TransactionModel.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          date: { $gte: threeMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            type: "$type",
            categoryId: "$categoryId",
            isRecurring: "$isRecurring",
          },
          total: { $sum: "$amount" },
        },
      },
    ]),
    GoalModel.find({ userId, status: "active" }).lean(),
  ]);

  const income = txAgg
    .filter((t) => t._id.type === "income")
    .reduce((s, t) => s + (t.total as number), 0);
  const expense = txAgg
    .filter((t) => t._id.type === "expense")
    .reduce((s, t) => s + (t.total as number), 0);
  const recurringExpense = txAgg
    .filter((t) => t._id.type === "expense" && t._id.isRecurring)
    .reduce((s, t) => s + (t.total as number), 0);

  const categoryMap: Record<string, number> = {};
  for (const t of txAgg.filter((t) => t._id.type === "expense")) {
    const key = String(t._id.categoryId);
    categoryMap[key] = (categoryMap[key] ?? 0) + (t.total as number);
  }

  return {
    monthKey: `${now.getFullYear()}-${now.getMonth() + 1}`,
    last3MonthsByCategory: categoryMap,
    savingsRate:
      income > 0 ? Math.round(((income - expense) / income) * 100) : 0,
    incomeTotal: income,
    expenseTotal: expense,
    recurringRatio:
      income > 0 ? Math.round((recurringExpense / income) * 100) : 0,
    activeGoals: goals.map((g) => ({
      title: g.title,
      progressPct: Math.min(
        Math.round((g.savedAmount / g.targetAmount) * 100),
        100,
      ),
      deadline: g.deadline?.toISOString(),
    })),
  };
}

const buildPrompt = (ctx: AggregatedContext) => `
You are a personal finance advisor. Based on the user's financial summary, provide 1-3 concise, personalized insights.
Each insight MUST cite the exact numbers that triggered it.

Financial summary (amounts in smallest currency unit, e.g. paise):
${JSON.stringify(ctx, null, 2)}

Respond ONLY with a valid JSON array. Each element must have:
- type: "spending_anomaly" | "savings_opportunity" | "cashflow_warning" | "goal_projection" | "encouragement"
- title: string (max 60 chars)
- body: string (1-2 sentences with specific numbers)
- why: string (formula/numbers that triggered this — shown in tooltip)
- dataPoints: object of key→number pairs

Example: [{"type":"savings_opportunity","title":"Room to save on Food","body":"You spent 8400 on Food vs your 3-month average of 6200.","why":"Current: 8400. 3mo avg: 6200. Deviation: +35%","dataPoints":{"currentSpend":8400,"avgSpend":6200}}]
`;

export async function getOrGenerateInsights(userId: string, apiKey: string) {
  const ctx = await buildContext(userId);

  // Need at least some transaction data to generate meaningful insights
  if (ctx.incomeTotal === 0 && ctx.expenseTotal === 0) {
    logger.info({ userId }, 'AI insights skipped — no transaction data yet');
    return null;
  }

  const contextHash = createHash("sha256")
    .update(ctx.monthKey + JSON.stringify(ctx.last3MonthsByCategory) + ctx.savingsRate)
    .digest("hex");

  // Return cached insight if hash matches and not expired/dismissed
  const cached = await AIInsightModel.findOne({
    userId,
    contextHash,
    expiresAt: { $gt: new Date() },
    dismissedAt: { $exists: false },
  }).lean();
  if (cached) {
    logger.info({ userId }, 'Returning cached AI insight (hash match)');
    return cached;
  }

  // Fall back to any previous insight if Gemini fails — better than nothing
  const previousInsight = await AIInsightModel.findOne({
    userId,
    dismissedAt: { $exists: false },
  }).sort({ generatedAt: -1 }).lean();

  try {
    logger.info({ userId, incomeTotal: ctx.incomeTotal, expenseTotal: ctx.expenseTotal }, 'Calling Gemini for insights');
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    const result = await model.generateContent(buildPrompt(ctx));
    const text = result.response.text().trim();
    logger.debug({ userId, text }, 'Gemini raw response');

    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      logger.warn({ userId, text }, 'Gemini response had no JSON array');
      return previousInsight ?? null;
    }

    const insights = JSON.parse(jsonMatch[0]) as Array<{
      type: string;
      title: string;
      body: string;
      why: string;
      dataPoints: Record<string, number>;
    }>;

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await AIInsightModel.deleteMany({ userId });
    const saved = await AIInsightModel.create({
      userId,
      contextHash,
      insights,
      expiresAt,
      schemaVersion: 1,
    });
    logger.info({ userId, count: insights.length }, 'AI insights saved');
    return saved;
  } catch (err) {
    logger.warn({ err, userId }, 'Gemini failed — returning previous insight if available');
    return previousInsight ?? null;
  }
}
