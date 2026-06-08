import { UserModel } from '@/server/models/user.model';

export const authRepository = {
  findById: (id: string) => UserModel.findById(id).lean(),

  findByGoogleId: (googleId: string) => UserModel.findOne({ googleId }),

  create: (doc: { googleId: string; email: string; name: string; avatar?: string }) =>
    UserModel.create(doc),

  // Minimal projection for the per-request auth check — just the revocation counter.
  findTokenVersion: (id: string) =>
    UserModel.findById(id).select('tokenVersion').lean<{ _id: unknown; tokenVersion?: number } | null>().exec(),

  bumpTokenVersion: (id: string) =>
    UserModel.findByIdAndUpdate(id, { $inc: { tokenVersion: 1 } }).lean().exec(),
};
