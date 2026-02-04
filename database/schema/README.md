# Database Schema Snapshots

This folder contains **current state snapshots** of database tables.

## 🎯 Purpose

Schema files represent the **current structure** of each table at this point in time. They serve as:

- 📸 **Quick Reference**: See current table structure at a glance
- 📚 **Documentation**: Understand table purpose and columns
- 🤝 **Team Collaboration**: Everyone knows current schema state
- 🔍 **Debugging**: Compare expected vs actual structure

## 📁 Files in This Folder

- `users.sql` - Current users table structure
- `sessions.sql` - Current sessions table structure
- *(More files added as new tables are created)*

## 🆚 Schema vs Migrations

### Schema Files (This Folder)

**What**: Current snapshot of table structure  
**When Updated**: After each migration that modifies structure  
**Purpose**: Quick reference and documentation  

```sql
-- Shows current state
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(500),  -- Added in migration 005
    ...
);
```

### Migration Files (`../migrations/`)

**What**: Chronological history of changes  
**When Updated**: Each time schema changes  
**Purpose**: Version control and deployment  

```sql
-- Shows changes over time
001_create_users_table.sql
002_create_sessions_table.sql
005_add_email_to_users.sql
```

## ✅ When to Update Schema Files

Update schema files when migrations:

- ✅ CREATE new tables
- ✅ ALTER table structure (add/modify/drop columns)
- ✅ ADD/DROP indexes
- ✅ ADD/DROP constraints
- ✅ Change column types or defaults

Do NOT update for:

- ❌ INSERT/UPDATE/DELETE data
- ❌ One-time data migrations
- ❌ Performance tuning
- ❌ Seed data

## 📝 How to Update Schema Files

### Step 1: Run Migration

```bash
node database/lib/migration-runner.js run
```

### Step 2: Update Corresponding Schema File

If migration modifies `users` table, update `users.sql`.

### Step 3: Keep Structure Only

Schema files should contain:
- CREATE TABLE statement
- All current columns
- All indexes
- All constraints
- Documentation comments

They should NOT contain:
- INSERT statements
- Multiple versions
- Historical notes (use migrations for history)

### Example

**Migration 005**: Add email verification
```sql
ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
```

**Update `users.sql`**:
```sql
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(500),
    email_verified BOOLEAN DEFAULT false,  -- Added this line
    ...
);
```

Also update the header comment:
```sql
-- Last Updated: 2025-01-21  -- Change date
```

## 🔄 Sync Process

```
Migration Created
      ↓
Migration Applied
      ↓
Schema File Updated  ← You are here
      ↓
Commit Both to Git
```

## 📚 Schema File Format

```sql
-- ============================================
-- SCHEMA SNAPSHOT: Table Name
-- Last Updated: YYYY-MM-DD
-- Description: Brief table description
-- ============================================

-- This file represents the CURRENT state
-- For change history, refer to migration files

CREATE TABLE table_name (
    -- Columns grouped logically
    id UUID PRIMARY KEY,
    ...
);

-- Indexes
CREATE INDEX idx_name ON table_name(column);

-- ============================================
-- FIELD DESCRIPTIONS
-- ============================================
-- id: Purpose
-- column: Purpose
-- ============================================
```

## 🔍 Verifying Schema

### Compare with Actual Database

```sql
-- Get table structure
\d+ users

-- Get indexes
\di users*

-- Compare with schema file
```

### Find Drift

If actual database differs from schema file:

1. Check if migrations were applied
2. Check if schema file was updated
3. Check for manual changes (not recommended!)

## 🚨 Common Mistakes

### ❌ Mistake 1: Not Updating After Migration

**Problem**: Migration adds column, but schema file not updated

**Fix**: Always update schema files after structural migrations

### ❌ Mistake 2: Adding Historical Versions

**Problem**: Schema file contains multiple versions

**Fix**: Keep only current structure, use migrations for history

### ❌ Mistake 3: Including Data

**Problem**: Schema file has INSERT statements

**Fix**: Schema = structure only. Data goes in `../seeds/`

### ❌ Mistake 4: Manual Database Changes

**Problem**: Changed database directly without migration

**Fix**: 
1. Revert manual change
2. Create proper migration
3. Update schema file

## 📊 Schema Documentation

Each schema file should document:

- **Table Purpose**: What this table stores
- **Column Descriptions**: What each field means
- **Relationships**: Foreign keys and references
- **Indexes**: Why they exist
- **Encryption**: Which fields are encrypted
- **Constraints**: Business rules enforced

## 🔗 Related Files

- **Migrations**: `../migrations/` (change history)
- **Models**: `../models/` (data access code)
- **Queries**: `../lib/queries/` (SQL queries)
- **Main README**: `../README.md`

## ✨ Best Practices

1. **Update Immediately**: Update schema file right after running migration
2. **Keep In Sync**: Schema file = current database state
3. **Document Well**: Add comments explaining purpose
4. **Commit Together**: Commit migration + schema update together
5. **Review Changes**: Check diff before committing

## 📖 Example: Full Update Process

```bash
# 1. Create migration
vim database/migrations/006_add_role_to_users.sql

# 2. Run migration
node database/lib/migration-runner.js run

# 3. Update schema
vim database/schema/users.sql
# Add: role VARCHAR(50) DEFAULT 'user'
# Update: Last Updated date

# 4. Commit both
git add database/migrations/006_add_role_to_users.sql
git add database/schema/users.sql
git commit -m "Add role column to users table"
```

---

**Remember**: Schema files are documentation of CURRENT state. Migrations are documentation of CHANGES over time. Both are important!











