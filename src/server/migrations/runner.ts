import dns from 'node:dns';
import { config } from 'dotenv';
import mongoose from 'mongoose';
import { logger } from '../logger';
import migration001 from './001_seed_default_categories';
import migration002 from './002_transaction_client_id_index';
import migration003 from './003_goals_domain_indexes';
import migration004 from './004_sync_all_indexes';
import migration005 from './005_financial_planning_indexes';
import migration006 from './006_split_food_categories';
import migration007 from './007_debt_direction_backfill';
import migration008 from './008_spending_plan_history_indexes';
import migration009 from './009_seed_reimbursement_category';
import migration010 from './010_instant_card_sort_order';
import migration011 from './011_reimbursement_transaction_type';
import migration012 from './012_transaction_soft_delete_ttl';

// Next stores local secrets in .env.local; this standalone script doesn't go
// through Next, so load .env.local first (priority), then .env as a fallback.
config({ path: '.env.local' });
config();

interface Migration {
  version: number;
  description: string;
  up: (db: typeof mongoose) => Promise<void>;
}

const migrations: Migration[] = [
  migration001,
  migration002,
  migration003,
  migration004,
  migration005,
  migration006,
  migration007,
  migration008,
  migration009,
  migration010,
  migration011,
  migration012,
];

// Same Windows/Node quirk db.ts handles: c-ares can fall back to a dead 127.0.0.1
// resolver, which breaks `mongodb+srv` SRV lookups (querySrv ECONNREFUSED). If the
// only resolver is loopback, use public DNS so Atlas connects.
function ensureWorkingDns(): void {
  const servers = dns.getServers();
  if (servers.length === 0 || servers.every((s) => s === '127.0.0.1' || s === '::1')) {
    const PUBLIC = ['8.8.8.8', '1.1.1.1'];
    dns.setServers(PUBLIC);
    dns.promises.setServers(PUBLIC);
  }
}

async function runMigrations() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');

  ensureWorkingDns();
  await mongoose.connect(uri, { dbName: 'personal' });

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
