import { errorResponse } from '../utils/response.js';

/**
 * Global error handler middleware
 * Handles all errors and returns standardized error responses
 */
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Database errors
  if (err.code === '23505') {
    // Unique constraint violation
    return errorResponse(
      res,
      'CONFLICT',
      'Resource already exists',
      { field: err.constraint },
      409
    );
  }

  if (err.code === '23503') {
    // Foreign key constraint violation
    return errorResponse(
      res,
      'BAD_REQUEST',
      'Referenced resource does not exist',
      null,
      400
    );
  }

  if (err.code === '23502') {
    // Not null constraint violation
    return errorResponse(
      res,
      'VALIDATION_ERROR',
      'Required field is missing',
      { field: err.column },
      422
    );
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(
      res,
      'UNAUTHORIZED',
      'Invalid token',
      null,
      401
    );
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(
      res,
      'UNAUTHORIZED',
      'Token expired',
      null,
      401
    );
  }

  // Validation errors (from express-validator)
  if (err.name === 'ValidationError' || err.array) {
    const errors = err.array ? err.array() : [err];
    const details = {};
    
    errors.forEach((error) => {
      const field = error.path || error.param || 'unknown';
      if (!details[field]) {
        details[field] = [];
      }
      details[field].push(error.msg || error.message);
    });

    return errorResponse(
      res,
      'VALIDATION_ERROR',
      'Validation failed',
      details,
      422
    );
  }

  // Default error
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';
  const code = err.code || 'INTERNAL_ERROR';

  return errorResponse(
    res,
    code,
    process.env.NODE_ENV === 'production' ? 'An error occurred' : message,
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : null,
    statusCode
  );
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (req, res, next) => {
  return errorResponse(
    res,
    'NOT_FOUND',
    `Route ${req.originalUrl} not found`,
    null,
    404
  );
};


