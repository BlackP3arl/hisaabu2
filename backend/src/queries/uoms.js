import { query } from '../config/database.js';

/**
 * UOM database queries
 */

/**
 * Get all UOMs (global/shared, no user filtering needed)
 */
export const getUoms = async () => {
  const result = await query(
    'SELECT * FROM uoms ORDER BY name ASC'
  );

  return result.rows;
};

/**
 * Get UOM by ID
 */
export const getUomById = async (uomId) => {
  const result = await query(
    'SELECT * FROM uoms WHERE id = $1',
    [uomId]
  );

  return result.rows[0] || null;
};

/**
 * Get UOM by code
 */
export const getUomByCode = async (code) => {
  const result = await query(
    'SELECT * FROM uoms WHERE code = $1',
    [code]
  );

  return result.rows[0] || null;
};

/**
 * Create new UOM
 */
export const createUom = async (uomData) => {
  const { name, code } = uomData;

  const result = await query(
    `INSERT INTO uoms (name, code)
     VALUES ($1, $2)
     RETURNING *`,
    [name.trim(), code.trim().toUpperCase()]
  );

  return result.rows[0];
};

/**
 * Update UOM
 */
export const updateUom = async (uomId, uomData) => {
  const { name, code } = uomData;

  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(name.trim());
  }
  if (code !== undefined) {
    fields.push(`code = $${paramIndex++}`);
    values.push(code.trim().toUpperCase());
  }

  if (fields.length === 0) {
    return getUomById(uomId);
  }

  values.push(uomId);
  const whereClause = `WHERE id = $${paramIndex}`;

  const result = await query(
    `UPDATE uoms 
     SET ${fields.join(', ')}, updated_at = NOW()
     ${whereClause}
     RETURNING *`,
    values
  );

  return result.rows[0] || null;
};

/**
 * Delete UOM
 */
export const deleteUom = async (uomId) => {
  const result = await query(
    'DELETE FROM uoms WHERE id = $1 RETURNING id',
    [uomId]
  );

  return result.rows[0] || null;
};

/**
 * Verify UOM exists
 */
export const verifyUomExists = async (uomId) => {
  if (!uomId) return true; // null UOM is allowed

  const result = await query(
    'SELECT id FROM uoms WHERE id = $1',
    [uomId]
  );

  return result.rows.length > 0;
};


