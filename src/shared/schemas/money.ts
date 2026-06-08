import { z } from 'zod';

// Money is stored in MINOR units (paise/cents). Cap magnitudes well under
// Number.MAX_SAFE_INTEGER (9.007e15) so summing many rows never loses integer
// precision or produces Infinity/NaN. 1e12 minor units = 10 billion major units.
export const MONEY_MAX = 1_000_000_000_000;

// Non-negative amount (balances, assets, targets, principals).
export const moneyMinor = z.number().int().min(0).max(MONEY_MAX);

// Signed amount (P&L figures that can be a loss).
export const moneySignedMinor = z.number().int().min(-MONEY_MAX).max(MONEY_MAX);

// Strictly-positive amount (a transaction/contribution must move some money).
export const moneyMinorPositive = z.number().int().positive().max(MONEY_MAX);
