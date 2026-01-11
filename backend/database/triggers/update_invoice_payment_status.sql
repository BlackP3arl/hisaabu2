-- Trigger Function: Update invoice payment status
-- Description: Updates invoice status and amount_paid when payments are added/updated/deleted
-- Created: 2024-01-25

CREATE OR REPLACE FUNCTION update_invoice_payment_status()
RETURNS TRIGGER AS $$
DECLARE
    invoice_record invoices%ROWTYPE;
    total_paid DECIMAL(10,2);
BEGIN
    -- Get the invoice record
    SELECT * INTO invoice_record
    FROM invoices
    WHERE id = COALESCE(NEW.invoice_id, OLD.invoice_id);
    
    -- Calculate total paid
    SELECT COALESCE(SUM(amount), 0) INTO total_paid
    FROM payments
    WHERE invoice_id = invoice_record.id;
    
    -- Update invoice
    UPDATE invoices
    SET 
        amount_paid = total_paid,
        balance_due = total_amount - total_paid,
        status = CASE
            WHEN total_paid = 0 THEN 
                CASE 
                    WHEN due_date < CURRENT_DATE THEN 'overdue'
                    ELSE 'sent'
                END
            WHEN total_paid >= total_amount THEN 'paid'
            WHEN total_paid > 0 THEN 'partial'
            ELSE status
        END,
        paid_at = CASE WHEN total_paid >= total_amount THEN NOW() ELSE NULL END,
        updated_at = NOW()
    WHERE id = invoice_record.id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_invoice_payment_status
    AFTER INSERT OR UPDATE OR DELETE ON payments
    FOR EACH ROW 
    EXECUTE FUNCTION update_invoice_payment_status();



