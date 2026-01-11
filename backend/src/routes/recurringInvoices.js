import express from 'express';
import { body, query as queryValidator } from 'express-validator';
import {
  listRecurringInvoices,
  getRecurringInvoice,
  create,
  update,
  remove,
  start,
  stop,
  getSchedule,
  getGeneratedInvoicesList,
} from '../controllers/recurringInvoiceController.js';
import { authenticate } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation middleware
const createRecurringInvoiceValidation = [
  body('clientId')
    .notEmpty()
    .isInt()
    .withMessage('Client ID is required'),
  body('frequency')
    .notEmpty()
    .isIn(['daily', 'weekly', 'monthly', 'quarterly', 'annually'])
    .withMessage('Frequency must be one of: daily, weekly, monthly, quarterly, annually'),
  body('startDate')
    .notEmpty()
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('endDate')
    .notEmpty()
    .isISO8601()
    .withMessage('Valid end date is required')
    .custom((value, { req }) => {
      if (req.body.startDate && new Date(value) < new Date(req.body.startDate)) {
        throw new Error('End date must be >= start date');
      }
      return true;
    }),
  body('dueDateDays')
    .notEmpty()
    .isInt({ min: 1, max: 30 })
    .withMessage('Due date days must be between 1 and 30'),
  body('autoBill')
    .optional()
    .isIn(['disabled', 'enabled', 'opt_in'])
    .withMessage('Auto bill must be disabled, enabled, or opt_in'),
  body('items')
    .isArray({ min: 1 })
    .withMessage('At least one line item is required'),
  body('items.*.name')
    .trim()
    .notEmpty()
    .withMessage('Item name is required'),
  body('items.*.quantity')
    .isFloat({ min: 0.01 })
    .withMessage('Quantity must be > 0'),
  body('items.*.price')
    .isFloat({ min: 0 })
    .withMessage('Price must be >= 0'),
  body('items.*.discountPercent')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Discount percent must be 0-100'),
  body('items.*.taxPercent')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Tax percent must be 0-100'),
  body('notes')
    .optional()
    .trim(),
  body('terms')
    .optional()
    .trim(),
];

const updateRecurringInvoiceValidation = [
  body('clientId')
    .optional()
    .isInt()
    .withMessage('Client ID must be an integer'),
  body('frequency')
    .optional()
    .isIn(['daily', 'weekly', 'monthly', 'quarterly', 'annually'])
    .withMessage('Frequency must be one of: daily, weekly, monthly, quarterly, annually'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Valid start date is required'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('Valid end date is required')
    .custom((value, { req }) => {
      if (req.body.startDate && new Date(value) < new Date(req.body.startDate)) {
        throw new Error('End date must be >= start date');
      }
      return true;
    }),
  body('dueDateDays')
    .optional()
    .isInt({ min: 1, max: 30 })
    .withMessage('Due date days must be between 1 and 30'),
  body('autoBill')
    .optional()
    .isIn(['disabled', 'enabled', 'opt_in'])
    .withMessage('Auto bill must be disabled, enabled, or opt_in'),
  body('items')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one line item is required'),
  body('notes')
    .optional()
    .trim(),
  body('terms')
    .optional()
    .trim(),
];

const queryValidation = [
  queryValidator('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  queryValidator('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  queryValidator('status').optional().isIn(['all', 'active', 'stopped']).withMessage('Invalid status'),
  queryValidator('clientId').optional().isInt().withMessage('Client ID must be an integer'),
  queryValidator('sort').optional().isIn(['start_date', 'end_date', 'next_generation_date', 'status', 'created_at', 'updated_at']).withMessage('Invalid sort field'),
  queryValidator('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
];

// Routes
router.get('/', queryValidation, handleValidationErrors, listRecurringInvoices);
router.get('/:id', getRecurringInvoice);
router.get('/:id/schedule', getSchedule);
router.get('/:id/generated-invoices', queryValidation, handleValidationErrors, getGeneratedInvoicesList);
router.post('/', createRecurringInvoiceValidation, handleValidationErrors, create);
router.put('/:id', updateRecurringInvoiceValidation, handleValidationErrors, update);
router.delete('/:id', remove);
router.post('/:id/start', start);
router.post('/:id/stop', stop);

export default router;

