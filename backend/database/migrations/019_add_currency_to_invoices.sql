-- Migration: Add currency and exchange_rate to invoices
-- Description: Adds currency and exchange_rate fields to invoices table for multi-currency support
-- Created: 2024-01-25

-- Add currency column (defaults to company currency, will be set via application logic)
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'MVR';

-- Add exchange_rate column (nullable, only needed when currency ≠ base currency)
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS exchange_rate DECIMAL(10,4) NULL;

-- Update existing invoices to have MVR currency and NULL exchange_rate
UPDATE invoices 
SET currency = 'MVR', exchange_rate = NULL 
WHERE currency IS NULL;

-- Add constraint for exchange_rate (must be > 0 if provided)
ALTER TABLE invoices 
ADD CONSTRAINT chk_exchange_rate CHECK (exchange_rate IS NULL OR exchange_rate > 0);

-- Add comments
COMMENT ON COLUMN invoices.currency IS 'Currency code for this invoice (ISO 4217)';
COMMENT ON COLUMN invoices.exchange_rate IS 'Exchange rate to base currency (1 [currency] = exchange_rate USD). NULL if currency is base currency.';


