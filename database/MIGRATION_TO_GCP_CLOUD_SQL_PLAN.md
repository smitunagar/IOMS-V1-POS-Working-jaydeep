# Migration Plan: Local PostgreSQL → GCP Cloud SQL

## 📋 Overview
This plan outlines the step-by-step migration from local PostgreSQL database to GCP Cloud SQL while maintaining zero downtime and data integrity.

## 🎯 Objectives
1. Migrate all database connections from local PostgreSQL to GCP Cloud SQL
2. Ensure all 7 existing tables work correctly with GCP Cloud SQL
3. Maintain backward compatibility during transition
4. Implement proper SSL/TLS connections
5. Update environment configuration
6. Test all API endpoints

---

## 📊 Current State Analysis

### Current Database Configuration
- **Location**: `database/config/database.config.js` and `src/lib/database/config/database.config.js`
- **Current Environment**: Development (local PostgreSQL)
- **Connection Method**: Direct PostgreSQL connection via `pg` library
- **Tables**: 7 tables already exist in GCP Cloud SQL

### Database Connection Points
1. **API Routes** (using `@/lib/database/lib/connection`):
   - `/api/auth/login`
   - `/api/auth/signup`
   - `/api/auth/logout`
   - `/api/auth/me`
   - `/api/users`
   - `/api/users/create`
   - `/api/user-roles`
   - `/api/roles`
   - `/api/restaurants`
   - `/api/restaurants/[id]`
   - `/api/restaurants/setup`
   - `/api/restaurants/cuisine-types`

2. **Server Routes**:
   - `/server/api/user-management`
   - `/server/api/user-management/roles`

3. **Database Models**:
   - User
   - Session
   - Restaurant
   - AuditLog
   - Role

---

## 🔍 Information Required from You

Before we proceed, I need the following information about your GCP Cloud SQL instance:

### 1. **Connection Details**
- [ ] **Cloud SQL Instance Connection Name** (format: `project:region:instance-name`)
- [ ] **Public IP Address** (if using public IP)
- [ ] **Private IP Address** (if using private IP/VPC)
- [ ] **Port** (usually 5432)
- [ ] **Database Name** (confirm it's `ioms_production` or different?)
- [ ] **Database User** (username for connection)
- [ ] **Database Password** (we'll store this securely in env)

### 2. **SSL/TLS Configuration**
- [ ] **SSL Mode**: Do you want to use SSL? (Recommended: Yes)
- [ ] **SSL Certificate**: Do you have the server CA certificate?
  - If yes, where is it located?
  - If no, we can download it from GCP Console
- [ ] **Connection Method**: 
  - [ ] Public IP with SSL
  - [ ] Private IP (VPC)
  - [ ] Cloud SQL Proxy (recommended for production)

### 3. **Network Configuration**
- [ ] **Connection Method Preference**:
  - Option A: Direct connection via public/private IP
  - Option B: Cloud SQL Proxy (more secure, recommended)
- [ ] **IP Whitelist**: Do you need to whitelist specific IPs?
- [ ] **VPC Configuration**: Are you using VPC? If yes, which network?

### 4. **Data Migration**
- [ ] **Data Sync**: Do you want to migrate existing local data to GCP?
- [ ] **Migration Strategy**: 
  - [ ] Full migration (copy all data)
  - [ ] Fresh start (use existing GCP tables only)
- [ ] **Backup Strategy**: Do you have backups of local database?

### 5. **Environment Setup**
- [ ] **Current NODE_ENV**: What environment are you running? (development/production)
- [ ] **Environment File**: Where is your `.env.local` or `.env` file?
- [ ] **Secrets Management**: How do you want to store sensitive credentials?
  - [ ] Environment variables
  - [ ] GCP Secret Manager (recommended)
  - [ ] Other method?

---

## 📝 Execution Plan (Step-by-Step)

### Phase 1: Preparation & Information Gathering ✅
- [x] Analyze current database configuration
- [x] Identify all connection points
- [ ] **WAITING FOR YOUR INPUT** - Gather GCP Cloud SQL connection details

### Phase 2: Environment Configuration
- [ ] Create/update `.env.local` with GCP credentials
- [ ] Configure SSL certificates (if using SSL)
- [ ] Set up Cloud SQL Proxy (if using proxy method)
- [ ] Update `database.config.js` with GCP settings
- [ ] Test connection to GCP Cloud SQL

### Phase 3: Connection Testing
- [ ] Test basic connection to GCP Cloud SQL
- [ ] Verify all 7 tables are accessible
- [ ] Test read operations (SELECT queries)
- [ ] Test write operations (INSERT/UPDATE/DELETE)
- [ ] Verify connection pooling works correctly

### Phase 4: API Route Updates
- [ ] Update connection imports to use GCP config
- [ ] Test each API endpoint:
  - [ ] `/api/auth/login`
  - [ ] `/api/auth/signup`
  - [ ] `/api/auth/logout`
  - [ ] `/api/auth/me`
  - [ ] `/api/users`
  - [ ] `/api/users/create`
  - [ ] `/api/user-roles`
  - [ ] `/api/roles`
  - [ ] `/api/restaurants`
  - [ ] `/api/restaurants/[id]`
  - [ ] `/api/restaurants/setup`
  - [ ] `/api/restaurants/cuisine-types`
  - [ ] `/server/api/user-management`
  - [ ] `/server/api/user-management/roles`

### Phase 5: Model Testing
- [ ] Test User model operations
- [ ] Test Session model operations
- [ ] Test Restaurant model operations
- [ ] Test AuditLog model operations
- [ ] Test Role model operations

### Phase 6: Data Migration (if needed)
- [ ] Export data from local database
- [ ] Verify data integrity
- [ ] Import data to GCP Cloud SQL
- [ ] Verify all records migrated correctly

### Phase 7: Switchover
- [ ] Update NODE_ENV to production (or create new env)
- [ ] Update all environment variables
- [ ] Restart application
- [ ] Monitor for errors
- [ ] Verify all functionality works

### Phase 8: Validation & Cleanup
- [ ] Run comprehensive API tests
- [ ] Verify audit logging works
- [ ] Check connection pool performance
- [ ] Monitor error logs
- [ ] Document final configuration
- [ ] Remove local database references (optional)

---

## 🔧 Technical Implementation Details

### Connection Configuration Options

#### Option 1: Direct Connection (Public IP)
```javascript
production: {
  host: 'YOUR_PUBLIC_IP',
  port: 5432,
  database: 'ioms_production',
  user: 'YOUR_USER',
  password: 'YOUR_PASSWORD',
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync('path/to/server-ca.pem').toString()
  }
}
```

#### Option 2: Cloud SQL Proxy (Recommended)
```javascript
production: {
  host: '/cloudsql/PROJECT:REGION:INSTANCE',
  port: 5432,
  database: 'ioms_production',
  user: 'YOUR_USER',
  password: 'YOUR_PASSWORD',
  // No SSL needed when using proxy
}
```

#### Option 3: Private IP (VPC)
```javascript
production: {
  host: 'YOUR_PRIVATE_IP',
  port: 5432,
  database: 'ioms_production',
  user: 'YOUR_USER',
  password: 'YOUR_PASSWORD',
  ssl: false // Usually not needed in VPC
}
```

---

## ⚠️ Risk Mitigation

### Rollback Plan
1. Keep local database running during migration
2. Maintain environment variable for quick switch
3. Keep database config with both local and GCP options
4. Document exact steps to revert

### Testing Strategy
1. Test in staging environment first
2. Use feature flags to toggle between databases
3. Monitor error rates and performance
4. Have rollback procedure ready

### Data Safety
1. Backup local database before migration
2. Verify GCP Cloud SQL has backups enabled
3. Test data integrity after migration
4. Keep local database for 1-2 weeks after migration

---

## 📋 Checklist for You

Please provide the following information so we can proceed:

- [ ] GCP Cloud SQL instance connection name
- [ ] Connection method preference (Public IP / Private IP / Cloud SQL Proxy)
- [ ] Database credentials (user, password)
- [ ] SSL certificate (if using SSL)
- [ ] Data migration preference (migrate data or fresh start)
- [ ] Current environment setup details

---

## 🚀 Next Steps

Once you provide the required information, we will:
1. Update the database configuration files
2. Create connection test scripts
3. Update environment variables
4. Test each API endpoint
5. Execute the migration step by step

---

## 📞 Questions?

If you need clarification on any step or have questions about the migration process, please ask before we proceed with implementation.





