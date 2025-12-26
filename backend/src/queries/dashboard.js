import { query } from '../config/database.js';

/**
 * Get dashboard statistics for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object>} Dashboard statistics
 */
export const getDashboardStats = async (userId) => {
  try {
    // Get total clients count
    const clientsResult = await query(
      `SELECT COUNT(*) as total FROM clients WHERE user_id = $1`,
      [userId]
    );
    const totalClients = parseInt(clientsResult.rows[0].total);

    // Get active clients count
    const activeClientsResult = await query(
      `SELECT COUNT(*) as total FROM clients WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );
    const activeClients = parseInt(activeClientsResult.rows[0].total);

    // Get total quotations count
    const quotationsResult = await query(
      `SELECT COUNT(*) as total FROM quotations WHERE user_id = $1`,
      [userId]
    );
    const totalQuotations = parseInt(quotationsResult.rows[0].total);

    // Get quotations by status
    const quotationsByStatusResult = await query(
      `SELECT status, COUNT(*) as count 
       FROM quotations 
       WHERE user_id = $1 
       GROUP BY status`,
      [userId]
    );
    const quotationsByStatus = {};
    quotationsByStatusResult.rows.forEach(row => {
      quotationsByStatus[row.status] = parseInt(row.count);
    });

    // Get total invoices count
    const invoicesResult = await query(
      `SELECT COUNT(*) as total FROM invoices WHERE user_id = $1`,
      [userId]
    );
    const totalInvoices = parseInt(invoicesResult.rows[0].total);

    // Get invoices by status
    const invoicesByStatusResult = await query(
      `SELECT status, COUNT(*) as count 
       FROM invoices 
       WHERE user_id = $1 
       GROUP BY status`,
      [userId]
    );
    const invoicesByStatus = {};
    invoicesByStatusResult.rows.forEach(row => {
      invoicesByStatus[row.status] = parseInt(row.count);
    });

    // Get total revenue (sum of all paid invoices)
    const revenueResult = await query(
      `SELECT COALESCE(SUM(amount_paid), 0) as total 
       FROM invoices 
       WHERE user_id = $1 AND status IN ('paid', 'partial')`,
      [userId]
    );
    const totalRevenue = parseFloat(revenueResult.rows[0].total);

    // Get outstanding balance (sum of balance_due)
    const outstandingResult = await query(
      `SELECT COALESCE(SUM(balance_due), 0) as total 
       FROM invoices 
       WHERE user_id = $1 AND status IN ('sent', 'partial', 'overdue')`,
      [userId]
    );
    const outstandingBalance = parseFloat(outstandingResult.rows[0].total);

    // Get recent invoices (last 5)
    const recentInvoicesResult = await query(
      `SELECT i.id, i.number, i.total_amount, i.status, i.issue_date, i.due_date,
              c.name as client_name
       FROM invoices i
       LEFT JOIN clients c ON i.client_id = c.id
       WHERE i.user_id = $1
       ORDER BY i.created_at DESC
       LIMIT 5`,
      [userId]
    );
    const recentInvoices = recentInvoicesResult.rows.map(row => ({
      id: row.id,
      number: row.number,
      totalAmount: parseFloat(row.total_amount),
      status: row.status,
      issueDate: row.issue_date,
      dueDate: row.due_date,
      clientName: row.client_name,
    }));

    // Get recent quotations (last 5)
    const recentQuotationsResult = await query(
      `SELECT q.id, q.number, q.total_amount, q.status, q.issue_date, q.expiry_date,
              c.name as client_name
       FROM quotations q
       LEFT JOIN clients c ON q.client_id = c.id
       WHERE q.user_id = $1
       ORDER BY q.created_at DESC
       LIMIT 5`,
      [userId]
    );
    const recentQuotations = recentQuotationsResult.rows.map(row => ({
      id: row.id,
      number: row.number,
      totalAmount: parseFloat(row.total_amount),
      status: row.status,
      issueDate: row.issue_date,
      expiryDate: row.expiry_date,
      clientName: row.client_name,
    }));

    // Get monthly revenue (last 6 months)
    const monthlyRevenueResult = await query(
      `SELECT 
         DATE_TRUNC('month', payment_date) as month,
         COALESCE(SUM(amount), 0) as total
       FROM payments p
       INNER JOIN invoices i ON p.invoice_id = i.id
       WHERE i.user_id = $1
         AND p.payment_date >= NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', payment_date)
       ORDER BY month DESC
       LIMIT 6`,
      [userId]
    );
    const monthlyRevenue = monthlyRevenueResult.rows.map(row => ({
      month: row.month.toISOString().substring(0, 7), // YYYY-MM format
      total: parseFloat(row.total),
    }));

    return {
      clients: {
        total: totalClients,
        active: activeClients,
        inactive: totalClients - activeClients,
      },
      quotations: {
        total: totalQuotations,
        byStatus: quotationsByStatus,
      },
      invoices: {
        total: totalInvoices,
        byStatus: invoicesByStatus,
      },
      financials: {
        totalRevenue,
        outstandingBalance,
      },
      recentInvoices,
      recentQuotations,
      monthlyRevenue,
    };
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    throw error;
  }
};
