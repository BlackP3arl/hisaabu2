-- Fix Invoice Balances
-- Description: Recalculates balance_due and amount_paid for all invoices to fix any discrepancies
-- This ensures balance_due = total_amount - sum of all payments

-- Update all invoices with correct amount_paid and balance_due
UPDATE invoices i
SET 
    amount_paid = COALESCE((
        SELECT SUM(amount)
        FROM payments
        WHERE invoice_id = i.id
    ), 0),
    balance_due = i.total_amount - COALESCE((
        SELECT SUM(amount)
        FROM payments
        WHERE invoice_id = i.id
    ), 0),
    updated_at = NOW()
WHERE EXISTS (
    SELECT 1 FROM invoice_items WHERE invoice_id = i.id
);

-- Update status based on payments and due date
UPDATE invoices i
SET 
    status = CASE
        WHEN COALESCE((
            SELECT SUM(amount)
            FROM payments
            WHERE invoice_id = i.id
        ), 0) >= i.total_amount THEN 'paid'
        WHEN COALESCE((
            SELECT SUM(amount)
            FROM payments
            WHERE invoice_id = i.id
        ), 0) > 0 THEN 
            CASE 
                WHEN i.due_date < CURRENT_DATE AND (i.total_amount - COALESCE((
                    SELECT SUM(amount)
                    FROM payments
                    WHERE invoice_id = i.id
                ), 0)) > 0 THEN 'overdue'
                ELSE 'partial'
            END
        WHEN i.due_date < CURRENT_DATE AND i.total_amount > 0 THEN 'overdue'
        WHEN i.status = 'draft' THEN 'draft'
        ELSE 'sent'
    END,
    paid_at = CASE 
        WHEN COALESCE((
            SELECT SUM(amount)
            FROM payments
            WHERE invoice_id = i.id
        ), 0) >= i.total_amount THEN COALESCE(paid_at, NOW())
        ELSE NULL
    END,
    updated_at = NOW()
WHERE EXISTS (
    SELECT 1 FROM invoice_items WHERE invoice_id = i.id
);


