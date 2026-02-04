# 📊 Database Access Cheat Sheet

## 🚀 Quick Access

### Connect to Database
```bash
psql -U nishantchaturvedi -d ioms_production
```

### One-Line Query (No Connection Needed)
```bash
psql -U nishantchaturvedi -d ioms_production -c "YOUR_SQL_HERE"
```

---

## 📋 Most Used Commands

### View Users
```bash
psql -U nishantchaturvedi -d ioms_production -c "SELECT id, name, active, signup_date FROM users;"
```

### View Sessions
```bash
psql -U nishantchaturvedi -d ioms_production -c "SELECT user_id, login_time, is_active FROM sessions ORDER BY login_time DESC;"
```

### Count Everything
```bash
psql -U nishantchaturvedi -d ioms_production -c "SELECT (SELECT COUNT(*) FROM users) as users, (SELECT COUNT(*) FROM sessions) as sessions;"
```

### View Table Structure
```bash
psql -U nishantchaturvedi -d ioms_production -c "\d users"
psql -U nishantchaturvedi -d ioms_production -c "\d sessions"
```

### List All Tables
```bash
psql -U nishantchaturvedi -d ioms_production -c "\dt"
```

---

## 🔍 Interactive Mode Commands

After connecting with `psql -U nishantchaturvedi -d ioms_production`:

| Command | What It Does |
|---------|-------------|
| `\dt` | List all tables |
| `\d users` | Show users table structure |
| `\d sessions` | Show sessions table structure |
| `\l` | List all databases |
| `\du` | List database users |
| `\q` | Quit psql |
| `\x` | Toggle expanded display (better for wide tables) |
| `\timing` | Show how long queries take |

---

## 📝 Useful SQL Queries

### Find Specific User
```sql
SELECT * FROM users WHERE name = 'Test Owner';
SELECT * FROM users WHERE active = true;
```

### View User Details with Sessions
```sql
SELECT 
    u.name,
    u.email_hash,
    s.login_time,
    s.is_active
FROM users u
LEFT JOIN sessions s ON u.id = s.user_id
ORDER BY s.login_time DESC;
```

### Active Users Only
```sql
SELECT id, name, signup_date 
FROM users 
WHERE active = true 
ORDER BY signup_date DESC;
```

### Sessions Created Today
```sql
SELECT * 
FROM sessions 
WHERE DATE(login_time) = CURRENT_DATE;
```

### Migration Status
```sql
SELECT migration_number, migration_name, status, applied_at 
FROM migration_history 
ORDER BY migration_number;
```

---

## 🎯 Debugging Queries

### Check Encrypted Data Format
```sql
SELECT id, name, 
       LEFT(email, 50) as email_encrypted,
       LEFT(phone, 50) as phone_encrypted,
       email_hash
FROM users 
LIMIT 1;
```

### Check Password Hash Format
```sql
SELECT id, name, LEFT(password, 60) as password_hash 
FROM users 
LIMIT 1;
```

### Find Users Created in Last Hour
```sql
SELECT id, name, signup_date 
FROM users 
WHERE signup_date > NOW() - INTERVAL '1 hour';
```

---

## 🛠️ Maintenance Queries

### Delete Test User (if needed)
```sql
DELETE FROM users WHERE email_hash = 'hash_here';
```

### Mark User Inactive
```sql
UPDATE users SET active = false WHERE name = 'Test User';
```

### Delete Old Sessions
```sql
DELETE FROM sessions WHERE expires_at < NOW();
```

### Count Active vs Inactive Users
```sql
SELECT 
    active,
    COUNT(*) as count
FROM users
GROUP BY active;
```

---

## 💡 Pro Tips

### 1. Save Queries in a File
Create a file `queries.sql`:
```sql
SELECT * FROM users;
```

Run it:
```bash
psql -U nishantchaturvedi -d ioms_production -f queries.sql
```

### 2. Export Query Results to CSV
```bash
psql -U nishantchaturvedi -d ioms_production -c "COPY (SELECT * FROM users) TO STDOUT WITH CSV HEADER" > users.csv
```

### 3. Prettier Output (Expanded Display)
In psql, type `\x` before running wide queries:
```sql
\x
SELECT * FROM users;
```

### 4. Time Your Queries
In psql:
```sql
\timing
SELECT COUNT(*) FROM users;
```

### 5. See Recent Commands
In psql, press ↑ arrow to see previous commands

---

## 🚨 Common Issues

### "role 'postgres' does not exist"
✅ **Solution:** Use your macOS username: `nishantchaturvedi`

### "database does not exist"
✅ **Solution:** Check database name:
```bash
psql -U nishantchaturvedi -d postgres -c "\l"
```

### "connection refused"
✅ **Solution:** Start PostgreSQL:
```bash
brew services start postgresql
pg_isready
```

---

## 📞 Quick Help

- **Full psql help:** Type `\?` in psql
- **SQL help:** Type `\h SELECT` (or any SQL command)
- **Quit psql:** Type `\q`
- **Cancel query:** Press `Ctrl+C`

---

**Pro Tip:** Keep this file open in a second terminal for quick reference!











