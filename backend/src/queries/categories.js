import { query } from '../config/database.js';

/**
 * Category database queries
 */

/**
 * Get categories with pagination and search
 */
export const getCategories = async (userId, filters = {}) => {
  const {
    page = 1,
    limit = 20,
    search = '',
    sort = 'created_at',
    order = 'desc',
  } = filters;

  const offset = (page - 1) * limit;
  const params = [userId];
  let paramIndex = 2;

  let whereClause = 'WHERE user_id = $1';

  // Search filter
  if (search) {
    whereClause += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
    params.push(`%${search}%`);
    paramIndex++;
  }

  // Validate sort field
  const allowedSortFields = ['name', 'created_at', 'updated_at', 'item_count'];
  const sortField = allowedSortFields.includes(sort) ? sort : 'created_at';
  const sortOrder = order.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // Get total count
  const countQuery = `SELECT COUNT(*) as total FROM categories ${whereClause}`;
  const countResult = await query(countQuery, params);
  const total = parseInt(countResult.rows[0].total);

  // Get categories
  const categoriesQuery = `
    SELECT *
    FROM categories
    ${whereClause}
    ORDER BY ${sortField} ${sortOrder}
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;
  params.push(limit, offset);

  const result = await query(categoriesQuery, params);

  return {
    categories: result.rows,
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
 * Get category by ID
 */
export const getCategoryById = async (userId, categoryId) => {
  const result = await query(
    'SELECT * FROM categories WHERE id = $1 AND user_id = $2',
    [categoryId, userId]
  );

  return result.rows[0] || null;
};

/**
 * Create new category
 */
export const createCategory = async (userId, categoryData) => {
  const { name, description, color } = categoryData;

  const result = await query(
    `INSERT INTO categories (name, description, color, user_id)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [name, description || null, color, userId]
  );

  return result.rows[0];
};

/**
 * Update category
 */
export const updateCategory = async (userId, categoryId, categoryData) => {
  const { name, description, color } = categoryData;

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
  if (color !== undefined) {
    fields.push(`color = $${paramIndex++}`);
    values.push(color);
  }

  if (fields.length === 0) {
    return getCategoryById(userId, categoryId);
  }

  values.push(categoryId, userId);
  const whereClause = `WHERE id = $${paramIndex++} AND user_id = $${paramIndex}`;

  const result = await query(
    `UPDATE categories 
     SET ${fields.join(', ')}, updated_at = NOW()
     ${whereClause}
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

/**
 * Delete category
 */
export const deleteCategory = async (userId, categoryId) => {
  // When category is deleted, items in that category will have category_id set to NULL
  // (handled by database foreign key constraint)
  const result = await query(
    'DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id',
    [categoryId, userId]
  );

  return result.rows[0] || null;
};


