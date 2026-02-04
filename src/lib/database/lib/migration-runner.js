/**
 * Migration Runner
 * Executes database migrations in sequential order
 * Tracks migration history in migration_history table
 */

const fs = require('fs').promises;
const path = require('path');
const { query, getClient } = require('./connection');

const MIGRATIONS_DIR = path.join(__dirname, '..', 'migrations');

/**
 * Ensure migration_history table exists
 */
async function ensureMigrationTable() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS migration_history (
      id SERIAL PRIMARY KEY,
      migration_name VARCHAR(255) UNIQUE NOT NULL,
      migration_number INTEGER NOT NULL,
      applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      execution_time_ms INTEGER,
      applied_by VARCHAR(255),
      status VARCHAR(50) DEFAULT 'SUCCESS',
      error_message TEXT,
      CONSTRAINT migration_history_status_check CHECK (status IN ('SUCCESS', 'FAILED', 'ROLLED_BACK'))
    );
    
    CREATE INDEX IF NOT EXISTS idx_migration_history_number ON migration_history(migration_number);
    CREATE INDEX IF NOT EXISTS idx_migration_history_applied_at ON migration_history(applied_at);
  `;
  
  try {
    await query(createTableSQL);
    console.log('✅ Migration history table ready');
  } catch (error) {
    console.error('❌ Failed to create migration_history table:', error.message);
    throw error;
  }
}

/**
 * Get list of migration files
 * @returns {Promise<Array>} Sorted list of migration files
 */
async function getMigrationFiles() {
  try {
    const files = await fs.readdir(MIGRATIONS_DIR);
    
    // Filter SQL files and sort by number
    const migrations = files
      .filter(file => file.endsWith('.sql'))
      .map(file => {
        const match = file.match(/^(\d+)_(.+)\.sql$/);
        if (!match) return null;
        
        return {
          number: parseInt(match[1]),
          name: file,
          description: match[2].replace(/_/g, ' ')
        };
      })
      .filter(m => m !== null)
      .sort((a, b) => a.number - b.number);
    
    return migrations;
  } catch (error) {
    console.error('❌ Failed to read migration files:', error.message);
    throw error;
  }
}

/**
 * Get applied migrations from database
 * @returns {Promise<Set>} Set of applied migration names
 */
async function getAppliedMigrations() {
  try {
    const result = await query(
      'SELECT migration_name FROM migration_history WHERE status = $1 ORDER BY migration_number',
      ['SUCCESS']
    );
    
    return new Set(result.rows.map(row => row.migration_name));
  } catch (error) {
    console.error('❌ Failed to get applied migrations:', error.message);
    throw error;
  }
}

/**
 * Run a single migration
 * @param {Object} migration - Migration object
 * @param {Object} client - Database client
 * @returns {Promise<number>} Execution time in milliseconds
 */
async function runMigration(migration, client) {
  const filePath = path.join(MIGRATIONS_DIR, migration.name);
  const sql = await fs.readFile(filePath, 'utf8');
  
  console.log(`\n📦 Running migration ${migration.number}: ${migration.description}...`);
  
  const startTime = Date.now();
  
  try {
    await client.query('BEGIN');
    
    // Execute migration SQL
    await client.query(sql);
    
    // Record migration in history
    const executionTime = Date.now() - startTime;
    await client.query(
      `INSERT INTO migration_history (migration_name, migration_number, execution_time_ms, applied_by, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [migration.name, migration.number, executionTime, 'system', 'SUCCESS']
    );
    
    await client.query('COMMIT');
    
    console.log(`✅ Migration ${migration.number} completed in ${executionTime}ms`);
    return executionTime;
    
  } catch (error) {
    await client.query('ROLLBACK');
    
    // Record failed migration
    try {
      await client.query(
        `INSERT INTO migration_history (migration_name, migration_number, applied_by, status, error_message)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (migration_name) DO UPDATE SET status = $4, error_message = $5`,
        [migration.name, migration.number, 'system', 'FAILED', error.message]
      );
    } catch (recordError) {
      console.error('Failed to record migration error:', recordError.message);
    }
    
    console.error(`❌ Migration ${migration.number} failed:`, error.message);
    throw error;
  }
}

/**
 * Run all pending migrations
 * @param {Object} options - Options {dryRun: boolean}
 * @returns {Promise<Object>} Migration results
 */
async function runMigrations(options = {}) {
  const { dryRun = false } = options;
  
  console.log('\n🚀 Starting database migrations...\n');
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Database: ${process.env.DB_NAME || 'ioms_production'}`);
  console.log(`Dry run: ${dryRun ? 'YES' : 'NO'}\n`);
  
  const client = await getClient();
  
  try {
    // Ensure migration table exists
    await ensureMigrationTable();
    
    // Get all migrations
    const allMigrations = await getMigrationFiles();
    const appliedMigrations = await getAppliedMigrations();
    
    // Filter pending migrations
    const pendingMigrations = allMigrations.filter(
      m => !appliedMigrations.has(m.name)
    );
    
    if (pendingMigrations.length === 0) {
      console.log('✅ No pending migrations. Database is up to date!');
      return {
        total: allMigrations.length,
        applied: appliedMigrations.size,
        pending: 0,
        executed: 0
      };
    }
    
    console.log(`Found ${pendingMigrations.length} pending migration(s):\n`);
    pendingMigrations.forEach(m => {
      console.log(`  ${m.number}. ${m.description}`);
    });
    console.log('');
    
    if (dryRun) {
      console.log('🔍 Dry run mode - no migrations will be executed');
      return {
        total: allMigrations.length,
        applied: appliedMigrations.size,
        pending: pendingMigrations.length,
        executed: 0,
        dryRun: true
      };
    }
    
    // Run pending migrations
    let executed = 0;
    let totalTime = 0;
    
    for (const migration of pendingMigrations) {
      const executionTime = await runMigration(migration, client);
      totalTime += executionTime;
      executed++;
    }
    
    console.log('\n' + '='.repeat(60));
    console.log(`✅ Successfully executed ${executed} migration(s)`);
    console.log(`⏱️  Total execution time: ${totalTime}ms`);
    console.log('='.repeat(60) + '\n');
    
    return {
      total: allMigrations.length,
      applied: appliedMigrations.size + executed,
      pending: 0,
      executed: executed,
      totalTime: totalTime
    };
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Show migration status
 * @returns {Promise<void>}
 */
async function showStatus() {
  console.log('\n📊 Migration Status\n');
  
  try {
    await ensureMigrationTable();
    
    const allMigrations = await getMigrationFiles();
    const appliedMigrations = await getAppliedMigrations();
    
    console.log(`Total migrations: ${allMigrations.length}`);
    console.log(`Applied: ${appliedMigrations.size}`);
    console.log(`Pending: ${allMigrations.length - appliedMigrations.size}\n`);
    
    allMigrations.forEach(m => {
      const status = appliedMigrations.has(m.name) ? '✅' : '⏳';
      console.log(`${status} ${m.number}. ${m.description}`);
    });
    
    console.log('');
  } catch (error) {
    console.error('❌ Failed to get migration status:', error.message);
    throw error;
  }
}

// CLI Interface
if (require.main === module) {
  const command = process.argv[2];
  
  const commands = {
    'run': () => runMigrations(),
    'status': () => showStatus(),
    'dry-run': () => runMigrations({ dryRun: true })
  };
  
  const execute = commands[command];
  
  if (!execute) {
    console.log('Usage: node migration-runner.js [command]');
    console.log('\nCommands:');
    console.log('  run      - Run all pending migrations');
    console.log('  status   - Show migration status');
    console.log('  dry-run  - Show what would be executed without running\n');
    process.exit(1);
  }
  
  execute()
    .then(() => process.exit(0))
    .catch(error => {
      console.error(error);
      process.exit(1);
    });
}

module.exports = {
  runMigrations,
  showStatus
};

