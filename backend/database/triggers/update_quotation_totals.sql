-- Trigger Function: Update quotation totals
-- Description: Automatically recalculates quotation totals when line items are added/updated/deleted
-- Created: 2024-01-25

CREATE OR REPLACE FUNCTION update_quotation_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate totals
    UPDATE quotations
    SET 
        subtotal = (
            SELECT COALESCE(SUM(quantity * price), 0)
            FROM quotation_items
            WHERE quotation_id = COALESCE(NEW.quotation_id, OLD.quotation_id)
        ),
        discount_total = (
            SELECT COALESCE(SUM(quantity * price * discount_percent / 100), 0)
            FROM quotation_items
            WHERE quotation_id = COALESCE(NEW.quotation_id, OLD.quotation_id)
        ),
        tax_total = (
            SELECT COALESCE(SUM((quantity * price * (1 - discount_percent / 100)) * tax_percent / 100), 0)
            FROM quotation_items
            WHERE quotation_id = COALESCE(NEW.quotation_id, OLD.quotation_id)
        ),
        total_amount = (
            SELECT COALESCE(SUM((quantity * price * (1 - discount_percent / 100)) * (1 + tax_percent / 100)), 0)
            FROM quotation_items
            WHERE quotation_id = COALESCE(NEW.quotation_id, OLD.quotation_id)
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.quotation_id, OLD.quotation_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_quotation_totals
    AFTER INSERT OR UPDATE OR DELETE ON quotation_items
    FOR EACH ROW 
    EXECUTE FUNCTION update_quotation_totals();


