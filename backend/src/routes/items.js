import express from 'express';
import { body, query as queryValidator } from 'express-validator';
import {
  listItems,
  getItem,
  create,
  update,
  remove,
} from '../controllers/itemController.js';
import { authenticate } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation middleware
const createItemValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name is required and must be between 1 and 255 characters'),
  body('rate')
    .isFloat({ min: 0 })
    .withMessage('Rate is required and must be >= 0'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
  body('categoryId')
    .optional()
    .isInt()
    .withMessage('Category ID must be an integer'),
  body('uomId')
    .optional()
    .isInt()
    .withMessage('UOM ID must be an integer'),
  body('description')
    .optional()
    .trim(),
];

const updateItemValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('rate')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Rate must be >= 0'),
  body('status')
    .optional()
    .isIn(['active', 'inactive'])
    .withMessage('Status must be active or inactive'),
  body('categoryId')
    .optional()
    .isInt()
    .withMessage('Category ID must be an integer'),
  body('uomId')
    .optional()
    .isInt()
    .withMessage('UOM ID must be an integer'),
  body('description')
    .optional()
    .trim(),
];

const queryValidation = [
  queryValidator('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  queryValidator('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  queryValidator('categoryId').optional().isInt().withMessage('Category ID must be an integer'),
  queryValidator('status').optional().isIn(['all', 'active', 'inactive']).withMessage('Invalid status'),
  queryValidator('sort').optional().isIn(['name', 'rate', 'created_at', 'updated_at']).withMessage('Invalid sort field'),
  queryValidator('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
];

// Routes
router.get('/', queryValidation, handleValidationErrors, listItems);
router.get('/:id', getItem);
router.post('/', createItemValidation, handleValidationErrors, create);
router.put('/:id', updateItemValidation, handleValidationErrors, update);
router.delete('/:id', remove);

export default router;

