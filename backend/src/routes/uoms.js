import express from 'express';
import { body } from 'express-validator';
import {
  listUoms,
  getUom,
  create,
  update,
  remove,
} from '../controllers/uomController.js';
import { authenticate } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation middleware
const createUomValidation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name is required and must be between 1 and 255 characters'),
  body('code')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Code is required and must be between 1 and 50 characters'),
];

const updateUomValidation = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters'),
  body('code')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Code must be between 1 and 50 characters'),
];

// Routes
router.get('/', listUoms);
router.get('/:id', getUom);
router.post('/', createUomValidation, handleValidationErrors, create);
router.put('/:id', updateUomValidation, handleValidationErrors, update);
router.delete('/:id', remove);

export default router;

