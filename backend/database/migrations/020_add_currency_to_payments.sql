-- Migration: Add currency to payments
-- Description: Adds currency field to payments table (must match invoice currency)
-- Created: 2024-01-25

-- Add currency column
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'MVR';

-- Update existing payments to have MVR currency (matching existing invoices)
UPDATE payments p
SET currency = COALESCE(
    (SELECT i.currency FROM invoices i WHERE i.id = p.invoice_id),
    'MVR'
)
WHERE currency IS NULL;

-- Add comment
COMMENT ON COLUMN payments.currency IS 'Currency code for this payment (ISO 4217, must match invoice currency)';


