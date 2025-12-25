# How to Run Database Verification

## Quick Start

Run the verification script to check if your database is properly set up:

```bash
cd backend/database
psql -U postgres -d hisaabu -f verify_database.sql
```

If you need to specify a password or different connection details:

```bash
psql -h localhost -p 5432 -U postgres -d hisaabu -f verify_database.sql
```

---

## Alternative: Interactive Bash Script

For a more detailed interactive verification:

```bash
cd backend/database
./verify_database.sh
```

This will:
- Prompt for database credentials
- Run all verification checks
- Provide a summary with pass/fail status

---

## Manual Verification

If you prefer to verify manually, connect to the database and run these queries:

### 1. Check Tables
```sql
SELECT COUNT(*) FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';
-- Should return 11
```

### 2. List All Tables
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

### 3. Check Foreign Keys
```sql
SELECT COUNT(*) 
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
  AND table_schema = 'public';
-- Should return at least 13
```

### 4. Check Triggers
```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;
-- Should show at least 11 triggers
```

### 5. Check Functions
```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;
-- Should show at least 5 functions
```

### 6. Check Views
```sql
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';
-- Should show client_summary
```

### 7. Check Extension
```sql
SELECT extname, extversion 
FROM pg_extension 
WHERE extname = 'uuid-ossp';
-- Should show uuid-ossp
```

---

## Expected Results

After running verification, you should see:

✅ **All checks passing** - Database is ready for backend implementation

If any checks fail:
- Review the error messages
- Check that all migrations were run
- Verify database setup was completed successfully
- See `VERIFICATION.md` for detailed troubleshooting

---

## Next Steps

Once verification passes:

1. ✅ Database verified and ready
2. ⏭️ Proceed to backend initialization
3. ⏭️ See `backend/NEXT_STEPS.md` for implementation plan

---

## Troubleshooting

### Can't Connect to Database

**Error**: `FATAL: database "hisaabu" does not exist`

**Solution**: Create the database first:
```bash
createdb -U postgres hisaabu
# Then run setup_database.sql
psql -U postgres -d hisaabu -f setup_database.sql
```

### Permission Denied

**Error**: `FATAL: password authentication failed`

**Solution**: 
- Use correct PostgreSQL user and password
- Or configure PostgreSQL for local trust authentication

### Missing Tables/Functions

**Error**: Tables or functions not found

**Solution**: Run the database setup:
```bash
cd backend/database
./create_database.sh
# Or manually:
psql -U postgres -d hisaabu -f setup_database.sql
```



