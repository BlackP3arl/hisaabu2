import { query } from '../config/database.js';

/**
 * Tax queries
 */

/**
 * Get all taxes for a user
 */
export const getTaxes = async (userId) => {
  const result = await query(
    'SELECT * FROM taxes WHERE user_id = $1 ORDER BY is_default DESC, name ASC',
    [userId]
  );
  return result.rows;
};

/**
 * Get a single tax by ID
 */
export const getTax = async (taxId, userId) => {
  const result = await query(
    'SELECT * FROM taxes WHERE id = $1 AND user_id = $2',
    [taxId, userId]
  );
  return result.rows[0] || null;
};

/**
 * Get default tax for a user
 */
export const getDefaultTax = async (userId) => {
  const result = await query(
    'SELECT * FROM taxes WHERE user_id = $1 AND is_default = true LIMIT 1',
    [userId]
  );
  return result.rows[0] || null;
};

/**
 * Create a new tax
 */
export const createTax = async (userId, taxData) => {
  const { name, rate, isDefault } = taxData;

  // If this is set as default, unset other defaults for this user
  if (isDefault) {
    await query(
      'UPDATE taxes SET is_default = false WHERE user_id = $1 AND is_default = true',
      [userId]
    );
  }

  const result = await query(
    `INSERT INTO taxes (user_id, name, rate, is_default)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [userId, name, rate, isDefault || false]
  );
  return result.rows[0];
};

/**
 * Update a tax
 */
export const updateTax = async (taxId, userId, taxData) => {
  const { name, rate, isDefault } = taxData;
  const fields = [];
  const values = [];
  let paramIndex = 1;

  if (name !== undefined) {
    fields.push(`name = $${paramIndex++}`);
    values.push(name);
  }
  if (rate !== undefined) {
    fields.push(`rate = $${paramIndex++}`);
    values.push(rate);
  }
  if (isDefault !== undefined) {
    // If setting as default, unset other defaults
    if (isDefault) {
      await query(
        'UPDATE taxes SET is_default = false WHERE user_id = $1 AND is_default = true AND id != $2',
        [userId, taxId]
      );
    }
    fields.push(`is_default = $${paramIndex++}`);
    values.push(isDefault);
  }

  if (fields.length === 0) {
    return await getTax(taxId, userId);
  }

  fields.push(`updated_at = NOW()`);
  values.push(taxId, userId);

  const result = await query(
    `UPDATE taxes 
     SET ${fields.join(', ')}
     WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
     RETURNING *`,
    values
  );
  return result.rows[0] || null;
};

/**
 * Delete a tax
 */
export const deleteTax = async (taxId, userId) => {
  const result = await query(
    'DELETE FROM taxes WHERE id = $1 AND user_id = $2 RETURNING *',
    [taxId, userId]
  );
  return result.rows[0] || null;
};

/**
 * Initialize default GST tax for a user if no taxes exist
 */
export const initializeDefaultGST = async (userId) => {
  const existingTaxes = await getTaxes(userId);
  
  if (existingTaxes.length === 0) {
    // Create default GST tax
    const gstTax = await createTax(userId, {
      name: 'GST',
      rate: 10.00,
      isDefault: true
    });
    
    // Update company_settings to reference this tax
    await query(
      'UPDATE company_settings SET default_tax_id = $1 WHERE user_id = $2',
      [gstTax.id, userId]
    );
    
    return gstTax;
  }
  
  return null;
};

