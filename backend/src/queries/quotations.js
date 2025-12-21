import { query, getClient } from '../config/database.js';

/**
 * Quotation database queries
 */

/**
 * Get quotations with pagination, search, and filters
 */
export const getQuotations = async (userId, filters = {}) => {
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

  let whereClause = 'WHERE q.user_id = $1';
  let joinClause = 'LEFT JOIN clients c ON q.client_id = c.id';

  // Search filter
  if (search) {
    whereClause += ` AND (q.number ILIKE $${paramIndex} OR c.name ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  // Status filter
  if (status && status !== 'all') {
    whereClause += ` AND q.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  // Client filter
  if (clientId) {
    whereClause += ` AND q.client_id = $${paramIndex}`;
    params.push(clientId);
    paramIndex++;
  }

  // Date range filters
  if (dateFrom) {
    whereClause += ` AND q.issue_date >= $${paramIndex}`;
    params.push(dateFrom);
    paramIndex++;
  }

  if (dateTo) {
    whereClause += ` AND q.issue_date <= $${paramIndex}`;
    params.push(dateTo);
    paramIndex++;
  }

  // Validate sort field
  const allowedSortFields = ['number', 'issue_date', 'expiry_date', 'total_amount', 'status', 'created_at', 'updated_at'];
  const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';
  const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM quotations q
    ${joinClause}
    ${whereClause}
  `;
  const countResult = await query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  // Get quotations with client name
  const quotationsQuery = `
    SELECT 
      q.*,
      c.name as client_name
    FROM quotations q
    ${joinClause}
    ${whereClause}
    ORDER BY q.${sortField} ${sortOrder}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  params.push(limit, offset);

  const result = await query(quotationsQuery, params);

  return {
    quotations: result.rows,
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
 * Get quotation by ID with line items and client info
 */
export const getQuotationById = async (userId, quotationId) => {
  // Get quotation with client info
  const quotationResult = await query(
    `SELECT 
      q.*,
      c.id as client_id,
      c.name as client_name,
      c.email as client_email
    FROM quotations q
    LEFT JOIN clients c ON q.client_id = c.id
    WHERE q.id = $1 AND q.user_id = $2`,
    [quotationId, userId]
  );

  if (quotationResult.rows.length === 0) {
    return null;
  }

  const quotation = quotationResult.rows[0];

  // Get line items
  const itemsResult = await query(
    `SELECT *
     FROM quotation_items
     WHERE quotation_id = $1
     ORDER BY sort_order ASC, id ASC`,
    [quotationId]
  );

  quotation.items = itemsResult.rows;

  return quotation;
};

/**
 * Create quotation with line items (transaction)
 */
export const createQuotation = async (userId, quotationData, lineItems, quotationNumber) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    const {
      clientId,
      issueDate,
      expiryDate,
      notes,
      terms,
      status = 'draft',
    } = quotationData;

    // Insert quotation
    const quotationResult = await client.query(
      `INSERT INTO quotations (
        number, client_id, user_id, issue_date, expiry_date,
        notes, terms, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [quotationNumber, clientId, userId, issueDate, expiryDate, notes || null, terms || null, status]
    );

    const quotation = quotationResult.rows[0];
    const quotationId = quotation.id;

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
          `INSERT INTO quotation_items (
            quotation_id, item_id, name, description, quantity, price,
            discount_percent, tax_percent, line_total, sort_order
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            quotationId,
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

    // Get full quotation with items
    return await getQuotationById(userId, quotationId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Update quotation
 */
export const updateQuotation = async (userId, quotationId, quotationData) => {
  const {
    clientId,
    issueDate,
    expiryDate,
    notes,
    terms,
    status,
  } = quotationData;

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
  if (expiryDate !== undefined) {
    fields.push(`expiry_date = $${paramIndex++}`);
    values.push(expiryDate);
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
    return getQuotationById(userId, quotationId);
  }

  values.push(quotationId, userId);
  const whereClause = `WHERE id = $${paramIndex++} AND user_id = $${paramIndex}`;

  const result = await query(
    `UPDATE quotations 
     SET ${fields.join(', ')}, updated_at = NOW()
     ${whereClause}
     RETURNING *`,
    values
  );

  if (result.rows.length === 0) {
    return null;
  }

  return await getQuotationById(userId, quotationId);
};

/**
 * Update quotation line items
 */
export const updateQuotationItems = async (userId, quotationId, lineItems) => {
  const client = await getClient();
  
  try {
    await client.query('BEGIN');

    // Delete existing items
    await client.query(
      'DELETE FROM quotation_items WHERE quotation_id = $1',
      [quotationId]
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
          `INSERT INTO quotation_items (
            quotation_id, item_id, name, description, quantity, price,
            discount_percent, tax_percent, line_total, sort_order
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            quotationId,
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
    return await getQuotationById(userId, quotationId);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Delete quotation
 */
export const deleteQuotation = async (userId, quotationId) => {
  // Line items will be deleted via CASCADE
  const result = await query(
    'DELETE FROM quotations WHERE id = $1 AND user_id = $2 RETURNING id',
    [quotationId, userId]
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

