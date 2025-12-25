-- Migration: Add currency and exchange_rate to quotations
-- Description: Adds currency and exchange_rate fields to quotations table for multi-currency support
-- Created: 2024-01-25

-- Add currency column (defaults to company currency, will be set via application logic)
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'MVR';

-- Add exchange_rate column (nullable, only needed when currency ≠ base currency)
ALTER TABLE quotations 
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,4) NULL;

-- Update existing quotations to have MVR currency and NULL exchange_rate
UPDATE quotations 
SET currency = 'MVR', exchange_rate = NULL 
WHERE currency IS NULL;

-- Add constraint for exchange_rate (must be > 0 if provided)
ALTER TABLE quotations 
ADD CONSTRAINT chk_exchange_rate CHECK (exchange_rate IS NULL OR exchange_rate > 0);

-- Add comments
COMMENT ON COLUMN quotations.currency IS 'Currency code for this quotation (ISO 4217)';
COMMENT ON COLUMN quotations.exchange_rate IS 'Exchange rate to base currency (1 [currency] = exchange_rate USD). NULL if currency is base currency.';

