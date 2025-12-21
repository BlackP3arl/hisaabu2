-- View: client_summary
-- Description: Aggregated view of client financial information
-- Created: 2024-01-25

CREATE OR REPLACE VIEW client_summary AS
SELECT 
    c.id,
    c.name,
    c.email,
    c.status,
    c.user_id,
    COUNT(DISTINCT q.id) as total_quotations,
    COUNT(DISTINCT i.id) as total_invoices,
    COALESCE(SUM(i.total_amount), 0) as total_billed,
    COALESCE(SUM(i.amount_paid), 0) as total_paid,
    COALESCE(SUM(i.balance_due), 0) as outstanding
FROM clients c
LEFT JOIN quotations q ON q.client_id = c.id
LEFT JOIN invoices i ON i.client_id = c.id
GROUP BY c.id, c.name, c.email, c.status, c.user_id;

COMMENT ON VIEW client_summary IS 'Aggregated view of client financial information';


