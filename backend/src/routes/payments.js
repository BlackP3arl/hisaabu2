import express from 'express';
import { body } from 'express-validator';
import {
  recordPayment,
  update,
  remove,
} from '../controllers/paymentController.js';
import { authenticate } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation middleware
const createPaymentValidation = [
  body('amount')
    .notEmpty()
    .isFloat({ min: 0.01 })
    .withMessage('Payment amount must be > 0'),
  body('paymentDate')
    .notEmpty()
    .isISO8601()
    .withMessage('Valid payment date is required'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'bank_transfer', 'credit_card', 'check', 'other'])
    .withMessage('Payment method must be one of: cash, bank_transfer, credit_card, check, other'),
  body('referenceNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Reference number must be <= 100 characters'),
  body('notes')
    .optional()
    .trim(),
];

const updatePaymentValidation = [
  body('amount')
    .optional()
    .isFloat({ min: 0.01 })
    .withMessage('Payment amount must be > 0'),
  body('paymentDate')
    .optional()
    .isISO8601()
    .withMessage('Valid payment date is required'),
  body('paymentMethod')
    .optional()
    .isIn(['cash', 'bank_transfer', 'credit_card', 'check', 'other'])
    .withMessage('Payment method must be one of: cash, bank_transfer, credit_card, check, other'),
  body('referenceNumber')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Reference number must be <= 100 characters'),
  body('notes')
    .optional()
    .trim(),
];

// Routes
router.post('/:id/payments', createPaymentValidation, handleValidationErrors, recordPayment);
router.put('/:id/payments/:paymentId', updatePaymentValidation, handleValidationErrors, update);
router.delete('/:id/payments/:paymentId', remove);

export default router;


