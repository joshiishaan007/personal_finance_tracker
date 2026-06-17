// @vitest-environment node
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import mongoose from 'mongoose';
import { createHash } from 'crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { authService } from '../auth.service';
import { UserModel } from '../../models/user.model';
import { RefreshTokenModel } from '../../models/refreshToken.model';

const SECRET = 'test-secret-at-least-32-characters-long-xx';
let mem: MongoMemoryServer;
let userId: string;

beforeAll(async () => {
  mem = await MongoMemoryServer.create();
  await mongoose.connect(mem.getUri(), { dbName: 'refresh-test' });
  const u = await UserModel.create({ googleId: 'g1', email: 'a@b.com', name: 'A', schemaVersion: 1 });
  userId = u.id;
}, 120_000);

afterAll(async () => {
  await mongoose.disconnect();
  await mem.stop();
});

describe('refresh token rotation', () => {
  it('rotates a valid token, revokes the old, and detects reuse (family revoke)', async () => {
    const t1 = await authService.issueTokens(userId, 0, SECRET);

    // First rotation succeeds and yields a new pair.
    const r1 = await authService.rotateRefreshToken(t1.refreshToken, SECRET);
    expect(r1.state).toBe('ok');
    expect(r1.state === 'ok' && r1.data.refreshToken).not.toBe(t1.refreshToken);

    // Replaying the now-revoked t1 is reuse → rejected…
    const reuse = await authService.rotateRefreshToken(t1.refreshToken, SECRET);
    expect(reuse.state).toBe('error');

    // …and reuse revokes the whole family, so r1's fresh token is dead too.
    if (r1.state === 'ok') {
      const after = await authService.rotateRefreshToken(r1.data.refreshToken, SECRET);
      expect(after.state).toBe('error');
    }
  });

  it('rejects an unknown token', async () => {
    const r = await authService.rotateRefreshToken('not-a-real-token', SECRET);
    expect(r.state).toBe('error');
  });

  it('rejects an expired token', async () => {
    const raw = 'expired-raw-token-value';
    await RefreshTokenModel.create({
      userId: new mongoose.Types.ObjectId(userId),
      tokenHash: createHash('sha256').update(raw).digest('hex'),
      expiresAt: new Date(Date.now() - 1000), // already past
    });
    const r = await authService.rotateRefreshToken(raw, SECRET);
    expect(r.state).toBe('error');
  });

  it('logout bumps tokenVersion and revokes all refresh tokens', async () => {
    const fresh = await authService.issueTokens(userId, 0, SECRET);
    const before = await UserModel.findById(userId).select('tokenVersion').lean();

    await authService.logout(fresh.refreshToken);

    const after = await UserModel.findById(userId).select('tokenVersion').lean();
    expect((after?.tokenVersion ?? 0)).toBe((before?.tokenVersion ?? 0) + 1);
    // The just-issued token no longer rotates.
    expect((await authService.rotateRefreshToken(fresh.refreshToken, SECRET)).state).toBe('error');
  });
});
