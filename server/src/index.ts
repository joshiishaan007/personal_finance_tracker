import 'dotenv/config';
import { validateEnv } from './config/env';
import { createApp } from './app';
import { connectDB } from './config/database';
import { logger } from './config/logger';

const env = validateEnv();

async function main() {
  await connectDB(env.MONGODB_URI);
  const app = createApp(env);
  app.listen(env.PORT, () => {
    logger.info({ port: env.PORT, nodeEnv: env.NODE_ENV }, 'FinBuddy server started');
  });
}

main().catch((err) => {
  logger.error(err, 'Fatal startup error');
  process.exit(1);
});
