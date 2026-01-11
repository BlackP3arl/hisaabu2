import { query } from '../config/database.js';

/**
 * Client database queries
 */

/**
 * Get clients with pagination, search, and filters
 */
export const getClients = async (userId, filters = {}) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    status = 'all',
    sort = 'created_at',
    order = 'desc',
  } = filters;

  const offset = (page - 1) * limit;
  const params = [userId];
  let paramIndex = 2;

  let whereClause = 'WHERE c.user_id = $1';
  let joinClause = '';

  // Search filter
  if (search) {
    whereClause += ` AND (c.name ILIKE $${paramIndex} OR c.email ILIKE $${paramIndex} OR c.phone ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  // Status filter
  if (status && status !== 'all') {
    whereClause += ` AND c.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  // Validate sort field
  const allowedSortFields = ['name', 'email', 'created_at', 'updated_at'];
  const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';
  const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM clients c
    ${whereClause}
  `;
  const countResult = await query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  // Get clients with financial summary
  const clientsQuery = `
    SELECT 
      c.*,
      COALESCE(SUM(i.total_amount), 0) as total_billed,
      COALESCE(SUM(i.amount_paid), 0) as total_paid,
      COALESCE(SUM(i.total_amount) - SUM(i.amount_paid), 0) as outstanding,
      COUNT(DISTINCT i.id) as total_invoices,
      COUNT(DISTINCT q.id) as total_quotations
    FROM clients c
    LEFT JOIN invoices i ON c.id = i.client_id
    LEFT JOIN quotations q ON c.id = q.client_id
    ${whereClause}
    GROUP BY c.id
    ORDER BY c.${sortField} ${sortOrder}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  params.push(limit, offset);

  const result = await query(clientsQuery, params);

  return {
    clients: result.rows,
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
 * Get client by ID with financial summary
 */
export const getClientById = async (userId, clientId) => {
  const result = await query(
    `SELECT 
      c.*,
      COALESCE(SUM(i.total_amount), 0) as total_billed,
      COALESCE(SUM(i.amount_paid), 0) as total_paid,
      COALESCE(SUM(i.total_amount) - SUM(i.amount_paid), 0) as outstanding,
      COUNT(DISTINCT i.id) as total_invoices,
      COUNT(DISTINCT q.id) as total_quotations
    FROM clients c
    LEFT JOIN invoices i ON c.id = i.client_id
    LEFT JOIN quotations q ON c.id = q.client_id
    WHERE c.id = $1 AND c.user_id = $2
    GROUP BY c.id`,
    [clientId, userId]
  );

  return result.rows[0] || null;
};

/**
 * Create new client
 */
export const createClient = async (userId, clientData) => {
  const {
    name,
    email,
    phone,
    address,
    city,
    postalCode,
    country,
    companyName,
    taxId,
    status = 'active',
    notes,
  } = clientData;

  const result = await query(
    `INSERT INTO clients (
      name, email, phone, address, city, postal_code, country,
      company_name, tax_id, status, notes, user_id
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *`,
    [
      name,
      email,
      phone || null,
      address || null,
      city || null,
      postalCode || null,
      country || null,
      companyName || null,
      taxId || null,
      status,
      notes || null,
      userId,
    ]
  );

  return result.rows[0];
};

/**
 * Update client
 */
export const updateClient = async (userId, clientId, clientData) => {
  const {
    name,
    email,
    phone,
    address,
    city,
    postalCode,
    country,
    companyName,
    taxId,
    status,
    notes,
  } = clientData;

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(name);
  }
  if (email !== undefined) {
    fields.push(`email = $${paramIndex++}`);
    values.push(email);
  }
  if (phone !== undefined) {
    fields.push(`phone = $${paramIndex++}`);
    values.push(phone || null);
  }
  if (address !== undefined) {
    fields.push(`address = $${paramIndex++}`);
    values.push(address || null);
  }
  if (city !== undefined) {
    fields.push(`city = $${paramIndex++}`);
    values.push(city || null);
  }
  if (postalCode !== undefined) {
    fields.push(`postal_code = $${paramIndex++}`);
    values.push(postalCode || null);
  }
  if (country !== undefined) {
    fields.push(`country = $${paramIndex++}`);
    values.push(country || null);
  }
  if (companyName !== undefined) {
    fields.push(`company_name = $${paramIndex++}`);
    values.push(companyName || null);
  }
  if (taxId !== undefined) {
    fields.push(`tax_id = $${paramIndex++}`);
    values.push(taxId || null);
  }
  if (status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(status);
  }
  if (notes !== undefined) {
    fields.push(`notes = $${paramIndex++}`);
    values.push(notes || null);
  }

  if (fields.length === 0) {
    // No fields to update, return existing client
    return getClientById(userId, clientId);
  }

  values.push(clientId, userId);
  const whereClause = `WHERE id = $${paramIndex++} AND user_id = $${paramIndex}`;

  const result = await query(
    `UPDATE clients 
     SET ${fields.join(', ')}, updated_at = NOW()
     ${whereClause}
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

/**
 * Delete client
 */
export const deleteClient = async (userId, clientId) => {
  // Check if client has associated invoices or quotations
  const checkResult = await query(
    `SELECT 
      (SELECT COUNT(*) FROM invoices WHERE client_id = $1) as invoice_count,
      (SELECT COUNT(*) FROM quotations WHERE client_id = $1) as quotation_count
    `,
    [clientId]
  );

  const { invoice_count, quotation_count } = checkResult.rows[0];
  if (parseInt(invoice_count) > 0 || parseInt(quotation_count) > 0) {
    throw new Error('CLIENT_HAS_ASSOCIATIONS');
  }

  const result = await query(
    'DELETE FROM clients WHERE id = $1 AND user_id = $2 RETURNING id',
    [clientId, userId]
  );

  return result.rows[0] || null;
};

/**
 * Check if email exists for user
 */
export const clientEmailExists = async (userId, email, excludeClientId = null) => {
  let queryText = 'SELECT COUNT(*) as count FROM clients WHERE email = $1 AND user_id = $2';
  const params = [email, userId];

  if (excludeClientId) {
    queryText += ' AND id != $3';
    params.push(excludeClientId);
  }

  const result = await query(queryText, params);
  return parseInt(result.rows[0].count) > 0;
};



