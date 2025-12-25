# Quick Start Guide

## Setup Database in 3 Steps

### Step 1: Ensure PostgreSQL is Running

```bash
# Check PostgreSQL status
pg_isready

# Or start PostgreSQL (varies by OS)
# macOS: brew services start postgresql
# Linux: sudo systemctl start postgresql
# Windows: Start PostgreSQL service
```

### Step 2: Run Setup Script

```bash
cd backend/database
./create_database.sh
```

Follow the prompts:
- Database name: `hisaabu` (or your choice)
- Database user: `postgres` (or your PostgreSQL user)
- Database password: (your PostgreSQL password)
- Database host: `localhost` (default)
- Database port: `5432` (default)

### Step 3: Verify Setup

```bash
# Connect to database
psql -U postgres -d hisaabu

# Run verification queries (see VERIFICATION.md)
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Should return 11

# Exit
\q
```

## Alternative: Manual Setup

```bash
# Create database
createdb hisaabu

# Run setup script
cd backend/database
psql -U postgres -d hisaabu -f setup_database.sql
```

## Connection String

After setup, use this connection string in your backend:

```
postgresql://username:password@localhost:5432/hisaabu
```

## Common Commands

```bash
# Connect to database
psql -U postgres -d hisaabu

# List all tables
\dt

# Describe a table
\d table_name

# List all functions
\df

# List all triggers
SELECT * FROM information_schema.triggers;

# Exit psql
\q
```

## Troubleshooting

**Error: database does not exist**
```bash
createdb hisaabu
```

**Error: permission denied**
```bash
# Grant permissions or use superuser
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE hisaabu TO your_user;"
```

**Error: extension uuid-ossp does not exist**
```sql
-- Run in psql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## Next Steps

1. ✅ Database created
2. ⏭️ Set up backend Express.js server
3. ⏭️ Configure database connection
4. ⏭️ Implement API endpoints

See `backend/README.md` for next steps.



