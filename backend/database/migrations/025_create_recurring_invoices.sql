-- Migration: Create recurring_invoices and recurring_invoice_items tables
-- Description: Adds support for recurring invoice templates that automatically generate invoices
-- Created: 2025-01-21

-- Create recurring_invoices table
CREATE TABLE IF NOT EXISTS recurring_invoices (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    due_date_days INTEGER NOT NULL CHECK (due_date_days >= 1 AND due_date_days <= 30),
    auto_bill VARCHAR(20) NOT NULL DEFAULT 'disabled' CHECK (auto_bill IN ('disabled', 'enabled', 'opt_in')),
    status VARCHAR(20) NOT NULL DEFAULT 'stopped' CHECK (status IN ('active', 'stopped')),
    notes TEXT,
    terms TEXT,
    currency VARCHAR(3),
    exchange_rate DECIMAL(10,4),
    last_generated_at TIMESTAMP,
    next_generation_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_end_date_after_start CHECK (end_date >= start_date),
    CONSTRAINT chk_exchange_rate CHECK (exchange_rate IS NULL OR exchange_rate > 0)
);

-- Create recurring_invoice_items table
CREATE TABLE IF NOT EXISTS recurring_invoice_items (
    id SERIAL PRIMARY KEY,
    recurring_invoice_id INTEGER NOT NULL,
    item_id INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    tax_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT chk_quantity CHECK (quantity > 0),
    CONSTRAINT chk_price CHECK (price >= 0),
    CONSTRAINT chk_discount_percent CHECK (discount_percent >= 0 AND discount_percent <= 100),
    CONSTRAINT chk_tax_percent CHECK (tax_percent >= 0 AND tax_percent <= 100)
);

-- Add recurring_invoice_id to invoices table
ALTER TABLE invoices 
ADD COLUMN IF NOT EXISTS recurring_invoice_id INTEGER;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_user_id ON recurring_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_client_id ON recurring_invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_status ON recurring_invoices(status);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_next_generation_date ON recurring_invoices(next_generation_date);
CREATE INDEX IF NOT EXISTS idx_recurring_invoice_items_recurring_invoice_id ON recurring_invoice_items(recurring_invoice_id);
CREATE INDEX IF NOT EXISTS idx_recurring_invoice_items_item_id ON recurring_invoice_items(item_id);
CREATE INDEX IF NOT EXISTS idx_invoices_recurring_invoice_id ON invoices(recurring_invoice_id);

-- Add foreign key constraints (commented out as per pattern in other migrations)
-- ALTER TABLE recurring_invoices ADD CONSTRAINT fk_recurring_invoices_client_id FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;
-- ALTER TABLE recurring_invoices ADD CONSTRAINT fk_recurring_invoices_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
-- ALTER TABLE recurring_invoice_items ADD CONSTRAINT fk_recurring_invoice_items_recurring_invoice_id FOREIGN KEY (recurring_invoice_id) REFERENCES recurring_invoices(id) ON DELETE CASCADE;
-- ALTER TABLE recurring_invoice_items ADD CONSTRAINT fk_recurring_invoice_items_item_id FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL;
-- ALTER TABLE invoices ADD CONSTRAINT fk_invoices_recurring_invoice_id FOREIGN KEY (recurring_invoice_id) REFERENCES recurring_invoices(id) ON DELETE SET NULL;

-- Add comments
COMMENT ON TABLE recurring_invoices IS 'Templates for recurring invoices that automatically generate invoices on a schedule';
COMMENT ON COLUMN recurring_invoices.frequency IS 'How often to generate invoices: daily, weekly, monthly, quarterly, annually';
COMMENT ON COLUMN recurring_invoices.due_date_days IS 'Payment terms: number of days after issue date for due date (1-30)';
COMMENT ON COLUMN recurring_invoices.auto_bill IS 'disabled: no auto generation, enabled: auto generate and send, opt_in: auto generate as draft';
COMMENT ON COLUMN recurring_invoices.next_generation_date IS 'Calculated next date when invoice should be generated';
COMMENT ON COLUMN recurring_invoices.last_generated_at IS 'Timestamp of last invoice generation';
COMMENT ON TABLE recurring_invoice_items IS 'Line items for recurring invoice templates';
COMMENT ON COLUMN invoices.recurring_invoice_id IS 'Reference to recurring invoice template that generated this invoice';

