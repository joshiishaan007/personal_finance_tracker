// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { computeStreak } from '../engagement.service';

describe('computeStreak', () => {
  const today = '2026-06-03';
  const yesterday = '2026-06-02';

  it('counts consecutive days ending today', () => {
    expect(computeStreak(['2026-06-03', '2026-06-02', '2026-06-01'], today, yesterday)).toBe(3);
  });

  it('stops at the first gap', () => {
    // 06-01 is missing, so only today + yesterday count
    expect(computeStreak(['2026-06-03', '2026-06-02', '2026-05-31'], today, yesterday)).toBe(2);
  });

  it('grants a grace day: today unlogged but yesterday active keeps the streak', () => {
    expect(computeStreak(['2026-06-02', '2026-06-01'], today, yesterday)).toBe(2);
  });

  it('returns 0 when neither today nor yesterday is logged', () => {
    expect(computeStreak(['2026-05-30', '2026-05-29'], today, yesterday)).toBe(0);
  });

  it('returns 0 for no activity', () => {
    expect(computeStreak([], today, yesterday)).toBe(0);
  });

  it('ignores duplicate/unordered day entries', () => {
    expect(computeStreak(['2026-06-02', '2026-06-03', '2026-06-03', '2026-06-01'], today, yesterday)).toBe(3);
  });
});
