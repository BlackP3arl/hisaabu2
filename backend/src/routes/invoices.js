import express from 'express';
import { body, query as queryValidator } from 'express-validator';
import {
  listInvoices,
  getInvoice,
  create,
  update,
  remove,
} from '../controllers/invoiceController.js';
import { generateInvoicePDFController } from '../controllers/pdfController.js';
import { authenticate } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation middleware
const createInvoiceValidation = [
  body('clientId')
    .notEmpty()
    .isInt()
    .withMessage('Client ID is required'),
  body('issueDate')
    .notEmpty()
    .isISO8601()
    .withMessage('Valid issue date is required'),
  body('dueDate')
    .notEmpty()
    .isISO8601()
    .withMessage('Valid due date is required')
    .custom((value, { req }) => {
      if (req.body.issueDate && new Date(value) < new Date(req.body.issueDate)) {
        throw new Error('Due date must be >= issue date');
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(['draft', 'sent', 'paid', 'partial', 'overdue'])
    .withMessage('Status must be one of: draft, sent, paid, partial, overdue'),
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

const updateInvoiceValidation = [
  body('clientId')
    .optional()
    .isInt()
    .withMessage('Client ID must be an integer'),
  body('issueDate')
    .optional()
    .isISO8601()
    .withMessage('Valid issue date is required'),
  body('dueDate')
    .optional()
    .isISO8601()
    .withMessage('Valid due date is required')
    .custom((value, { req }) => {
      if (req.body.issueDate && new Date(value) < new Date(req.body.issueDate)) {
        throw new Error('Due date must be >= issue date');
      }
      return true;
    }),
  body('status')
    .optional()
    .isIn(['draft', 'sent', 'paid', 'partial', 'overdue'])
    .withMessage('Status must be one of: draft, sent, paid, partial, overdue'),
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
  queryValidator('status').optional().isIn(['all', 'draft', 'sent', 'paid', 'partial', 'overdue']).withMessage('Invalid status'),
  queryValidator('clientId').optional().isInt().withMessage('Client ID must be an integer'),
  queryValidator('dateFrom').optional().isISO8601().withMessage('Valid date format required'),
  queryValidator('dateTo').optional().isISO8601().withMessage('Valid date format required'),
  queryValidator('sort').optional().isIn(['number', 'issue_date', 'due_date', 'total_amount', 'status', 'created_at', 'updated_at']).withMessage('Invalid sort field'),
  queryValidator('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
];

// Routes
router.get('/', queryValidation, handleValidationErrors, listInvoices);
router.get('/:id', getInvoice);
router.get('/:id/pdf', generateInvoicePDFController);
router.post('/', createInvoiceValidation, handleValidationErrors, create);
router.put('/:id', updateInvoiceValidation, handleValidationErrors, update);
router.delete('/:id', remove);

export default router;



