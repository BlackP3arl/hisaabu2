-- Cleanup Script: Remove old tables from previous setup
-- Description: Drops tables from previous database schema
-- Usage: psql -U postgres -d hisaabu -f cleanup_old_tables.sql
-- Created: 2024-01-25

-- Drop old tables from previous setup
DROP TABLE IF EXISTS _prisma_migrations CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS platform_admins CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS sequences CASCADE;

-- Verify only our tables remain
SELECT 
    COUNT(*) as total_tables,
    string_agg(table_name, ', ' ORDER BY table_name) as tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE';

-- Display success message
SELECT 'Old tables removed successfully! Only our schema tables remain.' AS status;



