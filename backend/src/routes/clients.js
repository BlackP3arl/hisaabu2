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
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'new', 'overdue'])
    .withMessage('Status must be one of: active, inactive, new, overdue'),
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
  body('status')
    .optional()
    .isIn(['active', 'inactive', 'new', 'overdue'])
    .withMessage('Status must be one of: active, inactive, new, overdue'),
];

const queryValidation = [
  queryValidator('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  queryValidator('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  queryValidator('status').optional().isIn(['all', 'active', 'inactive', 'new', 'overdue']).withMessage('Invalid status'),
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

