# ADR-001: Store monetary values as integers in smallest currency unit

## Status
Accepted

## Context
Floating-point arithmetic is unsuitable for money. `0.1 + 0.2 !== 0.3` in IEEE 754.

## Decision
All monetary values are stored as 64-bit integers in the smallest currency unit:
- INR: paise (1 INR = 100 paise)
- USD: cents (1 USD = 100 cents)
- JPY: yen (no subunit, multiplier = 1)

Conversion happens only at the render boundary via `formatAmount(minorUnits, currency)`.
Input is parsed via `toMinorUnits(displayValue, currency)` — always `Math.round`, never truncate.

## Consequences
- All DB values are integers → simple comparison, summation, aggregation
- No rounding errors accumulate over decades of transactions
- Currency switching impossible after first transaction (multiplier is currency-specific)
- Tests must cover edge cases: 0.1+0.2, large amounts, JPY no-decimal
