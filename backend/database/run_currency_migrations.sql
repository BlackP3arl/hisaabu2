-- Run Multi-Currency Support Migrations
-- Description: Runs migrations 017-021 for multi-currency support
-- Usage: psql -U postgres -d hisaabu -f run_currency_migrations.sql
-- Or from database directory: psql -U postgres -d hisaabu -f database/run_currency_migrations.sql

-- Migration 017: Add base_currency to company_settings
\i migrations/017_add_base_currency_to_company_settings.sql

-- Migration 018: Add currency and exchange_rate to quotations
\i migrations/018_add_currency_to_quotations.sql

-- Migration 019: Add currency and exchange_rate to invoices
\i migrations/019_add_currency_to_invoices.sql

-- Migration 020: Add currency to payments
\i migrations/020_add_currency_to_payments.sql

-- Migration 021: Make items.rate nullable
\i migrations/021_make_items_rate_nullable.sql

-- Display success message
SELECT 'Multi-currency migrations completed successfully!' AS status;


