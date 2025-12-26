/**
 * Standardized response utilities
 * All API responses follow the documented format
 */

/**
 * Send success response
 * @param {Object} res - Express response object
 * @param {*} data - Response data
 * @param {string|null} message - Optional success message
 * @param {number} statusCode - HTTP status code (default: 200)
 */
export const successResponse = (res, data, message = null, statusCode = 200) => {
  const response = {
    success: true,
  };
  
  if (message) {
    response.message = message;
  }
  
  response.data = data;
  
  return res.status(statusCode).json(response);
};

/**
 * Send error response
 * @param {Object} res - Express response object
 * @param {string} code - Error code
 * @param {string} message - Error message
 * @param {*} details - Optional error details (validation errors, etc.)
 * @param {number} statusCode - HTTP status code (default: 400)
 */
export const errorResponse = (res, code, message, details = null, statusCode = 400) => {
  const response = {
    success: false,
    error: {
      code,
      message,
    },
  };
  
  if (details) {
    response.error.details = details;
  }
  
  return res.status(statusCode).json(response);
};

/**
 * Convert database row (snake_case) to API response (camelCase)
 * @param {Object} row - Database row object
 * @returns {Object} - CamelCase object
 */
export const toCamelCase = (row) => {
  if (!row || typeof row !== 'object') return row;
  
  const camelRow = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    camelRow[camelKey] = value;
  }
  
  return camelRow;
};

/**
 * Convert array of database rows to camelCase
 * @param {Array} rows - Array of database row objects
 * @returns {Array} - Array of camelCase objects
 */
export const toCamelCaseArray = (rows) => {
  if (!Array.isArray(rows)) return rows;
  return rows.map(toCamelCase);
};

/**
 * Format date to ISO string
 * @param {Date|string} date - Date to format
 * @returns {string} - ISO 8601 date string
 */
export const formatDate = (date) => {
  if (!date) return null;
  if (date instanceof Date) {
    return date.toISOString();
  }
  return date;
};



