-- Database Verification SQL Script
-- Run this script to verify all database components
-- Usage: psql -U postgres -d hisaabu -f verify_database.sql

\echo '========================================'
\echo 'Database Verification Checklist'
\echo '========================================'
\echo ''

-- 1. Check All Tables Exist
\echo '=== 1. Checking All Tables Exist ==='
SELECT 
    CASE 
        WHEN COUNT(*) = 11 THEN '✓ All 11 tables exist'
        ELSE '✗ Expected 11 tables, found: ' || COUNT(*)
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

\echo ''
\echo 'Tables found:'
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;
\echo ''

-- 2. Check Key Indexes
\echo '=== 2. Checking Key Indexes ==='
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ ' || indexname || ' exists'
        ELSE '✗ ' || indexname || ' missing'
    END as status
FROM pg_indexes
WHERE schemaname = 'public'
  AND indexname IN ('idx_users_email', 'idx_clients_user_id', 'idx_quotations_number_user', 'idx_invoices_number_user', 'idx_share_links_token')
ORDER BY indexname;
\echo ''

-- 3. Check Foreign Keys
\echo '=== 3. Checking Foreign Keys ==='
SELECT 
    CASE 
        WHEN COUNT(*) >= 13 THEN '✓ Found ' || COUNT(*) || ' foreign keys (expected at least 13)'
        ELSE '✗ Expected at least 13 foreign keys, found: ' || COUNT(*)
    END as status
FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' 
  AND table_schema = 'public';
\echo ''

\echo 'Foreign keys found:'
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;
\echo ''

-- 4. Check Triggers
\echo '=== 4. Checking Triggers ==='
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ ' || trigger_name || ' exists'
        ELSE '✗ ' || trigger_name || ' missing'
    END as status
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'trigger_users_updated_at',
    'trigger_clients_updated_at',
    'trigger_categories_updated_at',
    'trigger_items_updated_at',
    'trigger_quotations_updated_at',
    'trigger_invoices_updated_at',
    'trigger_company_settings_updated_at',
    'trigger_update_invoice_totals',
    'trigger_update_quotation_totals',
    'trigger_update_invoice_payment_status',
    'trigger_update_category_item_count'
  )
ORDER BY trigger_name;
\echo ''

-- 5. Check Functions
\echo '=== 5. Checking Functions ==='
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ ' || routine_name || '() exists'
        ELSE '✗ ' || routine_name || '() missing'
    END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
  AND routine_name IN (
    'update_updated_at_column',
    'update_invoice_totals',
    'update_quotation_totals',
    'update_invoice_payment_status',
    'update_category_item_count'
  )
ORDER BY routine_name;
\echo ''

-- 6. Check Views
\echo '=== 6. Checking Views ==='
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ client_summary view exists'
        ELSE '✗ client_summary view missing'
    END as status
FROM information_schema.views 
WHERE table_schema = 'public'
  AND table_name = 'client_summary';
\echo ''

-- 7. Check Constraints
\echo '=== 7. Checking Constraints ==='
SELECT 
    'Found ' || COUNT(*) || ' constraints (CHECK and UNIQUE)' as status
FROM information_schema.table_constraints 
WHERE table_schema = 'public'
  AND constraint_type IN ('CHECK', 'UNIQUE');
\echo ''

-- 8. Check UUID Extension
\echo '=== 8. Checking UUID Extension ==='
SELECT 
    CASE 
        WHEN COUNT(*) > 0 THEN '✓ uuid-ossp extension installed (version: ' || extversion || ')'
        ELSE '✗ uuid-ossp extension missing'
    END as status
FROM pg_extension 
WHERE extname = 'uuid-ossp';
\echo ''

-- 9. Check Table Structures (Users table)
\echo '=== 9. Checking Table Structures (Users table) ==='
SELECT 
    CASE 
        WHEN COUNT(*) = 7 THEN '✓ users table has all required columns'
        ELSE '✗ users table missing columns (expected 7, found ' || COUNT(*) || ')'
    END as status
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN ('id', 'email', 'password_hash', 'name', 'role', 'created_at', 'updated_at');
\echo ''

\echo 'Users table columns:'
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
ORDER BY ordinal_position;
\echo ''

-- 10. Test Trigger (updated_at)
\echo '=== 10. Testing updated_at Trigger ==='
-- Create test user
INSERT INTO users (email, password_hash, name) 
VALUES ('verify_test@example.com', 'test_hash', 'Test User')
ON CONFLICT (email) DO NOTHING;

-- Get initial timestamp
DO $$
DECLARE
    initial_time TIMESTAMP;
    updated_time TIMESTAMP;
BEGIN
    SELECT updated_at INTO initial_time 
    FROM users 
    WHERE email = 'verify_test@example.com';
    
    -- Wait a moment (PostgreSQL doesn't have sleep, so we'll just update)
    PERFORM pg_sleep(1);
    
    -- Update the user
    UPDATE users 
    SET name = 'Updated Name' 
    WHERE email = 'verify_test@example.com';
    
    SELECT updated_at INTO updated_time 
    FROM users 
    WHERE email = 'verify_test@example.com';
    
    IF initial_time != updated_time THEN
        RAISE NOTICE '✓ updated_at trigger is working';
    ELSE
        RAISE NOTICE '✗ updated_at trigger may not be working';
    END IF;
    
    -- Cleanup
    DELETE FROM users WHERE email = 'verify_test@example.com';
END $$;
\echo ''

-- Summary
\echo '========================================'
\echo 'Verification Complete'
\echo '========================================'
\echo ''
\echo 'Review the results above. All checks should show ✓ (checkmark).'
\echo 'If any show ✗ (cross), please review the database setup.'
\echo ''



