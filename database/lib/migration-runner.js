/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { pool } = require('./connection');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

const ensureTrackerTable = async (client) => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS migration_tracker (
      id SERIAL PRIMARY KEY,
      migration_name TEXT UNIQUE NOT NULL,
      checksum TEXT NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
};

const loadMigrations = () => {
  if (!fs.existsSync(MIGRATIONS_DIR)) return [];
  return fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith('.sql'))
    .sort()
    .map((file) => {
      const fullPath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(fullPath, 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');
      return { name: file, sql, checksum };
    });
};

const getAppliedMigrations = async (client) => {
  const res = await client.query('SELECT migration_name, checksum FROM migration_tracker ORDER BY migration_name');
  return res.rows.reduce((acc, row) => {
    acc[row.migration_name] = row.checksum;
    return acc;
  }, {});
};

const runMigrations = async (dryRun = false) => {
  const client = await pool.connect();
  try {
    await ensureTrackerTable(client);
    const migrations = loadMigrations();
    const applied = await getAppliedMigrations(client);

    const pending = migrations.filter((m) => !applied[m.name]);

    if (dryRun) {
      console.log('Pending migrations:', pending.map((m) => m.name));
      return;
    }

    for (const migration of pending) {
      console.log(`Applying ${migration.name}...`);
      await client.query('BEGIN');
      await client.query(migration.sql);
      await client.query(
        'INSERT INTO migration_tracker (migration_name, checksum) VALUES ($1, $2)',
        [migration.name, migration.checksum]
      );
      await client.query('COMMIT');
      console.log(`✅ Applied ${migration.name}`);
    }

    if (pending.length === 0) {
      console.log('✅ No pending migrations');
    }
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore
    }
    console.error('❌ Migration failed:', error.message || error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
};

const showStatus = async () => {
  const client = await pool.connect();
  try {
    await ensureTrackerTable(client);
    const migrations = loadMigrations();
    const applied = await getAppliedMigrations(client);

    console.log('Applied migrations:');
    Object.keys(applied).forEach((name) => console.log(`  ✅ ${name}`));

    const pending = migrations.filter((m) => !applied[m.name]);
    console.log('Pending migrations:');
    pending.forEach((m) => console.log(`  ⏳ ${m.name}`));
  } finally {
    client.release();
    await pool.end();
  }
};

const command = (process.argv[2] || 'run').toLowerCase();
if (command === 'status') {
  showStatus();
} else if (command === 'dry-run') {
  runMigrations(true);
} else {
  runMigrations(false);
}
