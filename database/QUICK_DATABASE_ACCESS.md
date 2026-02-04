# Quick Database Access Commands

## Connect to Database
```bash
psql -U nishantchaturvedi -d ioms_production
```

## Essential Queries (Copy & Paste)

### 1. View All Tables
```sql
\dt
```

### 2. View Users (Clean Format)
```sql
SELECT 
    id, 
    name, 
    email_hash, 
    active, 
    signup_date 
FROM users 
ORDER BY signup_date DESC;
```

### 3. View Sessions
```sql
SELECT 
    id,
    user_id,
    login_time,
    expires_at,
    is_active,
    device
FROM sessions
ORDER BY login_time DESC;
```

### 4. View User Structure
```sql
\d users
```

### 5. View Session Structure
```sql
\d sessions
```

### 6. Count All Records
```sql
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(*) FROM sessions) as total_sessions,
    (SELECT COUNT(*) FROM sessions WHERE is_active = true) as active_sessions;
```

### 7. Find User by Name
```sql
SELECT * FROM users WHERE name LIKE '%Owner%';
```

### 8. View User with Their Sessions
```sql
SELECT 
    u.name as user_name,
    u.email_hash,
    u.active,
    s.login_time,
    s.is_active as session_active,
    s.device
FROM users u
LEFT JOIN sessions s ON u.id = s.user_id
ORDER BY s.login_time DESC NULLS LAST;
```

### 9. Check Migration Status
```sql
SELECT 
    migration_number,
    migration_name,
    status,
    applied_at,
    execution_time_ms
FROM migration_history 
ORDER BY migration_number;
```

### 10. View Encrypted Data (As Stored)
```sql
-- This shows the ENCRYPTED version
SELECT id, name, email, phone FROM users LIMIT 1;
```

## Useful psql Commands

```
\dt              -- List all tables
\d users         -- Describe users table
\d sessions      -- Describe sessions table
\l               -- List all databases
\du              -- List database users
\x               -- Toggle expanded display
\timing          -- Show query time
\q               -- Quit psql
```

## One-Line Queries (Run from Terminal)

### View Users
```bash
psql -U nishantchaturvedi -d ioms_production -c "SELECT id, name, active FROM users;"
```

### Count Users
```bash
psql -U nishantchaturvedi -d ioms_production -c "SELECT COUNT(*) as total_users FROM users;"
```

### View Last 5 Sessions
```bash
psql -U nishantchaturvedi -d ioms_production -c "SELECT user_id, login_time, is_active FROM sessions ORDER BY login_time DESC LIMIT 5;"
```

### Check Active Sessions
```bash
psql -U nishantchaturvedi -d ioms_production -c "SELECT COUNT(*) as active_sessions FROM sessions WHERE is_active = true;"
```

## Troubleshooting

### Connection Refused
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL
brew services start postgresql
```

### Can't Find Database
```bash
# List all databases
psql -U nishantchaturvedi -d postgres -c "\l"
```

### Wrong User
```bash
# Check current user
whoami

# Use that as PostgreSQL user
psql -U $(whoami) -d ioms_production
```

