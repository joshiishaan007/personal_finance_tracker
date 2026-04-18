import 'dotenv/config';
import mongoose from 'mongoose';
import { logger } from '../config/logger';

interface Migration {
  version: number;
  description: string;
  up: (db: typeof mongoose) => Promise<void>;
}

import migration001 from './001_seed_default_categories';

const migrations: Migration[] = [
  migration001,
];

async function runMigrations() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');

  await mongoose.connect(uri, { dbName: 'finbuddy' });

  const MigrationRecord = mongoose.model(
    '_Migration',
    new mongoose.Schema({
      version: { type: Number, unique: true },
      description: String,
      appliedAt: { type: Date, default: Date.now },
    }),
  );

  const applied = await MigrationRecord.find().select('version').lean();
  const appliedVersions = new Set(applied.map((r) => r.version));

  for (const migration of migrations) {
    if (appliedVersions.has(migration.version)) {
      logger.info({ version: migration.version }, 'Already applied, skipping');
      continue;
    }
    logger.info({ version: migration.version, desc: migration.description }, 'Applying migration');
    await migration.up(mongoose);
    await MigrationRecord.create({ version: migration.version, description: migration.description });
    logger.info({ version: migration.version }, 'Done');
  }

  await mongoose.disconnect();
  logger.info('All migrations complete');
}

runMigrations().catch((err) => {
  logger.error(err, 'Migration runner failed');
  process.exit(1);
});
