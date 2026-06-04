import { describe, it, expect } from 'vitest';
import { modeForPath } from '../mode';

describe('modeForPath', () => {
  it('treats /goals and its children as Goals mode', () => {
    expect(modeForPath('/goals')).toBe('goals');
    expect(modeForPath('/goals/abc123')).toBe('goals');
    expect(modeForPath('/goals/tasks')).toBe('goals');
  });

  it('treats everything else (incl. /savings) as Finance mode', () => {
    expect(modeForPath('/dashboard')).toBe('finance');
    expect(modeForPath('/savings')).toBe('finance');
    expect(modeForPath('/transactions')).toBe('finance');
    expect(modeForPath('/')).toBe('finance');
  });

  it('does not match a path that merely starts with the word goals', () => {
    expect(modeForPath('/goalsetting')).toBe('finance');
  });
});
