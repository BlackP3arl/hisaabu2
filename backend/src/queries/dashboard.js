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
    outstandingByCurrencyResult,
    paidInvoicesCount,
    paidInvoicesByCurrencyResult,
    unpaidInvoicesCount,
    overdueInvoicesCount,
    overdueInvoicesByCurrencyResult,
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
    // Total outstanding (sum of all currencies)
    query(
      'SELECT COALESCE(SUM(balance_due), 0) as total FROM invoices WHERE user_id = $1',
      [userId]
    ),
    // Total outstanding by currency
    query(
      `SELECT currency, COALESCE(SUM(balance_due), 0) as total 
       FROM invoices 
       WHERE user_id = $1 
       GROUP BY currency
       ORDER BY currency`,
      [userId]
    ),
    // Paid invoices (total count)
    query(
      "SELECT COUNT(*) as count FROM invoices WHERE user_id = $1 AND status = 'paid'",
      [userId]
    ),
    // Paid invoices by currency
    query(
      `SELECT currency, COUNT(*) as count 
       FROM invoices 
       WHERE user_id = $1 AND status = 'paid'
       GROUP BY currency
       ORDER BY currency`,
      [userId]
    ),
    // Unpaid invoices (sent or draft)
    query(
      "SELECT COUNT(*) as count FROM invoices WHERE user_id = $1 AND status IN ('sent', 'draft')",
      [userId]
    ),
    // Overdue invoices (total count)
    query(
      `SELECT COUNT(*) as count 
       FROM invoices 
       WHERE user_id = $1 
         AND status = 'overdue' 
         AND due_date < CURRENT_DATE 
         AND balance_due > 0`,
      [userId]
    ),
    // Overdue invoices by currency
    query(
      `SELECT currency, COUNT(*) as count 
       FROM invoices 
       WHERE user_id = $1 
         AND status = 'overdue' 
         AND due_date < CURRENT_DATE 
         AND balance_due > 0
       GROUP BY currency
       ORDER BY currency`,
      [userId]
    ),
    // Recent activity (last 20 items) - include currency
    query(
      `(
        SELECT 
          'payment' as type,
          'Invoice #' || i.number || ' Paid' as title,
          c.name as client,
          p.amount,
          p.currency,
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
          currency,
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
          currency,
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

  // Transform outstanding by currency
  const totalOutstandingByCurrency = outstandingByCurrencyResult.rows.map(row => ({
    currency: row.currency,
    amount: parseFloat(row.total || 0),
  }));

  // Transform paid invoices by currency
  const paidInvoicesByCurrency = paidInvoicesByCurrencyResult.rows.map(row => ({
    currency: row.currency,
    count: parseInt(row.count || 0),
  }));

  // Transform overdue invoices by currency
  const overdueInvoicesByCurrency = overdueInvoicesByCurrencyResult.rows.map(row => ({
    currency: row.currency,
    count: parseInt(row.count || 0),
  }));

  // Transform recent activity - map types and format time
  const recentActivityList = recentActivity.rows.map(activity => {
    // Map activity types: 'invoice' -> 'sent', 'quotation' -> 'sent', keep 'payment'
    let activityType = activity.type;
    if (activityType === 'invoice' || activityType === 'quotation') {
      activityType = 'sent';
    }

    // Format timestamp to relative time string
    const timestamp = activity.timestamp instanceof Date 
      ? activity.timestamp 
      : new Date(activity.timestamp);
    const now = new Date();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    let timeString = '';
    if (diffMins < 1) {
      timeString = 'Just now';
    } else if (diffMins < 60) {
      timeString = `${diffMins} ${diffMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHours < 24) {
      timeString = `${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDays < 30) {
      timeString = `${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    } else {
      // Format as date for older items
      timeString = timestamp.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: timestamp.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }

    return {
      type: activityType,
      title: activity.title,
      client: activity.client,
      amount: parseFloat(activity.amount || 0),
      currency: activity.currency || 'USD',
      time: timeString,
      timestamp: timestamp.toISOString(),
    };
  });

  return {
    totalQuotations,
    totalInvoices,
    totalOutstanding,
    totalOutstandingByCurrency,
    paidInvoices,
    paidInvoicesByCurrency,
    unpaidInvoices,
    overdueInvoices,
    overdueInvoicesByCurrency,
    recentActivity: recentActivityList,
  };
};


