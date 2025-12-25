/**
 * Document numbering utilities
 */

/**
 * Generate quotation number
 * Format: {prefix}-{YYYY}-{NNN}
 * Example: QT-2024-001
 */
export const generateQuotationNumber = async (userId, prefix, queryFn) => {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `${prefix}${currentYear}-`;

  // Find the highest number for this year and user
  const result = await queryFn(
    `SELECT number 
     FROM quotations 
     WHERE user_id = $1 
       AND number LIKE $2
     ORDER BY number DESC 
     LIMIT 1`,
    [userId, `${yearPrefix}%`]
  );

  let nextNumber = 1;

  if (result.rows.length > 0) {
    // Extract the number part from the last quotation number
    const lastNumber = result.rows[0].number;
    const match = lastNumber.match(new RegExp(`${yearPrefix}(\\d+)`));
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  // Format with leading zeros (3 digits)
  const formattedNumber = String(nextNumber).padStart(3, '0');
  return `${yearPrefix}${formattedNumber}`;
};

/**
 * Generate invoice number
 * Format: {prefix}-{NNNN}
 * Example: INV-0023
 */
export const generateInvoiceNumber = async (userId, prefix, queryFn) => {
  // Find the highest number for this user
  const result = await queryFn(
    `SELECT number 
     FROM invoices 
     WHERE user_id = $1 
       AND number LIKE $2
     ORDER BY number DESC 
     LIMIT 1`,
    [userId, `${prefix}%`]
  );

  let nextNumber = 1;

  if (result.rows.length > 0) {
    // Extract the number part from the last invoice number
    const lastNumber = result.rows[0].number;
    const match = lastNumber.match(new RegExp(`${prefix}(\\d+)`));
    if (match) {
      nextNumber = parseInt(match[1], 10) + 1;
    }
  }

  // Format with leading zeros (4 digits)
  const formattedNumber = String(nextNumber).padStart(4, '0');
  return `${prefix}${formattedNumber}`;
};

