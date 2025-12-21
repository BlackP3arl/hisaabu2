-- Database Setup Script
-- Description: Complete database setup for Hisaabu application
-- Usage: Run from database directory: psql -U postgres -d hisaabu -f setup_database.sql
-- Or use: ./create_database.sh
-- Created: 2024-01-25

-- Enable UUID extension for share_links tokens
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: This script should be run from the database/ directory
-- The \i commands use relative paths from the current working directory

-- Run all migrations in order
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
\i migrations/013_create_taxes_table.sql
\i migrations/014_add_default_tax_id_to_company_settings.sql
\i migrations/015_add_document_taxes_to_invoices_quotations.sql
\i migrations/016_add_gst_applicable_to_items.sql

-- Create trigger functions
\i triggers/update_updated_at.sql
\i triggers/update_invoice_totals.sql
\i triggers/update_quotation_totals.sql
\i triggers/update_invoice_payment_status.sql
\i triggers/update_category_item_count.sql

-- Create views
\i views/client_summary.sql

-- Display success message
SELECT 'Database setup completed successfully!' AS status;

