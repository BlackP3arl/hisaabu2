-- Migration: Create company_settings table
-- Description: Stores company profile and configuration settings (one per user)
-- Created: 2024-01-25

CREATE TABLE IF NOT EXISTS company_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE,
    company_name VARCHAR(255) NOT NULL,
    logo_url VARCHAR(500),
    registered_address TEXT,
    shipping_address TEXT,
    email VARCHAR(255),
    phone VARCHAR(50),
    gst_number VARCHAR(100),
    registration_number VARCHAR(100),
    default_tax_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00,
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    date_format VARCHAR(20) NOT NULL DEFAULT 'MM/DD/YYYY',
    invoice_prefix VARCHAR(20) NOT NULL DEFAULT 'INV-',
    quotation_prefix VARCHAR(20) NOT NULL DEFAULT 'QT-',
    terms_template TEXT,
    tax_per_item_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_company_name_length CHECK (LENGTH(company_name) >= 1 AND LENGTH(company_name) <= 255),
    CONSTRAINT chk_default_tax_rate CHECK (default_tax_rate >= 0 AND default_tax_rate <= 100),
    CONSTRAINT chk_invoice_prefix_length CHECK (LENGTH(invoice_prefix) >= 1 AND LENGTH(invoice_prefix) <= 20),
    CONSTRAINT chk_quotation_prefix_length CHECK (LENGTH(quotation_prefix) >= 1 AND LENGTH(quotation_prefix) <= 20),
    CONSTRAINT chk_email_format CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Create index
CREATE UNIQUE INDEX IF NOT EXISTS idx_company_settings_user_id ON company_settings(user_id);

-- Add foreign key constraint
-- ALTER TABLE company_settings ADD CONSTRAINT fk_company_settings_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add comments
COMMENT ON TABLE company_settings IS 'Stores company profile and configuration settings (one per user)';
COMMENT ON COLUMN company_settings.user_id IS 'Owner of these settings (one-to-one with users)';
COMMENT ON COLUMN company_settings.default_tax_rate IS 'Default tax rate percentage';
COMMENT ON COLUMN company_settings.currency IS 'Currency code (ISO 4217)';
COMMENT ON COLUMN company_settings.tax_per_item_enabled IS 'Allow different tax rates per item';


