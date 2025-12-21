-- Migration: Create quotations table
-- Description: Stores quotation documents
-- Created: 2024-01-25

CREATE TABLE IF NOT EXISTS quotations (
    id SERIAL PRIMARY KEY,
    number VARCHAR(50) NOT NULL,
    client_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    terms TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_total_amount CHECK (total_amount >= 0),
    CONSTRAINT chk_subtotal CHECK (subtotal >= 0),
    CONSTRAINT chk_discount_total CHECK (discount_total >= 0),
    CONSTRAINT chk_tax_total CHECK (tax_total >= 0),
    CONSTRAINT chk_status CHECK (status IN ('draft', 'sent', 'accepted', 'expired')),
    CONSTRAINT chk_expiry_date CHECK (expiry_date >= issue_date)
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_quotations_number_user ON quotations(user_id, number);
CREATE INDEX IF NOT EXISTS idx_quotations_client_id ON quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_quotations_user_id ON quotations(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_issue_date ON quotations(issue_date);
CREATE INDEX IF NOT EXISTS idx_quotations_expiry_date ON quotations(expiry_date);

-- Add foreign key constraints
-- ALTER TABLE quotations ADD CONSTRAINT fk_quotations_client_id FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;
-- ALTER TABLE quotations ADD CONSTRAINT fk_quotations_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

-- Add comments
COMMENT ON TABLE quotations IS 'Stores quotation documents';
COMMENT ON COLUMN quotations.number IS 'Quotation number (e.g., QT-2024-001), unique per user';
COMMENT ON COLUMN quotations.status IS 'Quotation status: draft, sent, accepted, or expired';


