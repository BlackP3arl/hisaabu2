import { query, getClient } from '../config/database.js';

/**
 * Recurring Invoice database queries
 */

/**
 * Get recurring invoices with pagination, search, and filters
 */
export const getRecurringInvoices = async (userId, filters = {}) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    status = 'all',
    clientId = null,
    sort = 'created_at',
    order = 'desc',
  } = filters;

  const offset = (page - 1) * limit;
  const params = [userId];
  let paramIndex = 2;

  let whereClause = 'WHERE ri.user_id = $1';
  let joinClause = 'LEFT JOIN clients c ON ri.client_id = c.id';

  // Search filter
  if (search) {
    whereClause += ` AND c.name ILIKE $${paramIndex}`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  // Status filter
  if (status && status !== 'all') {
    whereClause += ` AND ri.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  // Client filter
  if (clientId) {
    whereClause += ` AND ri.client_id = $${paramIndex}`;
    params.push(clientId);
    paramIndex++;
  }

  // Validate sort field
  const allowedSortFields = ['start_date', 'end_date', 'next_generation_date', 'status', 'created_at', 'updated_at'];
  const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';
  const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM recurring_invoices ri
    ${joinClause}
    ${whereClause}
  `;
  const countResult = await query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  // Get recurring invoices with client name
  const recurringInvoicesQuery = `
    SELECT 
      ri.*,
      c.name as client_name
    FROM recurring_invoices ri
    ${joinClause}
    ${whereClause}
    ORDER BY ri.${sortField} ${sortOrder}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  params.push(limit, offset);

  const result = await query(recurringInvoicesQuery, params);

  return {
    recurringInvoices: result.rows,
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
 * Get recurring invoice by ID with line items and client info
 */
export const getRecurringInvoiceById = async (userId, recurringInvoiceId) => {
  // Get recurring invoice with client info
  const recurringInvoiceResult = await query(
    `SELECT 
      ri.*,
      c.id as client_id,
      c.name as client_name,
      c.email as client_email
    FROM recurring_invoices ri
    LEFT JOIN clients c ON ri.client_id = c.id
    WHERE ri.id = $1 AND ri.user_id = $2`,
    [recurringInvoiceId, userId]
  );

  if (recurringInvoiceResult.rows.length === 0) {
    return null;
  }

  const recurringInvoice = recurringInvoiceResult.rows[0];

  // Get line items with UOM info
  const itemsResult = await query(
    `SELECT 
      rii.*,
      u.code as uom_code,
      u.name as uom_name
     FROM recurring_invoice_items rii
     LEFT JOIN items i ON rii.item_id = i.id
     LEFT JOIN uoms u ON i.uom_id = u.id
     WHERE rii.recurring_invoice_id = $1
     ORDER BY rii.sort_order ASC, rii.id ASC`,
    [recurringInvoiceId]
  );

  recurringInvoice.items = itemsResult.rows;

  return recurringInvoice;
};

/**
 * Create recurring invoice with line items (transaction)
 */
export const createRecurringInvoice = async (userId, recurringInvoiceData, lineItems) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    const {
      clientId,
      frequency,
      startDate,
      endDate,
      dueDateDays,
      autoBill = 'disabled',
      notes,
      terms,
      currency,
      exchangeRate,
    } = recurringInvoiceData;

    // Calculate next generation date (start date if status is active, null if stopped)
    const status = 'stopped'; // New recurring invoices start as stopped
    const nextGenerationDate = null; // Will be calculated when started

    // Insert recurring invoice
    const recurringInvoiceResult = await client.query(
      `INSERT INTO recurring_invoices (
        client_id, user_id, frequency, start_date, end_date,
        due_date_days, auto_bill, status, notes, terms,
        currency, exchange_rate, next_generation_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        clientId,
        userId,
        frequency,
        startDate,
        endDate,
        dueDateDays,
        autoBill,
        status,
        notes || null,
        terms || null,
        currency || null,
        exchangeRate || null,
        nextGenerationDate,
      ]
    );

    const recurringInvoice = recurringInvoiceResult.rows[0];
    const recurringInvoiceId = recurringInvoice.id;

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

        await client.query(
          `INSERT INTO recurring_invoice_items (
            recurring_invoice_id, item_id, name, description, quantity, price,
            discount_percent, tax_percent, sort_order
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            recurringInvoiceId,
            itemId || null,
            name,
            description || null,
            quantity,
            price,
            discountPercent,
            taxPercent,
            i,
          ]
        );
      }
    }

    await client.query('COMMIT');

    // Get full recurring invoice with items
    return await getRecurringInvoiceById(userId, recurringInvoiceId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update recurring invoice
 */
export const updateRecurringInvoice = async (userId, recurringInvoiceId, recurringInvoiceData) => {
  const {
    clientId,
    frequency,
    startDate,
    endDate,
    dueDateDays,
    autoBill,
    notes,
    terms,
    currency,
    exchangeRate,
  } = recurringInvoiceData;

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (clientId !== undefined) {
    fields.push(`client_id = $${paramIndex++}`);
    values.push(clientId);
  }
  if (frequency !== undefined) {
    fields.push(`frequency = $${paramIndex++}`);
    values.push(frequency);
  }
  if (startDate !== undefined) {
    fields.push(`start_date = $${paramIndex++}`);
    values.push(startDate);
  }
  if (endDate !== undefined) {
    fields.push(`end_date = $${paramIndex++}`);
    values.push(endDate);
  }
  if (dueDateDays !== undefined) {
    fields.push(`due_date_days = $${paramIndex++}`);
    values.push(dueDateDays);
  }
  if (autoBill !== undefined) {
    fields.push(`auto_bill = $${paramIndex++}`);
    values.push(autoBill);
  }
  if (notes !== undefined) {
    fields.push(`notes = $${paramIndex++}`);
    values.push(notes || null);
  }
  if (terms !== undefined) {
    fields.push(`terms = $${paramIndex++}`);
    values.push(terms || null);
  }
  if (currency !== undefined) {
    fields.push(`currency = $${paramIndex++}`);
    values.push(currency);
  }
  if (exchangeRate !== undefined) {
    fields.push(`exchange_rate = $${paramIndex++}`);
    values.push(exchangeRate || null);
  }

  if (fields.length === 0) {
    return getRecurringInvoiceById(userId, recurringInvoiceId);
  }

  values.push(recurringInvoiceId, userId);
  const whereClause = `WHERE id = $${paramIndex++} AND user_id = $${paramIndex}`;

  const result = await query(
    `UPDATE recurring_invoices 
     SET ${fields.join(', ')}, updated_at = NOW()
     ${whereClause}
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    return null;
  }

  return await getRecurringInvoiceById(userId, recurringInvoiceId);
};

/**
 * Update recurring invoice line items
 */
export const updateRecurringInvoiceItems = async (userId, recurringInvoiceId, lineItems) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Delete existing items
    await client.query(
      'DELETE FROM recurring_invoice_items WHERE recurring_invoice_id = $1',
      [recurringInvoiceId]
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

        await client.query(
          `INSERT INTO recurring_invoice_items (
            recurring_invoice_id, item_id, name, description, quantity, price,
            discount_percent, tax_percent, sort_order
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            recurringInvoiceId,
            itemId || null,
            name,
            description || null,
            quantity,
            price,
            discountPercent,
            taxPercent,
            i,
          ]
        );
      }
    }

    await client.query('COMMIT');

    return await getRecurringInvoiceById(userId, recurringInvoiceId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Delete recurring invoice
 */
export const deleteRecurringInvoice = async (userId, recurringInvoiceId) => {
  // Line items will be deleted via CASCADE
  const result = await query(
    'DELETE FROM recurring_invoices WHERE id = $1 AND user_id = $2 RETURNING id',
    [recurringInvoiceId, userId]
  );

  return result.rows[0] || null;
};

/**
 * Start recurring invoice (set status to active and calculate next generation date)
 */
export const startRecurringInvoice = async (userId, recurringInvoiceId) => {
  // Get the recurring invoice to calculate next generation date
  const recurringInvoice = await getRecurringInvoiceById(userId, recurringInvoiceId);
  if (!recurringInvoice) {
    return null;
  }

  // Calculate next generation date based on start_date and current date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = new Date(recurringInvoice.start_date);
  startDate.setHours(0, 0, 0, 0);

  let nextGenerationDate;
  if (startDate > today) {
    // Start date is in the future, use it
    nextGenerationDate = startDate.toISOString().split('T')[0];
  } else {
    // Start date is today or in the past, calculate next date based on frequency
    // This will be handled by the generation utility
    nextGenerationDate = startDate.toISOString().split('T')[0];
  }

  const result = await query(
    `UPDATE recurring_invoices 
     SET status = 'active', next_generation_date = $1, updated_at = NOW()
     WHERE id = $2 AND user_id = $3
     RETURNING *`,
    [nextGenerationDate, recurringInvoiceId, userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return await getRecurringInvoiceById(userId, recurringInvoiceId);
};

/**
 * Stop recurring invoice (set status to stopped)
 */
export const stopRecurringInvoice = async (userId, recurringInvoiceId) => {
  const result = await query(
    `UPDATE recurring_invoices 
     SET status = 'stopped', next_generation_date = NULL, updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [recurringInvoiceId, userId]
  );

  if (result.rows.length === 0) {
    return null;
  }

  return await getRecurringInvoiceById(userId, recurringInvoiceId);
};

/**
 * Get active recurring invoices that are due for generation
 */
export const getDueRecurringInvoices = async () => {
  const today = new Date().toISOString().split('T')[0];
  
  const result = await query(
    `SELECT ri.*, c.name as client_name, c.email as client_email
     FROM recurring_invoices ri
     LEFT JOIN clients c ON ri.client_id = c.id
     WHERE ri.status = 'active'
       AND ri.next_generation_date <= $1
       AND ri.end_date >= $1
     ORDER BY ri.next_generation_date ASC`,
    [today]
  );

  return result.rows;
};

/**
 * Update last generated date and calculate next generation date
 */
export const updateRecurringInvoiceGeneration = async (recurringInvoiceId, nextGenerationDate) => {
  await query(
    `UPDATE recurring_invoices 
     SET last_generated_at = NOW(), 
         next_generation_date = $1,
         updated_at = NOW()
     WHERE id = $2`,
    [nextGenerationDate, recurringInvoiceId]
  );
};

/**
 * Get invoices generated from a recurring invoice
 */
export const getGeneratedInvoices = async (userId, recurringInvoiceId, filters = {}) => {
  const {
    page = 1,
    limit = 20,
    sort = 'created_at',
    order = 'desc',
  } = filters;

  const offset = (page - 1) * limit;
  const params = [userId, recurringInvoiceId];
  let paramIndex = 3;

  // Validate sort field
  const allowedSortFields = ['number', 'issue_date', 'due_date', 'total_amount', 'status', 'created_at'];
  const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';
  const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM invoices i
    WHERE i.user_id = $1 AND i.recurring_invoice_id = $2
  `;
  const countResult = await query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  // Get invoices
  const invoicesQuery = `
    SELECT 
      i.*,
      c.name as client_name
    FROM invoices i
    LEFT JOIN clients c ON i.client_id = c.id
    WHERE i.user_id = $1 AND i.recurring_invoice_id = $2
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
 * Verify client belongs to user
 */
export const verifyClientOwnership = async (userId, clientId) => {
  const result = await query(
    'SELECT id FROM clients WHERE id = $1 AND user_id = $2',
    [clientId, userId]
  );

  return result.rows.length > 0;
};

