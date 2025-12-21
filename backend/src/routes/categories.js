import express from 'express';
import { body, query as queryValidator } from 'express-validator';
import {
  listCategories,
  getCategory,
  create,
  update,
  remove,
} from '../controllers/categoryController.js';
import { authenticate } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation middleware
const createCategoryValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name is required and must be between 1 and 255 characters'),
  body('color')
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Valid hex color is required (e.g., #3B82F6)'),
  body('description')
    .optional()
    .trim(),
];

const updateCategoryValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('color')
    .optional()
    .matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/)
    .withMessage('Valid hex color is required'),
  body('description')
    .optional()
    .trim(),
];

const queryValidation = [
  queryValidator('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  queryValidator('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  queryValidator('sort').optional().isIn(['name', 'created_at', 'updated_at', 'item_count']).withMessage('Invalid sort field'),
  queryValidator('order').optional().isIn(['asc', 'desc']).withMessage('Order must be asc or desc'),
];

// Routes
router.get('/', queryValidation, handleValidationErrors, listCategories);
router.get('/:id', getCategory);
router.post('/', createCategoryValidation, handleValidationErrors, create);
router.put('/:id', updateCategoryValidation, handleValidationErrors, update);
router.delete('/:id', remove);

export default router;

