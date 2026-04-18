import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { requestIdMiddleware } from './middleware/requestId';
import { errorHandler } from './middleware/errorHandler';
import { globalRateLimiter } from './middleware/rateLimiter';
import { authRouter } from './routes/auth.routes';
import { transactionRouter } from './routes/transaction.routes';
import { categoryRouter } from './routes/category.routes';
import { budgetRouter } from './routes/budget.routes';
import { goalRouter } from './routes/goal.routes';
import { recurringRouter } from './routes/recurring.routes';
import { analyticsRouter } from './routes/analytics.routes';
import { netWorthRouter } from './routes/netWorth.routes';
import { plRouter } from './routes/pl.routes';
import { reportsRouter } from './routes/reports.routes';
import { aiRouter } from './routes/ai.routes';
import { exportRouter } from './routes/export.routes';
import { notificationRouter } from './routes/notification.routes';
import { userRouter } from './routes/user.routes';
import type { Env } from './config/env';

export function createApp(env: Env) {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: env.CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  }));
  app.use(compression() as express.RequestHandler);
  app.use(express.json({ limit: '5mb' }));
  app.use(cookieParser());
  app.use(requestIdMiddleware);
  app.use(globalRateLimiter);

  app.use('/api/auth', authRouter(env));
  app.use('/api/transactions', transactionRouter);
  app.use('/api/categories', categoryRouter);
  app.use('/api/budgets', budgetRouter);
  app.use('/api/goals', goalRouter);
  app.use('/api/recurring', recurringRouter);
  app.use('/api/analytics', analyticsRouter);
  app.use('/api/net-worth', netWorthRouter);
  app.use('/api/pl', plRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/ai', aiRouter(env));
  app.use('/api/export', exportRouter);
  app.use('/api/notifications', notificationRouter);
  app.use('/api/user', userRouter);

  app.use(errorHandler);

  return app;
}
