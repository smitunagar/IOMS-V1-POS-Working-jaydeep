# Database Migrations

This folder contains version-controlled database schema changes.

## 📋 What are Migrations?

Migrations are **chronological, incremental changes** to the database schema. Each migration file represents a single logical change to the database.

## 🎯 Purpose

- **Version Control**: Track database schema changes over time
- **Team Collaboration**: Everyone applies the same changes in the same order
- **Production Safety**: Incremental updates to live databases
- **Rollback Capability**: Can revert changes if needed
- **Documentation**: Clear history of what changed and when

## 📁 File Naming Convention

```
###_description_of_change.sql

Examples:
001_create_users_table.sql
002_create_sessions_table.sql
003_add_email_verification_to_users.sql
004_create_index_on_sessions.sql
```

**Rules**:
- Start with 3-digit number (001, 002, 003...)
- Use underscores for spaces
- Be descriptive but concise
- Use `.sql` extension

## ✍️ Creating a New Migration

### Step 1: Create File

```bash
# Next number in sequence
touch database/migrations/004_your_change_description.sql
```

### Step 2: Write SQL

```sql
-- Migration: Your Change Description
-- Created: YYYY-MM-DD
-- Description: Detailed explanation of what this migration does

-- Your SQL statements here
CREATE TABLE new_table (...);
ALTER TABLE existing_table ADD COLUMN new_column TYPE;
CREATE INDEX idx_name ON table(column);

-- Comments for documentation
COMMENT ON TABLE new_table IS 'Purpose of this table';
```

### Step 3: Update Schema Snapshot

If this migration modifies a table structure, update the corresponding file in `../schema/`.

### Step 4: Test Locally

```bash
# Dry run to see what would execute
node database/lib/migration-runner.js dry-run

# Actually run it
node database/lib/migration-runner.js run
```

### Step 5: Commit to Git

```bash
git add database/migrations/004_your_change.sql
git add database/schema/your_table.sql  # if updated
git commit -m "Add migration: your change description"
```

## 🚀 Running Migrations

### Check Status

```bash
node database/lib/migration-runner.js status
```

Shows:
- ✅ Applied migrations
- ⏳ Pending migrations

### Run Pending Migrations

```bash
node database/lib/migration-runner.js run
```

Executes all pending migrations in order.

### Dry Run

```bash
node database/lib/migration-runner.js dry-run
```

Shows what would be executed without actually running it.

## 📊 Migration Tracking

Migrations are tracked in the `migration_history` table:

```sql
SELECT * FROM migration_history ORDER BY migration_number;
```

Columns:
- `migration_name`: Filename
- `migration_number`: Sequence number
- `applied_at`: When it was executed
- `execution_time_ms`: How long it took
- `status`: SUCCESS, FAILED, or ROLLED_BACK

## ✅ Best Practices

### DO:
- ✅ One logical change per migration
- ✅ Test locally before committing
- ✅ Use transactions (automatic)
- ✅ Add comments explaining WHY
- ✅ Keep migrations small and focused
- ✅ Run migrations in order
- ✅ Update schema/ snapshots

### DON'T:
- ❌ Edit migrations after they've been applied
- ❌ Delete migration files
- ❌ Skip migration numbers
- ❌ Combine unrelated changes
- ❌ Run migrations directly (use migration-runner)
- ❌ Commit broken migrations

## 🔄 Migration Types

### 1. Creating Tables

```sql
CREATE TABLE table_name (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    column_name TYPE CONSTRAINTS,
    ...
);
```

### 2. Adding Columns

```sql
ALTER TABLE table_name 
ADD COLUMN column_name TYPE DEFAULT value;
```

### 3. Modifying Columns

```sql
ALTER TABLE table_name 
ALTER COLUMN column_name TYPE new_type;

ALTER TABLE table_name 
ALTER COLUMN column_name SET DEFAULT new_default;
```

### 4. Creating Indexes

```sql
CREATE INDEX idx_table_column ON table_name(column_name);
```

### 5. Adding Constraints

```sql
ALTER TABLE table_name
ADD CONSTRAINT constraint_name 
FOREIGN KEY (column) REFERENCES other_table(id);
```

### 6. Dropping Things (Careful!)

```sql
DROP INDEX IF EXISTS idx_name;
DROP TABLE IF EXISTS table_name CASCADE;
ALTER TABLE table_name DROP COLUMN column_name;
```

## 🚨 Common Issues

### Migration Already Applied

**Error**: Migration already exists in migration_history

**Solution**: This is normal - migration was already run. Check status:
```bash
node database/lib/migration-runner.js status
```

### Migration Failed

**Error**: SQL syntax error or constraint violation

**Solution**:
1. Fix the SQL in the migration file
2. Check migration_history for FAILED status
3. Manually remove failed entry (if safe):
   ```sql
   DELETE FROM migration_history WHERE migration_name = '00X_file.sql';
   ```
4. Run migration again

### Out of Order Execution

**Error**: Migrations not running in sequence

**Solution**: Check file numbers - must be sequential (001, 002, 003...)

## 🌐 Production Deployment

### Before Deploying:

1. ✅ Test migrations locally
2. ✅ Backup production database
3. ✅ Run dry-run to verify
4. ✅ Schedule during low-traffic period
5. ✅ Have rollback plan ready

### Deployment Process:

```bash
# 1. Backup production database
pg_dump -U user dbname > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Check what will run
NODE_ENV=production node database/lib/migration-runner.js dry-run

# 3. Run migrations
NODE_ENV=production node database/lib/migration-runner.js run

# 4. Verify
psql -U user dbname -c "SELECT * FROM migration_history ORDER BY migration_number DESC LIMIT 5;"
```

## 📖 Migration Examples

### Example 1: Add Column

```sql
-- Migration: Add phone verification to users
-- Created: 2025-01-21

ALTER TABLE users 
ADD COLUMN phone_verified BOOLEAN DEFAULT false;

CREATE INDEX idx_users_phone_verified ON users(phone_verified);

COMMENT ON COLUMN users.phone_verified IS 'Whether phone number has been verified via SMS';
```

### Example 2: Create Table with Foreign Key

```sql
-- Migration: Create restaurant profiles table
-- Created: 2025-01-21

CREATE TABLE restaurant_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    restaurant_name VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_restaurant_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_restaurant_profiles_user_id ON restaurant_profiles(user_id);
```

## 🔗 Related Files

- **Migration Runner**: `../lib/migration-runner.js`
- **Schema Snapshots**: `../schema/`
- **Database Config**: `../config/database.config.js`
- **Main README**: `../README.md`

---

**Remember**: Migrations are permanent records. Once applied to production, they should never be edited. Create a new migration instead.


