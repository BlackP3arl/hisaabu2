import express from 'express';
import {
  generateShareLink,
  getShareLink,
  verifyPassword,
  deactivate,
} from '../controllers/shareLinkController.js';
import { authenticate } from '../middleware/auth.js';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// Validation middleware
const createShareLinkValidation = [
  body('documentType')
    .notEmpty()
    .isIn(['invoice', 'quotation'])
    .withMessage('Document type must be "invoice" or "quotation"'),
  body('documentId')
    .notEmpty()
    .isInt()
    .withMessage('Document ID must be a valid integer'),
  body('password')
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Password cannot be empty if provided'),
  body('expiresAt')
    .optional()
    .isISO8601()
    .withMessage('Expiration date must be a valid date'),
];

const verifyPasswordValidation = [
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

// All routes require authentication
router.use(authenticate);

// Protected routes
router.post('/', createShareLinkValidation, handleValidationErrors, generateShareLink);
router.get('/:token', getShareLink);
router.post('/:token/verify', verifyPasswordValidation, handleValidationErrors, verifyPassword);
router.delete('/:token', deactivate);

export default router;

