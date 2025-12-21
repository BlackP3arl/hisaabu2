-- Migration: Create payments table
-- Description: Stores payment records for invoices
-- Created: 2024-01-25

CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_date DATE NOT NULL,
    payment_method VARCHAR(50),
    notes TEXT,
    reference_number VARCHAR(100),
    user_id INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_amount CHECK (amount > 0),
    CONSTRAINT chk_payment_method CHECK (payment_method IS NULL OR payment_method IN ('cash', 'bank_transfer', 'credit_card', 'check', 'other'))
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- Add foreign key constraints
-- ALTER TABLE payments ADD CONSTRAINT fk_payments_invoice_id FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;
-- ALTER TABLE payments ADD CONSTRAINT fk_payments_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

-- Add comments
COMMENT ON TABLE payments IS 'Stores payment records for invoices';
COMMENT ON COLUMN payments.payment_method IS 'Payment method: cash, bank_transfer, credit_card, check, or other';
COMMENT ON COLUMN payments.reference_number IS 'Reference/transaction number';


