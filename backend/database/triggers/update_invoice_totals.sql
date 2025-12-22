-- Trigger Function: Update invoice totals
-- Description: Automatically recalculates invoice totals when line items are added/updated/deleted
-- Created: 2024-01-25

CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
    invoice_record invoices%ROWTYPE;
    total_paid DECIMAL(10,2);
    new_total_amount DECIMAL(10,2);
    new_balance_due DECIMAL(10,2);
BEGIN
    -- Get the invoice record
    SELECT * INTO invoice_record
    FROM invoices
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    -- Calculate total paid from payments (source of truth)
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM payments
    WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    -- Calculate new total amount from items
    SELECT COALESCE(SUM((quantity * price * (1 - discount_percent / 100)) * (1 + tax_percent / 100)), 0) 
    INTO new_total_amount
    FROM invoice_items
    WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    -- Calculate balance due
    new_balance_due := new_total_amount - total_paid;
    
    -- Recalculate totals
    UPDATE invoices
    SET 
        subtotal = (
            SELECT COALESCE(SUM(quantity * price), 0)
            FROM invoice_items
            WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
        ),
        discount_total = (
            SELECT COALESCE(SUM(quantity * price * discount_percent / 100), 0)
            FROM invoice_items
            WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
        ),
        tax_total = (
            SELECT COALESCE(SUM((quantity * price * (1 - discount_percent / 100)) * tax_percent / 100), 0)
            FROM invoice_items
            WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
        ),
        total_amount = new_total_amount,
        amount_paid = total_paid,
        balance_due = new_balance_due,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_invoice_totals
    AFTER INSERT OR UPDATE OR DELETE ON invoice_items
    FOR EACH ROW 
    EXECUTE FUNCTION update_invoice_totals();


