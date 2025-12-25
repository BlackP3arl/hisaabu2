-- Fix Schema Script
-- Description: Recreates tables that don't match our specification
-- This will drop and recreate users, quotations, and invoices tables to match our spec
-- Created: 2024-01-25

-- Drop existing tables that don't match our spec (in reverse dependency order)
DROP TABLE IF EXISTS quotation_items CASCADE;
DROP TABLE IF EXISTS invoice_items CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS share_links CASCADE;
DROP TABLE IF EXISTS quotations CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Now recreate users table according to our specification
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'staff',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_role CHECK (role IN ('admin', 'staff')),
    CONSTRAINT chk_name_length CHECK (LENGTH(name) >= 2 AND LENGTH(name) <= 255)
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Recreate quotations table
CREATE TABLE quotations (
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_quotations_number_user ON quotations(user_id, number);
CREATE INDEX IF NOT EXISTS idx_quotations_client_id ON quotations(client_id);
CREATE INDEX IF NOT EXISTS idx_quotations_user_id ON quotations(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_issue_date ON quotations(issue_date);
CREATE INDEX IF NOT EXISTS idx_quotations_expiry_date ON quotations(expiry_date);

-- Recreate invoices table
CREATE TABLE invoices (
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

CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_number_user ON invoices(user_id, number);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_issue_date ON invoices(issue_date);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);
CREATE INDEX IF NOT EXISTS idx_invoices_balance_due ON invoices(balance_due);

-- Recreate quotation_items table
CREATE TABLE quotation_items (
    id SERIAL PRIMARY KEY,
    quotation_id INTEGER NOT NULL,
    item_id INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    tax_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    line_total DECIMAL(10,2) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT chk_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 255),
    CONSTRAINT chk_quantity CHECK (quantity > 0),
    CONSTRAINT chk_price CHECK (price >= 0),
    CONSTRAINT chk_discount_percent CHECK (discount_percent >= 0 AND discount_percent <= 100),
    CONSTRAINT chk_tax_percent CHECK (tax_percent >= 0 AND tax_percent <= 100),
    CONSTRAINT chk_line_total CHECK (line_total >= 0),
    CONSTRAINT chk_sort_order CHECK (sort_order >= 0)
);

CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation_id ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_item_id ON quotation_items(item_id);

-- Recreate invoice_items table
CREATE TABLE invoice_items (
    id SERIAL PRIMARY KEY,
    invoice_id INTEGER NOT NULL,
    item_id INTEGER,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1,
    price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    tax_percent DECIMAL(5,2) NOT NULL DEFAULT 0,
    line_total DECIMAL(10,2) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT chk_name_length CHECK (LENGTH(name) >= 1 AND LENGTH(name) <= 255),
    CONSTRAINT chk_quantity CHECK (quantity > 0),
    CONSTRAINT chk_price CHECK (price >= 0),
    CONSTRAINT chk_discount_percent CHECK (discount_percent >= 0 AND discount_percent <= 100),
    CONSTRAINT chk_tax_percent CHECK (tax_percent >= 0 AND tax_percent <= 100),
    CONSTRAINT chk_line_total CHECK (line_total >= 0),
    CONSTRAINT chk_sort_order CHECK (sort_order >= 0)
);

CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoice_items_item_id ON invoice_items(item_id);

-- Recreate payments table
CREATE TABLE payments (
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

CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);

-- Recreate share_links table
CREATE TABLE share_links (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) NOT NULL UNIQUE,
    document_type VARCHAR(20) NOT NULL,
    document_id INTEGER NOT NULL,
    password_hash VARCHAR(255),
    expires_at DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    view_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    last_accessed_at TIMESTAMP,
    CONSTRAINT chk_document_type CHECK (document_type IN ('quotation', 'invoice')),
    CONSTRAINT chk_view_count CHECK (view_count >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_share_links_token ON share_links(token);
CREATE INDEX IF NOT EXISTS idx_share_links_document ON share_links(document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_share_links_is_active ON share_links(is_active);

-- Now add all foreign key constraints
ALTER TABLE clients 
    ADD CONSTRAINT fk_clients_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE categories 
    ADD CONSTRAINT fk_categories_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE items 
    ADD CONSTRAINT fk_items_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE items 
    ADD CONSTRAINT fk_items_category_id 
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

ALTER TABLE quotations 
    ADD CONSTRAINT fk_quotations_client_id 
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

ALTER TABLE quotations 
    ADD CONSTRAINT fk_quotations_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE quotation_items 
    ADD CONSTRAINT fk_quotation_items_quotation_id 
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE;

ALTER TABLE quotation_items 
    ADD CONSTRAINT fk_quotation_items_item_id 
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL;

ALTER TABLE invoices 
    ADD CONSTRAINT fk_invoices_client_id 
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

ALTER TABLE invoices 
    ADD CONSTRAINT fk_invoices_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE invoice_items 
    ADD CONSTRAINT fk_invoice_items_invoice_id 
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;

ALTER TABLE invoice_items 
    ADD CONSTRAINT fk_invoice_items_item_id 
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL;

ALTER TABLE payments 
    ADD CONSTRAINT fk_payments_invoice_id 
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;

ALTER TABLE payments 
    ADD CONSTRAINT fk_payments_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE company_settings 
    ADD CONSTRAINT fk_company_settings_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add comments
COMMENT ON TABLE users IS 'Stores user authentication and profile information';
COMMENT ON TABLE quotations IS 'Stores quotation documents';
COMMENT ON TABLE invoices IS 'Stores invoice documents';
COMMENT ON TABLE quotation_items IS 'Stores line items for quotations';
COMMENT ON TABLE invoice_items IS 'Stores line items for invoices';
COMMENT ON TABLE payments IS 'Stores payment records for invoices';
COMMENT ON TABLE share_links IS 'Stores secure share links for quotations and invoices';

SELECT 'Schema fixed successfully! All tables now match the specification.' AS status;


