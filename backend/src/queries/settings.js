import { query } from '../config/database.js';

/**
 * Company settings queries
 */

/**
 * Get user's company settings
 */
export const getSettings = async (userId) => {
  const result = await query(
    'SELECT * FROM company_settings WHERE user_id = $1',
    [userId]
  );

  return result.rows[0] || null;
};

/**
 * Get or create default settings for user
 */
export const getOrCreateSettings = async (userId) => {
  let settings = await getSettings(userId);

  if (!settings) {
    // Create default settings
    const result = await query(
      `INSERT INTO company_settings (user_id, company_name, quotation_prefix, invoice_prefix)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, 'My Company', 'QT-', 'INV-']
    );
    settings = result.rows[0];
  }

  return settings;
};

/**
 * Get quotation prefix for user
 */
export const getQuotationPrefix = async (userId) => {
  const settings = await getOrCreateSettings(userId);
  return settings.quotation_prefix || 'QT-';
};

/**
 * Get invoice prefix for user
 */
export const getInvoicePrefix = async (userId) => {
  const settings = await getOrCreateSettings(userId);
  return settings.invoice_prefix || 'INV-';
};

/**
 * Update company settings
 */
export const updateSettings = async (userId, settingsData) => {
  const {
    companyName,
    logoUrl,
    registeredAddress,
    shippingAddress,
    email,
    phone,
    gstNumber,
    registrationNumber,
    defaultTaxRate,
    currency,
    dateFormat,
    invoicePrefix,
    quotationPrefix,
    termsTemplate,
    taxPerItemEnabled,
  } = settingsData;

  const fields = [];
  const values = [];
  let paramIndex = 1;

  // Map camelCase to snake_case
  const fieldMap = {
    companyName: 'company_name',
    logoUrl: 'logo_url',
    registeredAddress: 'registered_address',
    shippingAddress: 'shipping_address',
    email: 'email',
    phone: 'phone',
    gstNumber: 'gst_number',
    registrationNumber: 'registration_number',
    defaultTaxRate: 'default_tax_rate',
    defaultTaxId: 'default_tax_id',
    currency: 'currency',
    dateFormat: 'date_format',
    invoicePrefix: 'invoice_prefix',
    quotationPrefix: 'quotation_prefix',
    termsTemplate: 'terms_template',
    taxPerItemEnabled: 'tax_per_item_enabled',
  };

  for (const [key, value] of Object.entries(settingsData)) {
    // Include field if it exists in fieldMap and is not undefined
    // Note: We allow null and empty strings to be saved (null for optional fields, empty string for text fields)
    if (value !== undefined && fieldMap[key]) {
      fields.push(`${fieldMap[key]} = $${paramIndex++}`);
      // Convert empty strings to null for optional fields (except company_name which is required)
      if (value === '' && key !== 'companyName') {
        values.push(null);
      } else {
        values.push(value);
      }
    }
  }

  if (fields.length === 0) {
    return await getOrCreateSettings(userId);
  }

  // Check if settings exist
  const existing = await getSettings(userId);
  
  if (existing) {
    // Update existing settings
    values.push(userId);
    const result = await query(
      `UPDATE company_settings 
       SET ${fields.join(', ')}, updated_at = NOW()
       WHERE user_id = $${paramIndex}
       RETURNING *`,
      values
    );
    
    if (!result.rows || result.rows.length === 0) {
      throw new Error('Failed to update company settings - no rows affected');
    }
    
    return result.rows[0];
  } else {
    // Create new settings with provided values and defaults
    const allFields = ['user_id', ...Object.values(fieldMap), 'created_at', 'updated_at'];
    const allValues = [userId];
    const placeholders = ['$1'];
    let placeholderIndex = 2;

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (settingsData[key] !== undefined) {
        allValues.push(settingsData[key]);
        placeholders.push(`$${placeholderIndex++}`);
      } else {
        // Use default values
        if (key === 'companyName') allValues.push('My Company');
        else if (key === 'invoicePrefix') allValues.push('INV-');
        else if (key === 'quotationPrefix') allValues.push('QT-');
        else if (key === 'defaultTaxRate') allValues.push(10.00);
        else if (key === 'currency') allValues.push('MVR');
        else if (key === 'dateFormat') allValues.push('MM/DD/YYYY');
        else if (key === 'taxPerItemEnabled') allValues.push(true);
        else allValues.push(null);
        placeholders.push(`$${placeholderIndex++}`);
      }
    }

    allValues.push('NOW()', 'NOW()');
    placeholders.push('NOW()', 'NOW()');

    const result = await query(
      `INSERT INTO company_settings (${allFields.join(', ')})
       VALUES (${placeholders.join(', ')})
       RETURNING *`,
      allValues
    );
    return result.rows[0];
  }
};

