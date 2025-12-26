import { validationResult } from 'express-validator';
import { errorResponse } from '../utils/response.js';

/**
 * Validation result handler middleware
 * Extracts validation errors and formats them according to API spec
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = {};
    errors.array().forEach(error => {
      const field = error.path || error.param || 'unknown';
      if (!details[field]) {
        details[field] = [];
      }
      details[field].push(error.msg);
    });
    return errorResponse(
      res,
      'VALIDATION_ERROR',
      'Validation failed',
      details,
      422
    );
  }
  next();
};



