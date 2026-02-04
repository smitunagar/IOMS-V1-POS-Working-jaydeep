# Database Setup Guide

Step-by-step guide to set up the IOMS database layer.

## 📋 Prerequisites

- ✅ Node.js 18+ installed
- ✅ PostgreSQL 12+ installed
- ✅ npm/yarn installed

## 🚀 Setup Steps

### Step 1: Install PostgreSQL (if not already installed)

**On macOS:**
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Or download PostgreSQL.app from https://postgresapp.com/
```

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**On Windows:**
Download from https://www.postgresql.org/download/windows/

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE ioms_production;

# Verify
\l
\q
```

### Step 3: Configure Environment Variables

Copy the database configuration to your project's `.env` file:

```bash
# If .env doesn't exist, create it
touch .env

# Add these lines (edit values as needed)
cat database/.env.database.example >> .env
```

Or manually add to `.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ioms_production
DB_USER=postgres
DB_PASSWORD=your_actual_password
ENCRYPTION_KEY=befb041c4f3993c833fb1610b31ee579700c4cfe961f3f2916d1f6b84342d7e0
SESSION_EXPIRY_DAYS=30
```

**IMPORTANT:** Replace `your_actual_password` with your PostgreSQL password!

### Step 4: Install Dependencies

```bash
# From project root
npm install

# Verify pg is installed
npm list pg
```

### Step 5: Test Database Connection

```bash
# From project root
node database/lib/connection.js

# You should see:
# ✅ Database connection test successful
# Database: ioms_production
```

### Step 6: Run Migrations

```bash
# Check migration status
node database/lib/migration-runner.js status

# Run migrations
node database/lib/migration-runner.js run

# Verify tables were created
psql -U postgres -d ioms_production -c "\dt"
```

You should see:
- ✅ users
- ✅ sessions  
- ✅ migration_history

### Step 7: Seed Test Data (Optional)

```bash
# Create test users
node database/seeds/run-seeds.js

# Verify
psql -U postgres -d ioms_production -c "SELECT id, name, email_hash FROM users;"
```

## 🧪 Testing the Setup

### Test User Model

```bash
node -e "
const User = require('./database/models/User');
(async () => {
  try {
    const user = await User.createUser({
      name: 'Test User',
      email: 'test@example.com',
      password: 'TestPass123',
      phone: '+1234567890'
    });
    console.log('✅ User created:', user);
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
})();
"
```

### Test Session Model

```bash
node -e "
const Session = require('./database/models/Session');
const User = require('./database/models/User');
(async () => {
  try {
    const user = await User.findByEmail('test@example.com');
    if (user) {
      const session = await Session.createSession({
        userId: user.id,
        ipAddress: '127.0.0.1',
        device: 'Test Device'
      });
      console.log('✅ Session created:', session);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    process.exit(0);
  }
})();
"
```

## 🔍 Verification Checklist

- [ ] PostgreSQL installed and running
- [ ] Database `ioms_production` created
- [ ] `.env` file configured with database credentials
- [ ] Encryption key added to `.env`
- [ ] `npm install` completed successfully
- [ ] Connection test passed
- [ ] Migrations ran successfully
- [ ] Tables visible in database
- [ ] Test user creation works
- [ ] Test session creation works

## 🚨 Troubleshooting

### Connection Refused

**Error:** `ECONNREFUSED`

**Fix:**
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL
brew services start postgresql@15  # macOS
sudo systemctl start postgresql    # Linux
```

### Authentication Failed

**Error:** `password authentication failed`

**Fix:**
1. Check password in `.env`
2. Reset PostgreSQL password:
   ```bash
   psql -U postgres
   ALTER USER postgres PASSWORD 'newpassword';
   ```
3. Update `.env` with new password

### Database Does Not Exist

**Error:** `database "ioms_production" does not exist`

**Fix:**
```bash
createdb -U postgres ioms_production
```

### Encryption Key Error

**Error:** `ENCRYPTION_KEY must be 64 hex characters`

**Fix:**
```bash
# Generate new key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy output to .env ENCRYPTION_KEY
```

### Migration Already Applied

**Error:** `duplicate key value violates unique constraint`

**Fix:**
```bash
# Check which migrations are applied
node database/lib/migration-runner.js status

# If needed, manually check migration_history
psql -U postgres -d ioms_production -c "SELECT * FROM migration_history;"
```

## 📚 Next Steps

After successful setup:

1. ✅ **Test locally** - Create users, sessions, test all operations
2. ✅ **Build APIs** - Create signup/login endpoints
3. ✅ **Update frontend** - Connect to new backend APIs
4. ✅ **GCP preparation** - Plan Cloud SQL deployment

## 🔐 Security Reminders

- ⚠️ **NEVER** commit `.env` to Git
- ⚠️ **NEVER** share encryption keys
- ⚠️ Use different keys for dev/staging/production
- ⚠️ Rotate encryption keys every 90 days
- ⚠️ Use GCP Secret Manager in production

## 📞 Need Help?

Check these files:
- `database/README.md` - Main documentation
- `database/migrations/README.md` - Migration guide
- `database/schema/README.md` - Schema guide

---

**Setup Complete!** 🎉

Your database layer is now ready for development.











