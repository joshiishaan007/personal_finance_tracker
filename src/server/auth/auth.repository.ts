import { UserModel } from '@/server/models/user.model';

export const authRepository = {
  findById: (id: string) => UserModel.findById(id).lean(),

  findByGoogleId: (googleId: string) => UserModel.findOne({ googleId }),

  create: (doc: { googleId: string; email: string; name: string; avatar?: string }) =>
    UserModel.create(doc),
};
