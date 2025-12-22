// src/utils/errorHandler.js

/**
 * Handle API errors and return user-friendly messages
 * @param {Error} error - Axios error object
 * @returns {string|object} - Error message or error details object
 */
export const handleApiError = (error) => {
  if (error.response) {
    // Server responded with error
    const { status, data } = error.response
    
    switch (status) {
      case 401:
        // Unauthorized - tokens should be handled by interceptor
        return data.error?.message || 'Unauthorized. Please log in again.'
      case 403:
        return data.error?.message || 'Access denied'
      case 404:
        return data.error?.message || 'Resource not found'
      case 422:
        // Validation errors - return details object with formatted message
        const validationMessage = data.error?.message || 'Validation failed'
        const details = data.error?.details || {}
        // Create a user-friendly message that includes field-specific errors
        const fieldErrors = Object.keys(details).map(field => {
          const errors = Array.isArray(details[field]) ? details[field] : [details[field]]
          return `${field}: ${errors.join(', ')}`
        }).join('; ')
        return {
          message: fieldErrors ? `${validationMessage}: ${fieldErrors}` : validationMessage,
          details: details
        }
      case 409:
        return data.error?.message || 'Resource already exists'
      case 410:
        return data.error?.message || 'Resource no longer available'
      case 500:
        return data.error?.message || 'Server error. Please try again later.'
      default:
        return data.error?.message || `An error occurred (${status})`
    }
  } else if (error.request) {
    // Request made but no response
    return 'Network error. Please check your connection.'
  } else {
    // Error setting up request
    return error.message || 'An unexpected error occurred'
  }
}

/**
 * Extract validation errors from API response
 * @param {Error} error - Axios error object
 * @returns {object} - Object with field names as keys and error messages as values
 */
export const getValidationErrors = (error) => {
  if (error.response?.status === 422 && error.response?.data?.error?.details) {
    return error.response.data.error.details
  }
  return {}
}

/**
 * Check if error is a network error
 * @param {Error} error - Axios error object
 * @returns {boolean}
 */
export const isNetworkError = (error) => {
  return !error.response && error.request
}

/**
 * Get error message as a string (handles both string and object errors)
 * @param {string|object|Error} error - Error from handleApiError or Error object
 * @returns {string} - Error message as string
 */
export const getErrorMessage = (error) => {
  if (!error) return 'An unexpected error occurred'
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  if (typeof error === 'object' && error.message) return error.message
  return 'An unexpected error occurred'
}


