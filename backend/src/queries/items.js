import { query } from '../config/database.js';

/**
 * Item database queries
 */

/**
 * Get items with pagination, search, and filters
 */
export const getItems = async (userId, filters = {}) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    categoryId = null,
    status = 'all',
    sort = 'created_at',
    order = 'desc',
  } = filters;

  const offset = (page - 1) * limit;
  const params = [userId];
  let paramIndex = 2;

  let whereClause = 'WHERE i.user_id = $1';

  // Search filter
  if (search) {
    whereClause += ` AND (i.name ILIKE $${paramIndex} OR i.description ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  // Category filter
  if (categoryId) {
    whereClause += ` AND i.category_id = $${paramIndex}`;
    params.push(categoryId);
    paramIndex++;
  }

  // Status filter
  if (status && status !== 'all') {
    whereClause += ` AND i.status = $${paramIndex}`;
    params.push(status);
    paramIndex++;
  }

  // Validate sort field
  const allowedSortFields = ['name', 'rate', 'created_at', 'updated_at'];
  const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';
  const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM items i
    ${whereClause}
  `;
  const countResult = await query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  // Get items with category info
  const itemsQuery = `
    SELECT 
      i.*,
      c.name as category_name,
      c.color as category_color
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    ${whereClause}
    ORDER BY i.${sortField} ${sortOrder}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  params.push(limit, offset);

  const result = await query(itemsQuery, params);

  return {
    items: result.rows,
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
 * Get item by ID
 */
export const getItemById = async (userId, itemId) => {
  const result = await query(
    `SELECT 
      i.*,
      c.name as category_name,
      c.color as category_color
    FROM items i
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE i.id = $1 AND i.user_id = $2`,
    [itemId, userId]
  );

  return result.rows[0] || null;
};

/**
 * Create new item
 */
export const createItem = async (userId, itemData) => {
  const { name, description, rate, categoryId, status = 'active' } = itemData;

  const result = await query(
    `INSERT INTO items (name, description, rate, category_id, status, user_id)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [name, description || null, rate, categoryId || null, status, userId]
  );

  return result.rows[0];
};

/**
 * Update item
 */
export const updateItem = async (userId, itemId, itemData) => {
  const { name, description, rate, categoryId, status } = itemData;

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(name);
  }
  if (description !== undefined) {
    fields.push(`description = $${paramIndex++}`);
    values.push(description || null);
  }
  if (rate !== undefined) {
    fields.push(`rate = $${paramIndex++}`);
    values.push(rate);
  }
  if (categoryId !== undefined) {
    fields.push(`category_id = $${paramIndex++}`);
    values.push(categoryId || null);
  }
  if (status !== undefined) {
    fields.push(`status = $${paramIndex++}`);
    values.push(status);
  }

  if (fields.length === 0) {
    return getItemById(userId, itemId);
  }

  values.push(itemId, userId);
  const whereClause = `WHERE id = $${paramIndex++} AND user_id = $${paramIndex}`;

  const result = await query(
    `UPDATE items 
     SET ${fields.join(', ')}, updated_at = NOW()
     ${whereClause}
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

/**
 * Delete item
 */
export const deleteItem = async (userId, itemId) => {
  const result = await query(
    'DELETE FROM items WHERE id = $1 AND user_id = $2 RETURNING id',
    [itemId, userId]
  );

  return result.rows[0] || null;
};

/**
 * Verify category belongs to user
 */
export const verifyCategoryOwnership = async (userId, categoryId) => {
  if (!categoryId) return true; // null category is allowed

  const result = await query(
    'SELECT id FROM categories WHERE id = $1 AND user_id = $2',
    [categoryId, userId]
  );

  return result.rows.length > 0;
};


