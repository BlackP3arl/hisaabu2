-- Migration: Create invoices table
-- Description: Stores invoice documents
-- Created: 2024-01-25

CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    number VARCHAR(50) NOT NULL,
    client_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
    balance_due DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT,
    terms TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    paid_at TIMESTAMP,
    CONSTRAINT chk_total_amount CHECK (total_amount >= 0),
    CONSTRAINT chk_subtotal CHECK (subtotal >= 0),
    CONSTRAINT chk_discount_total CHECK (discount_total >= 0),
    CONSTRAINT chk_tax_total CHECK (tax_total >= 0),
    CONSTRAINT chk_amount_paid CHECK (amount_paid >= 0 AND amount_paid <= total_amount),
    CONSTRAINT chk_balance_due CHECK (balance_due >= 0),
    CONSTRAINT chk_status CHECK (status IN ('draft', 'sent', 'paid', 'partial', 'overdue')),
    CONSTRAINT chk_due_date CHECK (due_date >= issue_date)
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_number_user ON invoices(user_id, number);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_balance_due ON invoices(balance_due);

-- Add foreign key constraints
-- ALTER TABLE invoices ADD CONSTRAINT fk_invoices_client_id FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;
-- ALTER TABLE invoices ADD CONSTRAINT fk_invoices_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

-- Add comments
COMMENT ON TABLE invoices IS 'Stores invoice documents';
COMMENT ON COLUMN invoices.number IS 'Invoice number (e.g., INV-0023), unique per user';
COMMENT ON COLUMN invoices.balance_due IS 'Outstanding balance (total_amount - amount_paid), calculated on save';
COMMENT ON COLUMN invoices.status IS 'Invoice status: draft, sent, paid, partial, or overdue';
COMMENT ON COLUMN invoices.paid_at IS 'Date when invoice was fully paid';



