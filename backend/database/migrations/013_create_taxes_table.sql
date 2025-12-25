-- Migration: Create taxes table
-- Description: Stores tax definitions (name and rate) for each user
-- Created: 2024-01-25

CREATE TABLE IF NOT EXISTS taxes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(100) NOT NULL,
    rate DECIMAL(5,2) NOT NULL,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_tax_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 100),
    CONSTRAINT chk_tax_rate CHECK (rate >= 0 AND rate <= 100)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_taxes_user_id ON taxes(user_id);
CREATE INDEX IF NOT EXISTS idx_taxes_is_default ON taxes(user_id, is_default);

-- Create unique partial index to ensure only one default tax per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_taxes_unique_default_per_user 
ON taxes(user_id) WHERE is_default = true;

-- Add foreign key constraint
-- ALTER TABLE taxes ADD CONSTRAINT fk_taxes_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add comments
COMMENT ON TABLE taxes IS 'Stores tax definitions (name and rate) for each user';
COMMENT ON COLUMN taxes.user_id IS 'Owner of this tax definition';
COMMENT ON COLUMN taxes.name IS 'Tax name (e.g., GST, VAT, Sales Tax)';
COMMENT ON COLUMN taxes.rate IS 'Tax rate percentage (0-100)';
COMMENT ON COLUMN taxes.is_default IS 'Whether this is the default tax for the user';

