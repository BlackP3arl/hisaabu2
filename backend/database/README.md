# Database Setup Guide

This directory contains all database migration files, triggers, functions, and views for the Hisaabu application.

## Structure

```
database/
├── migrations/          # Table creation migrations (in order)
├── triggers/           # Database trigger functions
├── views/              # Database views
├── seeds/              # Seed data (optional)
├── setup_database.sql  # Complete setup script
└── README.md          # This file
```

## Prerequisites

- PostgreSQL 14+ installed and running
- Database user with CREATE privileges
- Database named `hisaabu` (or your preferred name)

## Quick Setup

### Option 1: Using setup_database.sql (Recommended)

```bash
# Create database
createdb hisaabu

# Run setup script
psql -U postgres -d hisaabu -f setup_database.sql
```

### Option 2: Manual Setup

```bash
# Create database
createdb hisaabu

# Connect to database
psql -U postgres -d hisaabu

# Run migrations in order
\i migrations/001_create_users_table.sql
\i migrations/002_create_clients_table.sql
\i migrations/003_create_categories_table.sql
\i migrations/004_create_items_table.sql
\i migrations/005_create_quotations_table.sql
\i migrations/006_create_quotation_items_table.sql
\i migrations/007_create_invoices_table.sql
\i migrations/008_create_invoice_items_table.sql
\i migrations/009_create_payments_table.sql
\i migrations/010_create_company_settings_table.sql
\i migrations/011_create_share_links_table.sql
\i migrations/012_add_foreign_keys.sql

# Create triggers
\i triggers/update_updated_at.sql
\i triggers/update_invoice_totals.sql
\i triggers/update_quotation_totals.sql
\i triggers/update_invoice_payment_status.sql
\i triggers/update_category_item_count.sql

# Create views
\i views/client_summary.sql
```

## Migration Files

### 001_create_users_table.sql
Creates the `users` table for authentication and user profiles.

### 002_create_clients_table.sql
Creates the `clients` table for client/customer information.

### 003_create_categories_table.sql
Creates the `categories` table for item categories.

### 004_create_items_table.sql
Creates the `items` table for service/product items master data.

### 005_create_quotations_table.sql
Creates the `quotations` table for quotation documents.

### 006_create_quotation_items_table.sql
Creates the `quotation_items` table for quotation line items.

### 007_create_invoices_table.sql
Creates the `invoices` table for invoice documents.

### 008_create_invoice_items_table.sql
Creates the `invoice_items` table for invoice line items.

### 009_create_payments_table.sql
Creates the `payments` table for payment records.

### 010_create_company_settings_table.sql
Creates the `company_settings` table for company configuration.

### 011_create_share_links_table.sql
Creates the `share_links` table for secure share links.

### 012_add_foreign_keys.sql
Adds all foreign key constraints after all tables are created.

## Triggers

### update_updated_at.sql
Automatically updates `updated_at` timestamp on all tables with that column.

### update_invoice_totals.sql
Automatically recalculates invoice totals when line items change.

### update_quotation_totals.sql
Automatically recalculates quotation totals when line items change.

### update_invoice_payment_status.sql
Automatically updates invoice status and payment amounts when payments change.

### update_category_item_count.sql
Maintains denormalized `item_count` in categories table.

## Views

### client_summary.sql
Aggregated view of client financial information including:
- Total quotations
- Total invoices
- Total billed
- Total paid
- Outstanding balance

## Verification

After setup, verify the database:

```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check all triggers exist
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Check all views exist
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public';
```

## Environment Variables

Set these in your `.env` file:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/hisaabu
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hisaabu
DB_USER=postgres
DB_PASSWORD=your_password
```

## Troubleshooting

### Error: relation already exists
If a table already exists, you can either:
1. Drop the existing table: `DROP TABLE table_name CASCADE;`
2. Use `CREATE TABLE IF NOT EXISTS` (already included in migrations)

### Error: foreign key constraint fails
Make sure to run migrations in order. Foreign keys are added in migration 012.

### Error: function already exists
Triggers use `CREATE OR REPLACE FUNCTION`, so this should not be an issue.

### Reset Database

To completely reset the database:

```sql
-- Drop all tables (in reverse order of dependencies)
DROP TABLE IF EXISTS share_links CASCADE;
DROP TABLE IF EXISTS company_settings CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS quotation_items CASCADE;
DROP TABLE IF EXISTS quotations CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS clients CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop all functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_invoice_totals() CASCADE;
DROP FUNCTION IF EXISTS update_quotation_totals() CASCADE;
DROP FUNCTION IF EXISTS update_invoice_payment_status() CASCADE;
DROP FUNCTION IF EXISTS update_category_item_count() CASCADE;

-- Drop all views
DROP VIEW IF EXISTS client_summary CASCADE;
```

Then run `setup_database.sql` again.

## Next Steps

After database setup:
1. Configure backend application to connect to database
2. Implement authentication endpoints
3. Implement CRUD endpoints
4. Test all database operations

## Notes

- All monetary values use `DECIMAL(10,2)` for precision
- All timestamps use `TIMESTAMP` with timezone awareness
- Document numbers (invoice/quotation) are unique per user (composite unique index)
- Share link tokens use UUID v4 (requires uuid-ossp extension)
- Triggers automatically maintain data integrity and calculated fields


