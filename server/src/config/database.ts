import mongoose from 'mongoose';
import { logger } from './logger';

export async function connectDB(uri: string): Promise<void> {
  mongoose.set('strict', 'throw');
  await mongoose.connect(uri, { dbName: 'finbuddy' });
  logger.info('MongoDB connected');

  mongoose.connection.on('error', (err) => {
    logger.error({ err }, 'MongoDB connection error');
  });
}
