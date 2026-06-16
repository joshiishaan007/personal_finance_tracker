import { Types } from 'mongoose';
import { LoanModel } from '../models/loan.model';

export const loanRepository = {
  list: (userId: string) => LoanModel.find({ userId }).sort({ createdAt: -1 }).lean(),

  create: (userId: string, set: Record<string, unknown>) => LoanModel.create({ ...set, userId }),

  update: (userId: string, id: string, set: Record<string, unknown>) =>
    LoanModel.findOneAndUpdate({ _id: id, userId }, { $set: set }, { new: true }).lean(),

  remove: (userId: string, id: string) => LoanModel.findOneAndDelete({ _id: id, userId }).lean(),

  addPayment: (userId: string, id: string, payment: { date: Date; amount: number; transactionId?: string }) =>
    LoanModel.findOneAndUpdate({ _id: id, userId }, { $push: { payments: payment } }, { new: true }).lean(),

  // Drop a payment whose linked transaction was deleted (feed delete / undo).
  unlinkPayment: (userId: string, transactionId: string) =>
    LoanModel.updateMany(
      { userId: new Types.ObjectId(userId), 'payments.transactionId': transactionId },
      { $pull: { payments: { transactionId } } },
    ).exec(),
};
