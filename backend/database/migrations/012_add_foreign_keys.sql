-- Migration: Add all foreign key constraints
-- Description: Adds foreign key relationships after all tables are created
-- Created: 2024-01-25

-- Clients foreign keys
ALTER TABLE clients 
    ADD CONSTRAINT fk_clients_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Categories foreign keys
ALTER TABLE categories 
    ADD CONSTRAINT fk_categories_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Items foreign keys
ALTER TABLE items 
    ADD CONSTRAINT fk_items_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE items 
    ADD CONSTRAINT fk_items_category_id 
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL;

-- Quotations foreign keys
ALTER TABLE quotations 
    ADD CONSTRAINT fk_quotations_client_id 
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

ALTER TABLE quotations 
    ADD CONSTRAINT fk_quotations_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

-- Quotation items foreign keys
ALTER TABLE quotation_items 
    ADD CONSTRAINT fk_quotation_items_quotation_id 
    FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE;

ALTER TABLE quotation_items 
    ADD CONSTRAINT fk_quotation_items_item_id 
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL;

-- Invoices foreign keys
ALTER TABLE invoices 
    ADD CONSTRAINT fk_invoices_client_id 
    FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE RESTRICT;

ALTER TABLE invoices 
    ADD CONSTRAINT fk_invoices_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

-- Invoice items foreign keys
ALTER TABLE invoice_items 
    ADD CONSTRAINT fk_invoice_items_invoice_id 
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;

ALTER TABLE invoice_items 
    ADD CONSTRAINT fk_invoice_items_item_id 
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE SET NULL;

-- Payments foreign keys
ALTER TABLE payments 
    ADD CONSTRAINT fk_payments_invoice_id 
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE;

ALTER TABLE payments 
    ADD CONSTRAINT fk_payments_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT;

-- Company settings foreign keys
ALTER TABLE company_settings 
    ADD CONSTRAINT fk_company_settings_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;



