

# IOMS Database Layer

Independent database layer for IOMS application using PostgreSQL.

## 📁 Structure

```
database/
├── migrations/          # Version-controlled database changes
├── schema/             # Current snapshot of database schema
├── lib/                # Core database utilities
│   ├── connection.js   # PostgreSQL connection pool
│   ├── encryption.js   # AES-256-GCM encryption
│   ├── migration-runner.js  # Migration execution
│   └── queries/        # SQL query definitions
├── models/             # Data access layer (ORM-like)
├── seeds/              # Test data for development
└── config/             # Database configuration

```

## 🚀 Quick Start

### 1. Setup Environment Variables

Copy `.env.example` to `.env` and fill in your database credentials:

```bash
# Database Connection
DB_HOST=localhost
DB_PORT=5432
DB_NAME=ioms_production
DB_USER=postgres
DB_PASSWORD=your_password

# Encryption (CRITICAL: Keep secret, use GCP KMS in production)
ENCRYPTION_KEY=your_64_character_hex_key

# Environment
NODE_ENV=development
```

### 2. Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output to `ENCRYPTION_KEY` in `.env`.

### 3. Run Migrations

```bash
# Check migration status
node database/lib/migration-runner.js status

# Run migrations
node database/lib/migration-runner.js run

# Dry run (see what would be executed)
node database/lib/migration-runner.js dry-run
```

### 4. Test Connection

```bash
node -e "require('./database/lib/connection').testConnection()"
```

## 📚 Usage Examples

### User Operations

```javascript
const User = require('./database/models/User');

// Create user
const user = await User.createUser({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'securePassword123',
  phone: '+1234567890',
  tenantId: 'restaurant-uuid'
});

// Find by email
const user = await User.findByEmail('john@example.com');

// Verify password
const user = await User.verifyPassword('john@example.com', 'password123');

// Update user
await User.updateUser(userId, {
  name: 'Jane Doe',
  phone: '+0987654321'
});
```

### Session Operations

```javascript
const Session = require('./database/models/Session');

// Create session
const session = await Session.createSession({
  userId: 'user-uuid',
  ipAddress: '192.168.1.1',
  device: 'Mozilla/5.0...',
  expiryDays: 30
});

// Validate session
const validSession = await Session.validateSession(sessionToken);

// Logout
await Session.logoutSession(sessionToken);

// Logout all user sessions
await Session.logoutAllUserSessions(userId);
```

## 🔐 Security Features

### Encryption
- **Email & Phone**: AES-256-GCM encryption
- **Email Hash**: SHA-256 for lookups
- **Password**: bcrypt with 10 salt rounds

### Password Requirements
- Minimum 8 characters
- At least one number
- Special characters optional

### Session Security
- 30-day expiration (configurable)
- Multiple device support
- Activity tracking
- IP and device logging

## 📊 Database Schema

### Users Table
- Stores user account information
- Email and phone are encrypted
- Email hash for lookups
- Multi-tenant support via tenant_id

### Sessions Table
- Tracks authenticated sessions
- Supports multiple devices per user
- Auto-expires after 30 days
- CASCADE delete when user deleted

### Migration History Table
- Tracks applied migrations
- Prevents duplicate execution
- Records execution time and status

## 🔄 Migration System

### Creating New Migrations

1. Create file: `migrations/00X_description.sql`
2. Write SQL statements
3. Update corresponding schema file
4. Run migration

### Migration Naming Convention

```
001_create_users_table.sql
002_create_sessions_table.sql
003_add_column_to_users.sql
```

### Best Practices

- ✅ One logical change per migration
- ✅ Use transactions (handled automatically)
- ✅ Test migrations locally first
- ✅ Never edit applied migrations
- ✅ Update schema/ files when migrations change structure

## 🌐 GCP Deployment

### Local → GCP Migration Checklist

- [ ] Move encryption keys to GCP Secret Manager
- [ ] Setup Cloud SQL PostgreSQL instance
- [ ] Configure Cloud SQL Proxy or IP whitelist
- [ ] Update connection settings in production .env
- [ ] Run migrations on production database
- [ ] Implement GCP KMS for encryption (replace .env keys)
- [ ] Setup automated backups
- [ ] Configure monitoring and alerts

### GCP-Specific Configuration

```javascript
// Update database.config.js for production
production: {
  host: '/cloudsql/PROJECT:REGION:INSTANCE',  // Unix socket
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.DB_SSL_CA
  }
}
```

## 🛠️ Maintenance

### Cleanup Old Sessions

```javascript
const Session = require('./database/models/Session');

// Remove expired sessions
await Session.cleanupExpiredSessions();

// Remove sessions older than 90 days
await Session.cleanupOldSessions(90);
```

### Database Backups

```bash
# Backup
pg_dump -U postgres ioms_production > backup.sql

# Restore
psql -U postgres ioms_production < backup.sql
```

## 📝 Logging

All database operations are logged with:
- Query text
- Execution time
- Row count
- Errors (if any)

## ⚠️ Important Notes

### DO NOT:
- ❌ Commit `.env` file to Git
- ❌ Store encryption keys in code
- ❌ Edit applied migrations
- ❌ Share database credentials

### DO:
- ✅ Use environment variables
- ✅ Rotate encryption keys regularly
- ✅ Keep migrations in version control
- ✅ Test locally before production deployment
- ✅ Use GCP KMS in production

## 🆘 Troubleshooting

### Connection Issues
```bash
# Test PostgreSQL is running
psql -U postgres -c "SELECT version();"

# Check connection from Node
node database/lib/connection.js
```

### Migration Issues
```bash
# Check migration status
node database/lib/migration-runner.js status

# Check migration_history table
psql -U postgres ioms_production -c "SELECT * FROM migration_history;"
```

### Encryption Issues
```bash
# Verify encryption key length (should be 64 hex chars)
node -e "console.log(process.env.ENCRYPTION_KEY.length)"
```

## 📞 Support

For issues or questions:
1. Check this README
2. Review migration files in `migrations/`
3. Check schema snapshots in `schema/`
4. Review model documentation in `models/`

---

**Version**: 1.0.0  
**Last Updated**: 2025-01-21  
**Database**: PostgreSQL 12+  
**Node**: 18+











