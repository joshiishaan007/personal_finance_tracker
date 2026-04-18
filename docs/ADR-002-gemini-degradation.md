# ADR-002: Silent degradation for Gemini AI failures

## Status
Accepted

## Context
The AI insight feature uses Google Gemini gemini-1.5-flash (free tier). Free tier has rate limits
(60 QPM, daily quota). The app must never break or show errors because of AI failures.

## Decision
1. Only aggregated stats are sent to Gemini — no raw transactions, notes, or PII.
2. On any Gemini error (429, 5xx, network, parse), the AI card is hidden silently.
3. Errors are logged server-side (pino warn level) for monitoring.
4. Per-user rate limit: max 5 Gemini calls/day enforced via express-rate-limit.
5. Insights are cached by sha256(monthKey + categoryTotals + savingsRate) — same data = cached response.
6. Cache TTL: 7 days. After 7 days, regenerate only if user triggers and quota allows.

## Consequences
- AI insights are a "nice to have" — app is fully functional without them
- Users never see a Gemini error message
- Rate-limiting prevents runaway costs if quota model changes
