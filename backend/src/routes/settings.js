import express from 'express';
import multer from 'multer';
import path from 'path';
import { getSettings, update, uploadLogo } from '../controllers/settingsController.js';
import { authenticate } from '../middleware/auth.js';
import { body } from 'express-validator';
import { handleValidationErrors } from '../middleware/validation.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/logos/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (jpeg, jpg, png, gif) are allowed'));
    }
  },
});

// Validation middleware
const updateSettingsValidation = [
  body('companyName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Company name must be between 1 and 255 characters'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email format'),
  body('defaultTaxRate')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Default tax rate must be between 0 and 100'),
  body('currency')
    .optional()
    .isLength({ min: 3, max: 3 })
    .withMessage('Currency must be a 3-character ISO code'),
  body('invoicePrefix')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Invoice prefix must be between 1 and 20 characters'),
  body('quotationPrefix')
    .optional()
    .trim()
    .isLength({ min: 1, max: 20 })
    .withMessage('Quotation prefix must be between 1 and 20 characters'),
];

// Routes
router.get('/', getSettings);
router.put('/', updateSettingsValidation, handleValidationErrors, update);
router.post('/logo', upload.single('logo'), uploadLogo);

export default router;



