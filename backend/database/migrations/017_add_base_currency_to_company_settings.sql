-- Migration: Add base_currency to company_settings
-- Description: Adds base_currency field to company_settings table for multi-currency support
-- Created: 2024-01-25

-- Add base_currency column
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS base_currency VARCHAR(3) NOT NULL DEFAULT 'USD';

-- Update existing records to have USD as base currency
UPDATE company_settings 
SET base_currency = 'USD' 
WHERE base_currency IS NULL;

-- Add comment
COMMENT ON COLUMN company_settings.base_currency IS 'Base currency for exchange rate calculations (ISO 4217 code, default: USD)';

