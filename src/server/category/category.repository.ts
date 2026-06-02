import { CategoryModel } from '../models/category.model';

export const categoryRepository = {
  // User's own categories plus the global defaults (no userId).
  list: (userId: string) =>
    CategoryModel.find({ $or: [{ userId }, { isDefault: true, userId: { $exists: false } }] }).lean(),

  create: (doc: Record<string, unknown>) => CategoryModel.create(doc),

  update: (userId: string, id: string, set: Record<string, unknown>) =>
    CategoryModel.findOneAndUpdate({ _id: id, userId }, { $set: set }, { new: true }).lean(),

  remove: (userId: string, id: string) =>
    CategoryModel.findOneAndDelete({ _id: id, userId }).lean(),
};
