-- Run Tax System Migrations
-- Description: Creates taxes table and updates existing tables for tax system
-- Usage: psql -U postgres -d hisaabu -f run_tax_migrations.sql

-- Migration 013: Create taxes table
\i migrations/013_create_taxes_table.sql

-- Migration 014: Add default_tax_id to company_settings
\i migrations/014_add_default_tax_id_to_company_settings.sql

-- Migration 015: Add document_taxes to invoices and quotations
\i migrations/015_add_document_taxes_to_invoices_quotations.sql

-- Display success message
SELECT 'Tax system migrations completed successfully!' AS status;


