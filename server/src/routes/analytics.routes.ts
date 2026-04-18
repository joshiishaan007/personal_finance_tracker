import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware';
import { TransactionModel } from '../models/transaction.model';
import type { AuthRequest } from '../middleware/auth.middleware';
import { Types } from 'mongoose';

const router: import('express').Router = Router();
router.use(requireAuth);

router.get('/dashboard', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [mtd, sixMonth, topCategories] = await Promise.all([
    TransactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: monthStart } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    TransactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { month: { $month: '$date' }, year: { $year: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
    TransactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: monthStart }, type: 'expense' } },
      { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: 3 },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    ]),
  ]);

  res.json({ success: true, data: { mtd, sixMonth, topCategories } });
});

router.get('/monthly', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const { year, month } = req.query as { year: string; month: string };
  const y = parseInt(year), m = parseInt(month);
  const start = new Date(y, m - 1, 1);
  const end = new Date(y, m, 0, 23, 59, 59, 999);

  const [totals, byCategory, byDay] = await Promise.all([
    TransactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } },
    ]),
    TransactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: start, $lte: end }, type: 'expense' } },
      { $group: { _id: '$categoryId', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'categories', localField: '_id', foreignField: '_id', as: 'category' } },
      { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
    ]),
    TransactionModel.aggregate([
      { $match: { userId: new Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
      {
        $group: {
          _id: { day: { $dayOfMonth: '$date' }, type: '$type' },
          total: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.day': 1 } },
    ]),
  ]);

  res.json({ success: true, data: { totals, byCategory, byDay } });
});

router.get('/yearly', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const { year } = req.query as { year: string };
  const y = parseInt(year);
  const start = new Date(y, 0, 1);
  const end = new Date(y, 11, 31, 23, 59, 59, 999);

  const monthly = await TransactionModel.aggregate([
    { $match: { userId: new Types.ObjectId(userId), date: { $gte: start, $lte: end } } },
    {
      $group: {
        _id: { month: { $month: '$date' }, type: '$type' },
        total: { $sum: '$amount' },
      },
    },
    { $sort: { '_id.month': 1 } },
  ]);

  res.json({ success: true, data: { monthly } });
});

router.get('/custom', async (req, res) => {
  const { userId } = req as unknown as AuthRequest;
  const { startDate, endDate } = req.query as { startDate: string; endDate: string };

  const data = await TransactionModel.aggregate([
    {
      $match: {
        userId: new Types.ObjectId(userId),
        date: { $gte: new Date(startDate), $lte: new Date(endDate) },
      },
    },
    {
      $group: {
        _id: { type: '$type', categoryId: '$categoryId' },
        total: { $sum: '$amount' },
      },
    },
    { $lookup: { from: 'categories', localField: '_id.categoryId', foreignField: '_id', as: 'category' } },
    { $unwind: { path: '$category', preserveNullAndEmptyArrays: true } },
  ]);

  res.json({ success: true, data });
});

export { router as analyticsRouter };
