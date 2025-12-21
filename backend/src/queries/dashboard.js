import { query } from '../config/database.js';

/**
 * Dashboard statistics queries
 */

/**
 * Get dashboard statistics for user
 */
export const getDashboardStats = async (userId) => {
  // Get all statistics in parallel
  const [
    quotationsCount,
    invoicesCount,
    outstandingResult,
    paidInvoicesCount,
    unpaidInvoicesCount,
    overdueInvoicesCount,
    recentActivity,
  ] = await Promise.all([
    // Total quotations
    query(
      'SELECT COUNT(*) as count FROM quotations WHERE user_id = $1',
      [userId]
    ),
    // Total invoices
    query(
      'SELECT COUNT(*) as count FROM invoices WHERE user_id = $1',
      [userId]
    ),
    // Total outstanding
    query(
      'SELECT COALESCE(SUM(balance_due), 0) as total FROM invoices WHERE user_id = $1',
      [userId]
    ),
    // Paid invoices
    query(
      "SELECT COUNT(*) as count FROM invoices WHERE user_id = $1 AND status = 'paid'",
      [userId]
    ),
    // Unpaid invoices (sent or draft)
    query(
      "SELECT COUNT(*) as count FROM invoices WHERE user_id = $1 AND status IN ('sent', 'draft')",
      [userId]
    ),
    // Overdue invoices
    query(
      `SELECT COUNT(*) as count 
       FROM invoices 
       WHERE user_id = $1 
         AND status = 'overdue' 
         AND due_date < CURRENT_DATE 
         AND balance_due > 0`,
      [userId]
    ),
    // Recent activity (last 20 items)
    query(
      `(
        SELECT 
          'payment' as type,
          'Invoice #' || i.number || ' Paid' as title,
          c.name as client,
          p.amount,
          p.created_at as timestamp
        FROM payments p
        INNER JOIN invoices i ON p.invoice_id = i.id
        INNER JOIN clients c ON i.client_id = c.id
        WHERE i.user_id = $1
        ORDER BY p.created_at DESC
        LIMIT 10
      )
      UNION ALL
      (
        SELECT 
          'invoice' as type,
          'Invoice #' || number || ' Created' as title,
          c.name as client,
          total_amount as amount,
          created_at as timestamp
        FROM invoices i
        INNER JOIN clients c ON i.client_id = c.id
        WHERE i.user_id = $1
        ORDER BY created_at DESC
        LIMIT 5
      )
      UNION ALL
      (
        SELECT 
          'quotation' as type,
          'Quotation #' || number || ' Created' as title,
          c.name as client,
          total_amount as amount,
          created_at as timestamp
        FROM quotations q
        INNER JOIN clients c ON q.client_id = c.id
        WHERE q.user_id = $1
        ORDER BY created_at DESC
        LIMIT 5
      )
      ORDER BY timestamp DESC
      LIMIT 20`,
      [userId]
    ),
  ]);

  const totalQuotations = parseInt(quotationsCount.rows[0].count);
  const totalInvoices = parseInt(invoicesCount.rows[0].count);
  const totalOutstanding = parseFloat(outstandingResult.rows[0].total);
  const paidInvoices = parseInt(paidInvoicesCount.rows[0].count);
  const unpaidInvoices = parseInt(unpaidInvoicesCount.rows[0].count);
  const overdueInvoices = parseInt(overdueInvoicesCount.rows[0].count);

  // Transform recent activity
  const recentActivityList = recentActivity.rows.map(activity => ({
    type: activity.type,
    title: activity.title,
    client: activity.client,
    amount: parseFloat(activity.amount || 0),
    timestamp: activity.timestamp.toISOString(),
  }));

  return {
    totalQuotations,
    totalInvoices,
    totalOutstanding,
    paidInvoices,
    unpaidInvoices,
    overdueInvoices,
    recentActivity: recentActivityList,
  };
};


