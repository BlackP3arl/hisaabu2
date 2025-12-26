import express from 'express';
import { body, query as queryValidator } from 'express-validator';
import {
  listClients,
  getClient,
  create,
  update,
  remove,
} from '../controllers/clientController.js';
import { authenticate } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation middleware
const createClientValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name is required and must be between 1 and 255 characters'),
  body('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone must be 50 characters or less'),
  body('address')
    .optional()
    .trim(),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must be 100 characters or less'),
  body('postalCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Postal code must be 20 characters or less'),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country must be 100 characters or less'),
  body('companyName')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Company name must be 255 characters or less'),
  body('taxId')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Tax ID must be 100 characters or less'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
  body('notes')
    .optional()
    .trim(),
];

const updateClientValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 50 })
    .withMessage('Phone must be 50 characters or less'),
  body('address')
    .optional()
    .trim(),
  body('city')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('City must be 100 characters or less'),
  body('postalCode')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Postal code must be 20 characters or less'),
  body('country')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Country must be 100 characters or less'),
  body('companyName')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Company name must be 255 characters or less'),
  body('taxId')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Tax ID must be 100 characters or less'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
  body('notes')
    .optional()
    .trim(),
];

const queryValidation = [
  queryValidator('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  queryValidator('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  queryValidator('status').optional().isIn(['all', 'active', 'inactive']).withMessage('Invalid status'),
  queryValidator('search').optional().trim(),
  queryValidator('sort').optional().isIn(['name', 'email', 'created_at', 'updated_at']).withMessage('Invalid sort field'),
  queryValidator('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
];

// Routes
router.get('/', queryValidation, handleValidationErrors, listClients);
router.get('/:id', getClient);
router.post('/', createClientValidation, handleValidationErrors, create);
router.put('/:id', updateClientValidation, handleValidationErrors, update);
router.delete('/:id', remove);

export default router;
