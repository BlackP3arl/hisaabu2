-- Migration: Make items.rate nullable
-- Description: Makes rate field nullable in items table - prices will be entered at document level
-- Created: 2024-01-25

-- Remove NOT NULL constraint from rate column
ALTER TABLE items 
ALTER COLUMN rate DROP NOT NULL;

-- Update constraint to allow NULL (rate can be >= 0 or NULL)
ALTER TABLE items 
DROP CONSTRAINT IF EXISTS chk_rate;

ALTER TABLE items 
ADD CONSTRAINT chk_rate CHECK (rate IS NULL OR rate >= 0);

-- Update comment
COMMENT ON COLUMN items.rate IS 'Unit price per piece (optional - prices entered at document level for multi-currency support)';

