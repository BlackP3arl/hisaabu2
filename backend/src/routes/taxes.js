import express from 'express';
import { 
  getAllTaxes, 
  getTaxById, 
  create, 
  update, 
  remove,
  initializeGST 
} from '../controllers/taxController.js';
import { authenticate } from '../middleware/auth.js';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation middleware
const createTaxValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Tax name is required')
    .isLength({ min: 1, max: 100 })
    .withMessage('Tax name must be between 1 and 100 characters'),
  body('rate')
    .notEmpty()
    .withMessage('Tax rate is required')
    .custom((value) => {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0 || num > 100) {
        throw new Error('Tax rate must be between 0 and 100');
      }
      return true;
    }),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean')
    .toBoolean(),
];

const updateTaxValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Tax name cannot be empty')
    .isLength({ min: 1, max: 100 })
    .withMessage('Tax name must be between 1 and 100 characters'),
  body('rate')
    .optional()
    .custom((value) => {
      if (value === undefined || value === null) return true;
      const num = parseFloat(value);
      if (isNaN(num) || num < 0 || num > 100) {
        throw new Error('Tax rate must be between 0 and 100');
      }
      return true;
    }),
  body('isDefault')
    .optional()
    .isBoolean()
    .withMessage('isDefault must be a boolean')
    .toBoolean(),
];

// Routes
router.get('/', getAllTaxes);
router.get('/:id', getTaxById);
router.post('/', createTaxValidation, handleValidationErrors, create);
router.put('/:id', updateTaxValidation, handleValidationErrors, update);
router.delete('/:id', remove);
router.post('/initialize-gst', initializeGST);

export default router;

