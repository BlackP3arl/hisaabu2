-- Migration: Create uoms table
-- Description: Stores unit of measure (UOM) definitions (global/shared)
-- Created: 2025-01-21

CREATE TABLE IF NOT EXISTS uoms (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 255),
    CONSTRAINT chk_code_length CHECK (LENGTH(code) >= 1 AND LENGTH(code) <= 50)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_uoms_code ON uoms(code);
CREATE INDEX IF NOT EXISTS idx_uoms_name ON uoms(name);

-- Add comments
COMMENT ON TABLE uoms IS 'Stores unit of measure definitions (global/shared across all users)';
COMMENT ON COLUMN uoms.name IS 'UOM display name (e.g., "Pieces", "Kilograms", "Hours")';
COMMENT ON COLUMN uoms.code IS 'UOM code (e.g., "PC", "KG", "HR") - must be unique';

