-- Migration: Add default_tax_id to company_settings
-- Description: Links company_settings to a default tax from taxes table
-- Created: 2024-01-25

-- Add default_tax_id column
ALTER TABLE company_settings 
ADD COLUMN IF NOT EXISTS default_tax_id INTEGER;

-- Add foreign key constraint (commented out until foreign keys are enabled)
-- ALTER TABLE company_settings ADD CONSTRAINT fk_company_settings_default_tax_id FOREIGN KEY (default_tax_id) REFERENCES taxes(id) ON DELETE SET NULL;

-- Add comment
COMMENT ON COLUMN company_settings.default_tax_id IS 'Default tax ID (references taxes table). GST is applied at item level, others at document level.';

