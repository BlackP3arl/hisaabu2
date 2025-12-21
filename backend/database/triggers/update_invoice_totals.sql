-- Trigger Function: Update invoice totals
-- Description: Automatically recalculates invoice totals when line items are added/updated/deleted
-- Created: 2024-01-25

CREATE OR REPLACE FUNCTION update_invoice_totals()
RETURNS TRIGGER AS $$
DECLARE
    invoice_record invoices%ROWTYPE;
BEGIN
    -- Get the invoice record
    SELECT * INTO invoice_record
    FROM invoices
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
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
        total_amount = (
            SELECT COALESCE(SUM((quantity * price * (1 - discount_percent / 100)) * (1 + tax_percent / 100)), 0)
            FROM invoice_items
            WHERE invoice_id = COALESCE(NEW.invoice_id, OLD.invoice_id)
        ),
        balance_due = total_amount - amount_paid,
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


