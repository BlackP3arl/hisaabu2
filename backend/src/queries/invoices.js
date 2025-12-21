import { query, getClient } from '../config/database.js';

/**
 * Invoice database queries
 */

/**
 * Get invoices with pagination, search, and filters
 */
export const getInvoices = async (userId, filters = {}) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    status = 'all',
    clientId = null,
    dateFrom = null,
    dateTo = null,
    sort = 'created_at',
    order = 'desc',
  } = filters;

  const offset = (page - 1) * limit;
  const params = [userId];
  let paramIndex = 2;

  let whereClause = 'WHERE i.user_id = $1';
  let joinClause = 'LEFT JOIN clients c ON i.client_id = c.id';

  // Search filter
  if (search) {
    whereClause += ` AND (i.number ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  // Status filter
  if (status && status !== 'all') {
    whereClause += ` AND i.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  // Client filter
  if (clientId) {
    whereClause += ` AND i.client_id = $${paramIndex}`;
    params.push(clientId);
    paramIndex++;
  }

  // Date range filters
  if (dateFrom) {
    whereClause += ` AND i.issue_date >= $${paramIndex}`;
    params.push(dateFrom);
    paramIndex++;
  }

  if (dateTo) {
    whereClause += ` AND i.issue_date <= $${paramIndex}`;
    params.push(dateTo);
    paramIndex++;
  }

  // Validate sort field
  const allowedSortFields = ['number', 'issue_date', 'due_date', 'total_amount', 'status', 'created_at', 'updated_at'];
  const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';
  const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM invoices i
    ${joinClause}
    ${whereClause}
  `;
  const countResult = await query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  // Get invoices with client name
  const invoicesQuery = `
    SELECT 
      i.*,
      c.name as client_name
    FROM invoices i
    ${joinClause}
    ${whereClause}
    ORDER BY i.${sortField} ${sortOrder}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  params.push(limit, offset);

  const result = await query(invoicesQuery, params);

  return {
    invoices: result.rows,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

/**
 * Get invoice by ID with line items, payments, and client info
 */
export const getInvoiceById = async (userId, invoiceId) => {
  // Get invoice with client info
  const invoiceResult = await query(
    `SELECT 
      i.*,
      c.id as client_id,
      c.name as client_name,
      c.email as client_email
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.id = $1 AND i.user_id = $2`,
    [invoiceId, userId]
  );

  if (invoiceResult.rows.length === 0) {
    return null;
  }

  const invoice = invoiceResult.rows[0];

  // Get line items
  const itemsResult = await query(
    `SELECT *
     FROM invoice_items
     WHERE invoice_id = $1
     ORDER BY sort_order ASC, id ASC`,
    [invoiceId]
  );

  // Get payments
  const paymentsResult = await query(
    `SELECT *
     FROM payments
     WHERE invoice_id = $1
     ORDER BY payment_date DESC, created_at DESC`,
    [invoiceId]
  );

  invoice.items = itemsResult.rows;
  invoice.payments = paymentsResult.rows;

  return invoice;
};

/**
 * Create invoice with line items (transaction)
 */
export const createInvoice = async (userId, invoiceData, lineItems, invoiceNumber) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    const {
      clientId,
      issueDate,
      dueDate,
      notes,
      terms,
      status = 'draft',
    } = invoiceData;

    // Insert invoice
    const invoiceResult = await client.query(
      `INSERT INTO invoices (
        number, client_id, user_id, issue_date, due_date,
        notes, terms, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [invoiceNumber, clientId, userId, issueDate, dueDate, notes || null, terms || null, status]
    );

    const invoice = invoiceResult.rows[0];
    const invoiceId = invoice.id;

    // Insert line items
    if (lineItems && lineItems.length > 0) {
      for (let i = 0; i < lineItems.length; i++) {
        const item = lineItems[i];
        const {
          itemId,
          name,
          description,
          quantity,
          price,
          discountPercent = 0,
          taxPercent = 0,
        } = item;

        // Calculate line total
        const subtotal = quantity * price;
        const discountAmount = subtotal * (discountPercent / 100);
        const afterDiscount = subtotal - discountAmount;
        const taxAmount = afterDiscount * (taxPercent / 100);
        const lineTotal = afterDiscount + taxAmount;

        await client.query(
          `INSERT INTO invoice_items (
            invoice_id, item_id, name, description, quantity, price,
            discount_percent, tax_percent, line_total, sort_order
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            invoiceId,
            itemId || null,
            name,
            description || null,
            quantity,
            price,
            discountPercent,
            taxPercent,
            parseFloat(lineTotal.toFixed(2)),
            i,
          ]
        );
      }
    }

    await client.query('COMMIT');

    // Get full invoice with items and payments
    return await getInvoiceById(userId, invoiceId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update invoice
 */
export const updateInvoice = async (userId, invoiceId, invoiceData) => {
  const {
    clientId,
    issueDate,
    dueDate,
    notes,
    terms,
    status,
  } = invoiceData;

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (clientId !== undefined) {
    fields.push(`client_id = $${paramIndex++}`);
    values.push(clientId);
  }
  if (issueDate !== undefined) {
    fields.push(`issue_date = $${paramIndex++}`);
    values.push(issueDate);
  }
  if (dueDate !== undefined) {
    fields.push(`due_date = $${paramIndex++}`);
    values.push(dueDate);
  }
  if (notes !== undefined) {
    fields.push(`notes = $${paramIndex++}`);
    values.push(notes || null);
  }
  if (terms !== undefined) {
    fields.push(`terms = $${paramIndex++}`);
    values.push(terms || null);
  }
  if (status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(status);
  }

  if (fields.length === 0) {
    return getInvoiceById(userId, invoiceId);
  }

  values.push(invoiceId, userId);
  const whereClause = `WHERE id = $${paramIndex++} AND user_id = $${paramIndex}`;

  const result = await query(
    `UPDATE invoices 
     SET ${fields.join(', ')}, updated_at = NOW()
     ${whereClause}
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    return null;
  }

  return await getInvoiceById(userId, invoiceId);
};

/**
 * Update invoice line items
 */
export const updateInvoiceItems = async (userId, invoiceId, lineItems) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Delete existing items
    await client.query(
      'DELETE FROM invoice_items WHERE invoice_id = $1',
      [invoiceId]
    );

    // Insert new items
    if (lineItems && lineItems.length > 0) {
      for (let i = 0; i < lineItems.length; i++) {
        const item = lineItems[i];
        const {
          itemId,
          name,
          description,
          quantity,
          price,
          discountPercent = 0,
          taxPercent = 0,
        } = item;

        // Calculate line total
        const subtotal = quantity * price;
        const discountAmount = subtotal * (discountPercent / 100);
        const afterDiscount = subtotal - discountAmount;
        const taxAmount = afterDiscount * (taxPercent / 100);
        const lineTotal = afterDiscount + taxAmount;

        await client.query(
          `INSERT INTO invoice_items (
            invoice_id, item_id, name, description, quantity, price,
            discount_percent, tax_percent, line_total, sort_order
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            invoiceId,
            itemId || null,
            name,
            description || null,
            quantity,
            price,
            discountPercent,
            taxPercent,
            parseFloat(lineTotal.toFixed(2)),
            i,
          ]
        );
      }
    }

    await client.query('COMMIT');

    // Totals will be recalculated by database trigger
    return await getInvoiceById(userId, invoiceId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Delete invoice
 */
export const deleteInvoice = async (userId, invoiceId) => {
  // Line items and payments will be deleted via CASCADE
  const result = await query(
    'DELETE FROM invoices WHERE id = $1 AND user_id = $2 RETURNING id',
    [invoiceId, userId]
  );

  return result.rows[0] || null;
};

/**
 * Verify client belongs to user
 */
export const verifyClientOwnership = async (userId, clientId) => {
  const result = await query(
    'SELECT id FROM clients WHERE id = $1 AND user_id = $2',
    [clientId, userId]
  );

  return result.rows.length > 0;
};

/**
 * Calculate invoice status based on payments and due date
 */
export const calculateInvoiceStatus = (invoice) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(invoice.due_date);
  dueDate.setHours(0, 0, 0, 0);

  const amountPaid = parseFloat(invoice.amount_paid || 0);
  const totalAmount = parseFloat(invoice.total_amount || 0);
  const balanceDue = parseFloat(invoice.balance_due || 0);

  if (amountPaid >= totalAmount) {
    return 'paid';
  } else if (amountPaid > 0) {
    if (dueDate < today && balanceDue > 0) {
      return 'overdue';
    }
    return 'partial';
  } else if (dueDate < today && balanceDue > 0) {
    return 'overdue';
  } else if (invoice.status === 'draft') {
    return 'draft';
  } else {
    return 'sent';
  }
};


